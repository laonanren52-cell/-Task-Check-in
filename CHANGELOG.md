# Changelog

All notable SummerFlow changes are recorded here. Versions follow Semantic Versioning.

## [0.1.4] - 2026-07-18

### Fixed

- 修复任务编辑抽屉在首次输入后错误夺取焦点的问题；任务名称、具体子任务、完成结果和备注现在可以连续输入。
- 新增任务编辑抽屉的输入焦点回归测试，覆盖中文输入法组合、粘贴、删除与多行文本场景。

## [0.1.2] - 2026-07-17

### Fixed

- 修复 GitHub Actions updater metadata 生成流程：从已签名的 NSIS 安装包及其 `.sig` 生成 `latest.json`。
- 修复 Release 缺少 `latest.json` 导致桌面端自动更新不可用的问题。
- 保留 0.1.1 已完成的任务流、每日复盘与设置页界面优化；未修改 IndexedDB、数据库名称或 Tauri identifier。

## [0.1.1] - 2026-07-17

### Fixed

- 修复 GitHub Actions updater metadata 生成与 `latest.json` 上传链路。
- 修复 `latest.json` 缺失时缺少发布资产和构建产物诊断的问题。
- 完成 Tauri 自动更新发布链路配置。
- 完成今日任务流、每日复盘和设置页的信息架构与可读性优化。

## [0.1.0] - 2026-07-16

### Added

- React、TypeScript、Vite、Dexie Local First 学习打卡系统。
- Web、PWA 与 Tauri 2 Windows 桌面壳共享同一套页面和业务逻辑。
- Windows NSIS/MSI 构建配置、品牌图标与固定应用标识 `com.summerflow.studytracker`。
- GitHub Releases 签名自动更新、真实下载进度、手动/自动检查和更新前安全备份。
- 桌面文件备份、最近 5 份自动备份轮换、日志目录和诊断导出。
- IndexedDB v2→v3 数据迁移和只读恢复模式。
