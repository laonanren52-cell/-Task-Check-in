# Changelog

All notable SummerFlow changes are recorded here. Versions follow Semantic Versioning.

## [0.2.9] - 2026-07-22

### Fixed

- Reworked the task editor into a compact, adaptive floating drawer on desktop so short forms no longer leave a large empty area below the content.
- Returned the task form and the collapsed “成果与备注” section to normal document flow; hidden fields no longer reserve height.
- Kept the action bar inside the drawer with sticky behavior only when the form needs to scroll, while preserving a full-screen, keyboard-friendly mobile layout.

### Notes

- This update does not alter IndexedDB learning data, task structure, task ordering, AI settings, or the Tauri application identifier.

## [0.2.8] - 2026-07-21

### Fixed

- Restored the Today task card to a stable three-column layout so task content stays in the primary reading column while status and actions remain top-right.
- Removed the conditional grid-child mismatch that moved task controls to a new row when drag sorting was enabled.
- Fixed long task titles and subtask descriptions so they wrap or truncate naturally without creating excess whitespace.

### Notes

- This update does not alter IndexedDB learning data, task ordering, AI settings, or the Tauri application identifier.

## [0.2.7] - 2026-07-21

### Improved

- Reworked the Today workspace into a clearer daily focus flow, with an editorial overview, learning-progress observatory, and a more purposeful task entry state.
- Refined task cards with priority rails, study-time comparison, calmer completion states, and responsive layouts that remain readable as task counts grow.
- Rebuilt the Insights page around learning rhythm, weekly momentum, ranked study allocation, and more informative empty states instead of default dashboard cards.
- Added a restrained visual atmosphere and motion layer across Today, Insights, Tasks, Calendar, and Settings while respecting reduced-motion preferences.

### Notes

- This update does not migrate or alter IndexedDB learning data, AI configurations, or the Tauri application identifier.

## [0.2.6] - 2026-07-21

### Fixed

- Fixed a production startup crash (`Maximum update depth exceeded`) caused by the AI daily-review component creating a new Zustand selector snapshot on every render.
- Replaced the React Router default crash page with a SummerFlow recovery screen that offers reload, return-to-today, safe mode, diagnostic export, and log-folder access on desktop.
- Added safe mode (`?safeMode=1`) to disable non-essential motion and the floating AI entry without modifying IndexedDB tasks, check-ins, reviews, or AI configuration.

## [0.2.5] - 2026-07-19

### Fixed

- Unified the Today page and AI review on one canonical daily summary, so selected-date totals, completion rate, study time, focus, and points are computed locally once and cannot be reinterpreted by the model.
- Separated unfinished tasks for the selected day from historical backlog tasks; unfinished P1 work from other dates can no longer be reported as today's remaining work.
- Reworked AI Today Review into a concise, companion-style format: one-sentence recap, what went well, useful adjustments, and tomorrow's first actions. Local metrics are rendered by the app instead of model output.
- Added a single consistency retry and a safe rejection path for AI text that explicitly contradicts canonical task counts or durations, plus an outdated-result notice after task data changes.

## [0.2.4] - 2026-07-19

### Fixed

- Fixed AI responses defaulting to English in the Simplified Chinese application by adding a shared output-language preference and system-level language instruction.
- Added Chinese model context labels, Chinese JSON examples, and one constrained language-correction retry that preserves JSON fields, facts, values, user-provided names, and technical terms.
- Added an explicit fallback action for temporarily viewing a schema-valid result when its language still does not match the active preference.

## [0.2.3] - 2026-07-19

### Fixed

- Added an explicit DeepSeek V4 adapter for `https://api.deepseek.com` and `deepseek-v4-pro` / `deepseek-v4-flash` configurations, including legacy configurations saved as OpenAI Compatible.
- DeepSeek structured responses now use `response_format: { "type": "json_object" }`; JSON Schema mode is never sent to DeepSeek V4.
- Thinking responses now parse `message.content` only. `reasoning_content` is logged only as diagnostics metadata and is never passed to JSON parsing or Zod validation.
- DeepSeek empty `content` responses retry once and then show a precise empty-response error; truncated output remains a distinct Max Tokens error.
- Added a per-configuration DeepSeek diagnostic that verifies text, JSON Object, and Thinking modes and displays the recommended safe mode.

## [0.2.2] - 2026-07-18

### Fixed

- 修复 Windows 桌面端 AI 加密密钥仓库的 vault 与 Argon2 salt 使用不同应用数据目录，导致 `BadFileKey`、保存 AI 配置失败的问题。
- 为安全密钥加载、读取、写入与保存增加超时保护和明确诊断，避免误报为 AI 返回格式异常或无限加载。
- 增强 AI Provider 响应诊断、结构化输出降级、截断识别与 JSON/Zod 解析兼容性。

## [0.2.1] - 2026-07-18

### Fixed

- 修复 AI 学习教练对带说明文字、Markdown JSON 代码块和分段文本响应的兼容性，避免已连接模型被误报为“返回格式异常”。
- 增加一次安全的 JSON 格式修复与结构校验；无法恢复的响应仍会明确提示重新生成。
- 强化结构化任务、任务拆解和每日复盘提示词，要求模型仅输出完整 JSON。

## [0.2.0] - 2026-07-18

### Added

- 新增 SummerFlow AI 学习教练：AI 安排今日任务、AI 拆解任务、AI 每日复盘分析、AI 整理复盘草稿与右下角 Copilot。
- 新增多模型配置、默认模型、OpenAI Compatible、Gemini 与自定义兼容接口；模型名称和 Base URL 均可自由填写。
- 新增 AI 数据权限控制、结构化 Zod 响应校验、请求超时和取消，以及轻量调用统计。
- 新增 Dexie v4 迁移：`aiConfigs`、`aiPreferences`、`aiUsageLogs`，不影响既有任务、打卡、主题、科目、模板或设置数据。

### Security

- 桌面端 API Key 使用 Tauri Stronghold 加密保存；不写入 IndexedDB、日志或普通 JSON 备份。
- Web/PWA 模式明确提示密钥仅保存在当前浏览器设备；普通 JSON 备份会移除 API Key。

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
