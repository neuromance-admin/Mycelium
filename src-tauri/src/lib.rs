use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::State;

// ─── Vault Identity ────────────────────────────────────────────────────────

#[derive(serde::Serialize)]
struct VaultIdentity {
    vmd_id: String,
    vault_name: String,
    ai_name: String,
    spore_version: String,
    persona_mode: String,
    persona_dir: String,
    health: String,         // "healthy" | "warning" | "error"
    health_message: String,
}

#[tauri::command]
fn read_vault_identity(path: String) -> Result<VaultIdentity, String> {
    let identity_path = std::path::Path::new(&path).join("System/VaultIdentity.md");
    let content = std::fs::read_to_string(&identity_path)
        .map_err(|e| format!("Cannot read VaultIdentity.md: {}", e))?;

    let mut vmd_id = String::new();
    let mut ai_name = String::new();
    let mut spore_version = String::new();
    let mut vault_name = String::new();
    let mut persona_mode = String::new();
    let mut persona_dir = String::new();

    let parts: Vec<&str> = content.splitn(3, "---").collect();
    if parts.len() >= 3 {
        for line in parts[1].lines() {
            if let Some((key, val)) = line.split_once(':') {
                let k = key.trim();
                let v = val.trim().trim_matches('"').to_string();
                match k {
                    "vmdId"        => vmd_id       = v,
                    "aiName"       => ai_name       = v,
                    "sporeVersion" => spore_version = v,
                    _ => {}
                }
            }
        }
        for line in parts[2].lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("- ") {
                if let Some((key, val)) = trimmed.trim_start_matches("- ").split_once(':') {
                    let k = key.trim().trim_matches('*').trim();
                    let v = val.trim().trim_matches('*').trim().to_string();
                    match k {
                        "AI Name"       => { if ai_name.is_empty()       { ai_name = v; } }
                        "Spore Version" => { if spore_version.is_empty() { spore_version = v; } }
                        "Vault Name"    => { if vault_name.is_empty()    { vault_name = v; } }
                        "VMD ID"        => { if vmd_id.is_empty()        { vmd_id = v; } }
                        "personaMode"   => { if persona_mode.is_empty()  { persona_mode = v; } }
                        "personaDir"    => { if persona_dir.is_empty()   { persona_dir = v; } }
                        _ => {}
                    }
                }
            } else if trimmed.starts_with("# ") && vault_name.is_empty() {
                let heading = trimmed.trim_start_matches("# ");
                vault_name = heading
                    .split_once(" \u{2014} ")
                    .map(|(_, name)| name.trim().to_string())
                    .unwrap_or_default();
            }
        }
    }

    if vault_name.is_empty() {
        vault_name = std::path::Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown Vault")
            .to_string();
    }

    let (health, health_message) = if spore_version.is_empty() {
        ("warning".to_string(), "Spore version not detected".to_string())
    } else if spore_version != "0.5.1b" {
        ("warning".to_string(), format!("Spore upgrade needed ({} → 0.5.1b)", spore_version))
    } else if persona_mode == "external" && !persona_dir.is_empty() {
        let resolved = std::path::Path::new(&path).join(&persona_dir);
        if !resolved.exists() {
            ("warning".to_string(), "Persona directory not found".to_string())
        } else {
            ("healthy".to_string(), String::new())
        }
    } else {
        ("healthy".to_string(), String::new())
    };

    Ok(VaultIdentity { vmd_id, vault_name, ai_name, spore_version, persona_mode, persona_dir, health, health_message })
}

// ─── Claude CLI detection ─────────────────────────────────────────────────

#[derive(serde::Serialize)]
struct CliStatus {
    installed: bool,
    version: String,
}

#[tauri::command]
fn check_claude_cli() -> CliStatus {
    let found = std::process::Command::new("which")
        .arg("claude")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if !found {
        return CliStatus { installed: false, version: String::new() };
    }

    let version = std::process::Command::new("claude")
        .arg("--version")
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default();

    CliStatus { installed: !version.is_empty(), version }
}

// ─── Open in Finder / Obsidian / Terminal ─────────────────────────────────

#[tauri::command]
fn open_in_finder(path: String) -> Result<(), String> {
    std::process::Command::new("open")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_in_obsidian(path: String) -> Result<(), String> {
    let encoded: String = path.chars().map(|c| match c {
        ' ' => "%20".to_string(),
        '%' => "%25".to_string(),
        '?' => "%3F".to_string(),
        '#' => "%23".to_string(),
        '&' => "%26".to_string(),
        _   => c.to_string(),
    }).collect();
    std::process::Command::new("open")
        .arg(format!("obsidian://open?path={}", encoded))
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_in_terminal(path: String, launch_claude: bool) -> Result<(), String> {
    if launch_claude {
        // Connect mode: open Terminal.app with claude running — reliable for interactive AI sessions
        let safe_path = path.replace('\'', "'\\''");
        let shell_cmd = format!(
            "cd '{}' && claude 'Read _Spore-v0.5.1b.md and run it as the vault runtime. Perform the full bootstrap check, lifecycle detection, and complete read sequence. End with the handshake.'",
            safe_path
        );
        let script = format!(
            "tell application \"Terminal\"\nactivate\ndo script \"{}\"\nend tell",
            shell_cmd.replace('"', "\\\"")
        );
        std::process::Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .spawn()
            .map_err(|e| e.to_string())?;
    } else {
        // Terminal mode: open VS Code at vault root
        std::process::Command::new("open")
            .args(["-a", "Visual Studio Code", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─── App entry point ──────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_vault_identity,
            check_claude_cli,
            open_in_finder,
            open_in_obsidian,
            open_in_terminal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
