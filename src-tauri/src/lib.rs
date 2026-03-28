use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State};

struct PtyWriter(Box<dyn Write + Send>);

struct AppState {
    writer: Arc<Mutex<Option<PtyWriter>>>,
    master: Arc<Mutex<Option<Box<dyn MasterPty + Send>>>>,
}

#[tauri::command]
fn pty_create(
    window: tauri::Window,
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

    *state.writer.lock().unwrap() = Some(PtyWriter(writer));
    *state.master.lock().unwrap() = Some(pair.master);

    if launch_claude {
        let writer_state = state.writer.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(300));
            let cmd = "claude 'Read _Spore-v0.4.0.md and run it as the vault runtime. Perform the full bootstrap check, lifecycle detection, and complete read sequence. End with the handshake.'\r";
            let mut guard = writer_state.lock().unwrap();
            if let Some(PtyWriter(w)) = guard.as_mut() {
                let _ = w.write_all(cmd.as_bytes());
            }
        });
    }

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
                        let _ = window.emit("pty-data", data);
                        accumulator.clear();
                        last_emit = std::time::Instant::now();
                    }
                }
            }
        }

        if !accumulator.is_empty() {
            let data = String::from_utf8_lossy(&accumulator).to_string();
            let _ = window.emit("pty-data", data);
        }
    });

    Ok(())
}

#[tauri::command]
fn pty_resize(cols: u16, rows: u16, state: State<'_, AppState>) -> Result<(), String> {
    let guard = state.master.lock().unwrap();
    if let Some(master) = guard.as_ref() {
        master
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
fn pty_write(data: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut guard = state.writer.lock().unwrap();
    if let Some(PtyWriter(w)) = guard.as_mut() {
        w.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let writer: Arc<Mutex<Option<PtyWriter>>> = Arc::new(Mutex::new(None));
    let master: Arc<Mutex<Option<Box<dyn MasterPty + Send>>>> = Arc::new(Mutex::new(None));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState { writer, master })
        .invoke_handler(tauri::generate_handler![pty_create, pty_resize, pty_write])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
