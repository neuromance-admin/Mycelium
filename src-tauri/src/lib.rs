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
            let cmd = "claude 'Read _Spore-v0.4.0.md and run it as the vault runtime. Perform the full bootstrap check, lifecycle detection, and complete read sequence. End with the handshake.'\r";
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
        session
            .writer
            .write_all(data.as_bytes())
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let sessions: Arc<Mutex<HashMap<String, PtySession>>> =
        Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState { sessions })
        .invoke_handler(tauri::generate_handler![
            pty_create,
            pty_resize,
            pty_write,
            pty_close
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
