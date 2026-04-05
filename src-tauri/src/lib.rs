use tauri::Manager;

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

// ─── Terminal detection ──────────────────────────────────────────────────

#[derive(serde::Serialize)]
struct TerminalApp {
    id: String,
    name: String,
    path: String,
}

#[tauri::command]
fn list_terminals() -> Vec<TerminalApp> {
    let home = std::env::var("HOME").unwrap_or_default();
    let candidates: Vec<(&str, &str, Vec<String>)> = vec![
        ("terminal", "Terminal", vec![
            "/System/Applications/Utilities/Terminal.app".to_string(),
            "/Applications/Utilities/Terminal.app".to_string(),
        ]),
        ("iterm", "iTerm2", vec![
            "/Applications/iTerm.app".to_string(),
            format!("{}/Applications/iTerm.app", home),
        ]),
        ("warp", "Warp", vec![
            "/Applications/Warp.app".to_string(),
            format!("{}/Applications/Warp.app", home),
        ]),
        ("ghostty", "Ghostty", vec![
            "/Applications/Ghostty.app".to_string(),
            format!("{}/Applications/Ghostty.app", home),
        ]),
        ("kitty", "kitty", vec![
            "/Applications/kitty.app".to_string(),
            format!("{}/Applications/kitty.app", home),
        ]),
        ("alacritty", "Alacritty", vec![
            "/Applications/Alacritty.app".to_string(),
            format!("{}/Applications/Alacritty.app", home),
        ]),
    ];

    let mut found = Vec::new();
    for (id, name, paths) in candidates {
        for p in paths {
            if std::path::Path::new(&p).exists() {
                found.push(TerminalApp {
                    id: id.to_string(),
                    name: name.to_string(),
                    path: p,
                });
                break;
            }
        }
    }
    found
}

// Run a shell command in the user's chosen terminal. Only Terminal.app and iTerm2
// support reliable scripted command injection on macOS; for anything else we fall
// back to Terminal.app so the command still executes.
fn run_shell_in_terminal(terminal_id: &str, shell_cmd: &str) -> Result<(), String> {
    let escaped = shell_cmd.replace('\\', "\\\\").replace('"', "\\\"");
    let script = match terminal_id {
        "iterm" => format!(
            "tell application \"iTerm\"\n\
             activate\n\
             if (count of windows) = 0 then\n\
               create window with default profile\n\
             else\n\
               tell current window to create tab with default profile\n\
             end if\n\
             tell current session of current window to write text \"{}\"\n\
             end tell",
            escaped
        ),
        // Terminal.app — also the fallback for non-scriptable terminals
        _ => format!(
            "tell application \"Terminal\"\nactivate\ndo script \"{}\"\nend tell",
            escaped
        ),
    };
    std::process::Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Open a terminal at a path without executing a command. Scriptable terminals get
// a cd via AppleScript; others are launched via `open -a` at the path.
fn open_terminal_at_path(terminal_id: &str, path: &str) -> Result<(), String> {
    match terminal_id {
        "terminal" | "iterm" => {
            let safe_path = path.replace('\'', "'\\''");
            let shell_cmd = format!("cd '{}'", safe_path);
            run_shell_in_terminal(terminal_id, &shell_cmd)
        }
        other => {
            let app_name = match other {
                "warp" => "Warp",
                "ghostty" => "Ghostty",
                "kitty" => "kitty",
                "alacritty" => "Alacritty",
                _ => "Terminal",
            };
            std::process::Command::new("open")
                .arg("-a")
                .arg(app_name)
                .arg(path)
                .spawn()
                .map_err(|e| e.to_string())?;
            Ok(())
        }
    }
}

#[tauri::command]
fn open_in_terminal(path: String, launch_claude: bool, terminal_app: String) -> Result<(), String> {
    if launch_claude {
        // Connect mode requires command execution. Only Terminal.app and iTerm2 support it
        // reliably — route others through Terminal.app so the Claude session still lands.
        let safe_path = path.replace('\'', "'\\''");
        let shell_cmd = format!(
            "cd '{}' && claude 'Read _Spore-v0.5.1b.md and run it as the vault runtime. Perform the full bootstrap check, lifecycle detection, and complete read sequence. End with the handshake.'",
            safe_path
        );
        let target = if terminal_app == "iterm" { "iterm" } else { "terminal" };
        run_shell_in_terminal(target, &shell_cmd)
    } else {
        open_terminal_at_path(&terminal_app, &path)
    }
}

// ─── Install new vault via Claude CLI ────────────────────────────────────

#[tauri::command]
fn install_vault(app_handle: tauri::AppHandle, path: String, terminal_app: String) -> Result<(), String> {
    // Copy bundled installer file into the chosen directory
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("resources/_MyceliumInstaller-v0.5.1b.md");
    let dest = std::path::Path::new(&path).join("_MyceliumInstaller-v0.5.1b.md");
    std::fs::copy(&resource_path, &dest)
        .map_err(|e| format!("Failed to copy installer file: {}", e))?;

    // Run Claude against the installer file in the user's chosen terminal
    // (falls back to Terminal.app for terminals without scripted command injection)
    let safe_path = path.replace('\'', "'\\''");
    let shell_cmd = format!(
        "cd '{}' && claude 'Read _MyceliumInstaller-v0.5.1b.md and execute the install procedure.'",
        safe_path
    );
    let target = if terminal_app == "iterm" { "iterm" } else { "terminal" };
    run_shell_in_terminal(target, &shell_cmd)
}

// ─── Upgrade vault via Claude CLI ────────────────────────────────────────

#[tauri::command]
fn upgrade_vault(app_handle: tauri::AppHandle, path: String, terminal_app: String) -> Result<(), String> {
    // Copy bundled upgrade file into the vault root
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("resources/_SporeUpgrade-v0.5.1b.md");
    let dest = std::path::Path::new(&path).join("_SporeUpgrade-v0.5.1b.md");
    std::fs::copy(&resource_path, &dest)
        .map_err(|e| format!("Failed to copy upgrade file: {}", e))?;

    // Run Claude against the upgrade file in the user's chosen terminal
    let safe_path = path.replace('\'', "'\\''");
    let shell_cmd = format!(
        "cd '{}' && claude 'Read _SporeUpgrade-v0.5.1b.md and execute the upgrade procedure.'",
        safe_path
    );
    let target = if terminal_app == "iterm" { "iterm" } else { "terminal" };
    run_shell_in_terminal(target, &shell_cmd)
}

// ─── Open persona file in Obsidian ───────────────────────────────────────

#[tauri::command]
fn open_persona_in_obsidian(file_path: String) -> Result<(), String> {
    let encoded: String = file_path.chars().map(|c| match c {
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

// ─── App entry point ──────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_vault_identity,
            list_terminals,
            open_in_finder,
            open_in_obsidian,
            open_in_terminal,
            install_vault,
            upgrade_vault,
            open_persona_in_obsidian,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
