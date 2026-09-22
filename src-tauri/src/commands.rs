// Pace — Tauri application commands
//
// Commands:
//   store_get_all      (called on boot via JS bridge)
//   store_set_all      (hydrates persisted store)
//   store_clear        (clears store)
//   store_get_path     (returns data file path)
//   send_notification  (triggers native desktop notification)
//   autostart_is_enabled / autostart_set (OS startup configuration)

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use serde_json::Value;
use tauri::{AppHandle, Manager, State};

// ── In-memory store ──────────────────────────────────────────────────────────

pub struct StoreState(pub Mutex<HashMap<String, Value>>);

fn store_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to resolve app data dir")
        .join("pace-data.json")
}

fn persist(app: &AppHandle, data: &HashMap<String, Value>) {
    let path = store_path(app);
    let bak = path.with_extension("json.bak");
    let tmp = path.with_extension("json.tmp");
    if let Ok(json) = serde_json::to_string(data) {
        if std::fs::write(&tmp, &json).is_ok() {
            if path.exists() {
                let _ = std::fs::copy(&path, &bak);
            }
            let _ = std::fs::rename(&tmp, &path);
        }
    }
}

pub fn load_store(app: &AppHandle) -> HashMap<String, Value> {
    let path = store_path(app);
    let bak = path.with_extension("json.bak");
    let old_path = app
        .path()
        .app_data_dir()
        .map(|d| d.join("lockin-data.json"))
        .unwrap_or_default();
    
    if let Ok(contents) = std::fs::read_to_string(&path) {
        if let Ok(map) = serde_json::from_str::<HashMap<String, Value>>(&contents) {
            return map;
        }
    }
    if let Ok(contents) = std::fs::read_to_string(&bak) {
        if let Ok(map) = serde_json::from_str::<HashMap<String, Value>>(&contents) {
            return map;
        }
    }
    if old_path.exists() {
        if let Ok(contents) = std::fs::read_to_string(&old_path) {
            if let Ok(map) = serde_json::from_str::<HashMap<String, Value>>(&contents) {
                return map;
            }
        }
    }
    HashMap::new()
}

// ── Commands ─────────────────────────────────────────────────────────────────

/// Called once on boot by the JS bridge to hydrate localStorage.
#[tauri::command]
pub fn store_get_all(state: State<'_, StoreState>) -> HashMap<String, Value> {
    state.0.lock().unwrap().clone()
}

/// Bulk-replace the store (called on every localStorage sync).
#[tauri::command]
pub fn store_set_all(
    app: AppHandle,
    state: State<'_, StoreState>,
    data: HashMap<String, Value>,
) -> bool {
    // Validate: only keys starting with "li_", total size ≤ 4 MB
    let mut sanitized = HashMap::new();
    let mut total = 0usize;
    for (k, v) in &data {
        if !k.starts_with("li_") {
            continue;
        }
        let size = serde_json::to_string(v).map(|s| s.len()).unwrap_or(0);
        total += size;
        if total > 4_194_304 {
            return false;
        }
        sanitized.insert(k.clone(), v.clone());
    }
    *state.0.lock().unwrap() = sanitized.clone();
    persist(&app, &sanitized);
    true
}

/// Wipe the store.
#[tauri::command]
pub fn store_clear(app: AppHandle, state: State<'_, StoreState>) -> bool {
    *state.0.lock().unwrap() = HashMap::new();
    persist(&app, &HashMap::new());
    true
}

/// Returns the path to the JSON data file (shown in settings).
#[tauri::command]
pub fn store_get_path(app: AppHandle) -> String {
    store_path(&app).to_string_lossy().to_string()
}

#[tauri::command]
pub fn send_notification(_app: AppHandle, title: String, body: String) -> bool {
    #[cfg(windows)]
    {
        use winrt_notification::{Toast, Sound};
        let _ = Toast::new("com.queirospedro.pace")
            .title(&title)
            .text1(&body)
            .sound(Some(Sound::Default))
            .show();
    }
    
    #[cfg(not(windows))]
    {
        use tauri_plugin_notification::NotificationExt;
        let _ = _app
            .notification()
            .builder()
            .title(title)
            .body(body)
            .sound("default")
            .show();
    }
    true
}

#[tauri::command]
pub fn set_window_size(app: AppHandle, width: u32, height: u32, center: Option<bool>) -> bool {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: width as f64,
            height: height as f64,
        }));
        if center.unwrap_or(true) {
            let _ = window.center();
        }
        return true;
    }
    false
}

#[tauri::command]
pub fn autostart_is_enabled() -> bool {
    #[cfg(windows)]
    {
        use winreg::enums::*;
        use winreg::RegKey;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok(key) = hkcu.open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run") {
            let val: Result<String, _> = key.get_value("Pace");
            return val.is_ok();
        }
    }
    false
}

#[tauri::command]
pub fn autostart_set(enable: bool) -> bool {
    #[cfg(windows)]
    {
        use winreg::enums::*;
        use winreg::RegKey;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok(key) = hkcu.open_subkey_with_flags(
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            KEY_WRITE | KEY_READ,
        ) {
            if enable {
                if let Ok(exe_path) = std::env::current_exe() {
                    let _ = key.set_value("Pace", &exe_path.to_string_lossy().as_ref());
                    return true;
                }
            } else {
                let _ = key.delete_value("Pace");
                return true;
            }
        }
    }
    false
}



