# SummerFlow 旧版迁移审计

## 源文件与审计范围

任务指定的精确文件名 `高级暑期学习打卡系统(1).html` 未出现在当前工作区；本机检索到并完整读取的对应源文件为：

`C:\Users\cheng\Downloads\高级暑期学习打卡系统.html`

文件大小 46,039 bytes，共 1,010 行。源文件保持原样，未覆盖、未移动、未删除。本审计以该完整文件的 DOM、样式、事件处理和 `summer-growth-v3` 数据结构为迁移基线。

## 源实现基线

- 页面：今日打卡、任务明细、打卡月历、数据看板、设置。
- 存储：`localStorage['summer-growth-v3']`，含 `settings`、`tasks`、`checkins`、`dailyNotes`。
- 任务字段：`id/date/theme/subject/priority/name/detail/status/plan/actual/focus/energy/output/note`。
- 统计：取消任务排除；完成率为已完成数 ÷ 非取消任务数；当日积分为实际小时 × 10 + 完成任务 × 2 + 平均专注度。
- 交互：日期切换、任务增改删、模板填充、正式打卡/取消、复盘、筛选、CSV、JSON、目标和分类维护。

## 功能迁移对照表

| 原 HTML 功能 | 新项目实现 | 状态与验证 |
|---|---|---|
| 五个核心导航视图 | `src/app/router.tsx`、`src/pages/` | 已完成；浏览器逐页验证 |
| `summer-growth-v3` 本地数据 | `src/features/migration/`、`src/db/` | 已完成；预览确认、原子迁移、保留旧数据 |
| 旧任务字段与时长转换 | `src/features/migration/legacy.ts` | 已完成；小时转分钟、稳定分类 ID；测试通过 |
| 今日日期切换与补签 | `src/pages/TodayPage.tsx` | 已完成 |
| 当日/总体指标 | `src/features/statistics/index.ts` | 已完成；取消任务排除 |
| 当前/最长连续打卡 | `src/features/statistics/index.ts` | 已完成；测试通过 |
| 任务新增/编辑 | `src/features/tasks/TaskDrawer.tsx` | 已完成；RHF + Zod、模板填充、脏表单确认 |
| 任务删除/复制/排序 | `src/features/tasks/TaskList.tsx` | 已完成；自定义确认 Dialog、拖动排序 |
| 快速完成/状态切换 | `src/features/tasks/TaskList.tsx` | 已完成；统计即时更新 |
| 成果与备注展开 | `src/features/tasks/TaskList.tsx` | 已完成 |
| 正式打卡/取消与每日复盘 | `src/features/checkins/`、`src/pages/TodayPage.tsx` | 已完成 |
| 任务组合筛选与排序 | `src/features/tasks/TaskFilters.tsx` | 已完成 |
| 桌面表格/移动卡片 | `src/pages/TasksPage.tsx` | 已完成；390px 无横向溢出 |
| 批量状态/批量删除 | `src/pages/TasksPage.tsx` | 已完成 |
| 月份切换、月历与热力图 | `src/features/calendar/CalendarView.tsx` | 已完成；日期不写死 |
| 7/30 天、每周趋势与分布 | `src/pages/DashboardPage.tsx` | 已完成；只使用真实数据 |
| 空数据看板 | `src/features/dashboard/ChartContainer.tsx` | 已完成；无随机假数据 |
| 暑期目标设置 | `src/pages/SettingsPage.tsx` | 已完成；Zod 校验 |
| 主题/科目维护 | `src/features/settings/CategoryManager.tsx` | 已完成；CRUD、颜色、主题图标、排序、引用替换 |
| 任务模板维护 | `src/features/settings/TemplateManager.tsx` | 已完成；CRUD、排序、二次确认 |
| JSON 导出/导入 | `src/features/backup/` | 已完成；Zod、预览、导入前自动备份、原子覆盖 |
| CSV UTF-8 BOM 导出 | `src/features/backup/csv.ts` | 已完成 |
| 清空/恢复默认 | `src/features/backup/BackupManager.tsx` | 已完成；统计摘要与二次确认 |
| Toast、加载、错误、空状态 | `src/components/ui/` | 已完成 |
| 首次使用引导 | `src/components/ui/OnboardingDialog.tsx` | 已完成；可跳过，无假任务 |
| Esc 关闭弹窗/抽屉 | `Dialog.tsx`、`TaskDrawer.tsx` | 已完成；Playwright 验证 |
| IndexedDB Local First | `src/db/database.ts`、`src/stores/appStore.ts` | 已完成 |
| PWA | `vite.config.ts`、`PwaUpdate.tsx`、`public/pwa-icon.svg` | 已完成；构建生成 SW/manifest |

## 兼容性映射

| 旧字段/值 | 新字段/值 |
|---|---|
| `theme` | `themeId` |
| `subject` | `subjectId` |
| `plan`（小时） | `plannedDuration`（分钟） |
| `actual`（小时） | `actualDuration`（分钟） |
| `focus` | `focusScore` |
| `energy` | `energyScore` |
| `output` | `output` |
| `待开始` | `todo` |
| `进行中` | `doing` |
| `已完成` | `done` |
| `未完成` | `missed` |
| `取消` | `cancelled` |
| `checkins[date]` | `DailyRecord.checkedIn` |
| `dailyNotes[date]` | `DailyRecord` 复盘字段 |

## 验证结论

- `npm run test`：3 个测试文件、17 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，PWA Service Worker 和 Manifest 已生成。
- Playwright：桌面 1440×1000、手机 390×844 验证通过；五个路由可访问，表单错误可见，Esc 可关闭抽屉，手机无横向溢出，浏览器控制台 0 错误。
- 剩余非阻塞项：生产包因图表库产生大包提示，后续可按路由动态拆包；不影响当前部署和功能。

## Tauri 桌面补充迁移

- React 页面、Zustand 状态、Dexie 数据、统计和备份逻辑保持共享，没有创建第二套桌面页面。
- 桌面专属能力集中在 `src/desktop/`，普通浏览器和 PWA 不调用 Tauri API。
- 应用 identifier 固定为 `com.summerflow.studytracker`，窗口使用系统原生标题栏。
- Dexie 从 Schema v2 升级到 v3 时只补充更新偏好并保留任务；升级失败回滚并进入只读恢复模式。
- Tauri updater、process、dialog、fs、log、opener、os 插件采用 capability 最小权限配置。
- Updater 私钥和密码保存在用户目录，仓库仅包含公钥；发布工作流从 GitHub Secrets 注入私钥。
