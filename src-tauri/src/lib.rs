use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State};

struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
}

struct AppState {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
}

#[tauri::command]
fn pty_create(
    window: tauri::Window,
    session_id: String,
    vault_path: String,
    cols: u16,
    rows: u16,
    launch_claude: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pty_system = native_pty_system();

    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let mut cmd = CommandBuilder::new(&shell);
    cmd.cwd(&vault_path);
    cmd.env("TERM", "xterm-256color");
    cmd.env("LANG", "en_US.UTF-8");

    let _child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    let session = PtySession {
        writer,
        master: pair.master,
    };

    {
        let mut sessions = state.sessions.lock().unwrap();
        sessions.insert(session_id.clone(), session);
    }

    if launch_claude {
        let sessions_arc = state.sessions.clone();
        let sid = session_id.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(300));
            let cmd = "claude 'Read _Spore-v0.4.0.md and run it as the vault runtime. Perform the full bootstrap check, lifecycle detection, and complete read sequence. End with the handshake.'\r\n";
            let mut guard = sessions_arc.lock().unwrap();
            if let Some(s) = guard.get_mut(&sid) {
                let _ = s.writer.write_all(cmd.as_bytes());
            }
        });
    }

    let event_name = format!("pty-data-{}", session_id);
    std::thread::spawn(move || {
        let mut buf = vec![0u8; 4096];
        let mut accumulator: Vec<u8> = Vec::with_capacity(8192);
        let mut last_emit = std::time::Instant::now();

        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    accumulator.extend_from_slice(&buf[..n]);
                    let elapsed = last_emit.elapsed().as_millis();
                    if elapsed >= 16 || accumulator.len() > 8192 {
                        let data = String::from_utf8_lossy(&accumulator).to_string();
                        let _ = window.emit(&event_name, data);
                        accumulator.clear();
                        last_emit = std::time::Instant::now();
                    }
                }
            }
        }

        if !accumulator.is_empty() {
            let data = String::from_utf8_lossy(&accumulator).to_string();
            let _ = window.emit(&event_name, data);
        }
    });

    Ok(())
}

#[tauri::command]
fn pty_resize(
    session_id: String,
    cols: u16,
    rows: u16,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let guard = state.sessions.lock().unwrap();
    if let Some(session) = guard.get(&session_id) {
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn pty_write(
    session_id: String,
    data: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut guard = state.sessions.lock().unwrap();
    if let Some(session) = guard.get_mut(&session_id) {
        // Normalise bare CR → CR+LF so shells in both canonical and cbreak
        // mode reliably treat Enter as "execute".
        let normalised = if data == "\r" {
            "\r\n".to_string()
        } else {
            data
        };
        session
            .writer
            .write_all(normalised.as_bytes())
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn pty_close(session_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut guard = state.sessions.lock().unwrap();
    guard.remove(&session_id);
    Ok(())
}

#[derive(serde::Serialize)]
struct VaultIdentity {
    vmd_id: String,
    vault_name: String,
    ai_name: String,
    spore_version: String,
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

    // Parse YAML frontmatter between the first two --- markers
    let parts: Vec<&str> = content.splitn(3, "---").collect();
    if parts.len() >= 3 {
        for line in parts[1].lines() {
            if let Some((key, val)) = line.split_once(':') {
                let k = key.trim();
                let v = val.trim().trim_matches('"').to_string();
                match k {
                    "vmdId"        => vmd_id        = v,
                    "aiName"       => ai_name        = v,
                    "sporeVersion" => spore_version  = v,
                    _ => {}
                }
            }
        }
        // Extract vault name from the H1 heading: "# Vault Identity — [Name]"
        for line in parts[2].lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("# ") {
                let heading = trimmed.trim_start_matches("# ");
                // Split on em-dash separator " — "
                vault_name = heading
                    .split_once(" \u{2014} ")
                    .map(|(_, name)| name.trim().to_string())
                    .unwrap_or_else(|| heading.trim().to_string());
                break;
            }
        }
    }

    // Fallback: use the folder name
    if vault_name.is_empty() {
        vault_name = std::path::Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown Vault")
            .to_string();
    }

    Ok(VaultIdentity { vmd_id, vault_name, ai_name, spore_version })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let sessions: Arc<Mutex<HashMap<String, PtySession>>> =
        Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState { sessions })
        .invoke_handler(tauri::generate_handler![
            pty_create,
            pty_resize,
            pty_write,
            pty_close,
            read_vault_identity,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
