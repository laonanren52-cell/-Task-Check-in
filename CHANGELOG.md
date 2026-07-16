# Changelog

All notable SummerFlow changes are recorded here. Versions follow Semantic Versioning.

## [0.1.1] - 2026-07-17

### Fixed

- 修复 GitHub Actions updater metadata 生成与 `latest.json` 上传链路。
- 修复 `latest.json` 缺失时缺少发布资产和构建产物诊断的问题。
- 完成 Tauri 自动更新发布链路配置。

## [0.1.0] - 2026-07-16

### Added

- React、TypeScript、Vite、Dexie Local First 学习打卡系统。
- Web、PWA 与 Tauri 2 Windows 桌面壳共享同一套页面和业务逻辑。
- Windows NSIS/MSI 构建配置、品牌图标与固定应用标识 `com.summerflow.studytracker`。
- GitHub Releases 签名自动更新、真实下载进度、手动/自动检查和更新前安全备份。
- 桌面文件备份、最近 5 份自动备份轮换、日志目录和诊断导出。
- IndexedDB v2→v3 数据迁移和只读恢复模式。
