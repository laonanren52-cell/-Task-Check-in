use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(
      tauri_plugin_log::Builder::new()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .setup(|app| {
      let salt_path = app.path().app_local_data_dir().expect("could not resolve app local data path").join("summerflow-stronghold.salt");
      app.handle().plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running SummerFlow");
}
