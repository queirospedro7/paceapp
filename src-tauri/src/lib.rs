// Pace — Tauri application entry point

mod commands;

use commands::{load_store, StoreState};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg(target_os = "windows")]
fn set_app_user_model_id(icon_path: &std::path::Path) {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use winreg::enums::*;
    use winreg::RegKey;

    let app_id: Vec<u16> = OsStr::new("com.queirospedro.pace")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    extern "system" {
        fn SetCurrentProcessExplicitAppUserModelID(AppID: *const u16) -> i32;
    }

    unsafe {
        let _ = SetCurrentProcessExplicitAppUserModelID(app_id.as_ptr());
    }

    // Direct Win32 Registry API — 0ms, zero process spawns, zero CMD console windows
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok((key, _)) = hkcu.create_subkey(r"Software\Classes\AppUserModelId\com.queirospedro.pace") {
        let _ = key.set_value("DisplayName", &"Pace");
        let _ = key.set_value("IconUri", &icon_path.to_string_lossy().as_ref());
    }

    if let Ok(settings_key) = hkcu.open_subkey_with_flags(
        r"Software\Microsoft\Windows\CurrentVersion\Notifications\Settings",
        KEY_WRITE | KEY_READ,
    ) {
        for old in &[
            "com.queirospedro.lockin",
            "com.squirrel.lockin.lockin",
            "lockin",
            "Electron",
            "electron.app.lockin",
        ] {
            let _ = settings_key.delete_subkey_all(old);
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        // ── Plugins ───────────────────────────────────────────────────────────
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_single_instance::init(|app, _args, _cwd| {
                // Focus the existing window when a second instance is launched
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }),
        )
        // ── State & Tray Setup ────────────────────────────────────────────────
        .setup(|app| {
            // Ensure app data directory exists
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");
            std::fs::create_dir_all(&data_dir)?;
            let icon_bytes = include_bytes!("../icons/icon.ico");
            let icon_file = data_dir.join("icon.ico");
            let _ = std::fs::write(&icon_file, icon_bytes);
            let png_bytes = include_bytes!("../icons/icon.png");
            let png_file = data_dir.join("icon.png");
            let _ = std::fs::write(&png_file, png_bytes);

            #[cfg(target_os = "windows")]
            set_app_user_model_id(&icon_file);

            // Load persisted store into memory
            let initial = load_store(app.handle());
            app.manage(StoreState(Mutex::new(initial)));

            // Setup System Tray
            let show_i = MenuItem::with_id(app, "show", "Abrir Pace", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Sair do Pace", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let default_icon = app.default_window_icon().cloned();

            let mut tray_builder = TrayIconBuilder::new().menu(&menu);
            if let Some(ref icon) = default_icon {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Show the window after setup with explicit icon and initial dark window theme
            if let Some(window) = app.get_webview_window("main") {
                if let Some(ref icon) = default_icon {
                    let _ = window.set_icon(icon.clone());
                }
                #[cfg(windows)]
                if let Ok(hwnd) = window.hwnd() {
                    commands::apply_dwm_theme(hwnd.0 as *mut std::ffi::c_void, "#000000", true);
                }
                let _ = window.show();
            }

            Ok(())
        })
        // ── Window Event: Hide to Tray on Close ───────────────────────────────
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                let _ = window.hide();
                api.prevent_close();
            }
            _ => {}
        })
        // ── Commands ──────────────────────────────────────────────────────────
        .invoke_handler(tauri::generate_handler![
            commands::store_get_all,
            commands::store_set_all,
            commands::store_clear,
            commands::store_get_path,
            commands::send_notification,
            commands::set_window_size,
            commands::autostart_is_enabled,
            commands::autostart_set,
            commands::set_window_theme_color,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pace");
}
