# 夏序 SummerFlow

夏序是面向学生的 Local First 学习管理与每日打卡系统。同一日期可以创建多项任务，分别记录主题、科目、状态、时长、专注度、精力、成果和备注，并通过正式打卡、复盘、月历和真实数据趋势持续回顾学习节奏。

同一套 React 业务代码同时交付：

- Web 版本
- 可安装、可离线更新的 PWA
- Tauri 2 Windows 桌面版
- 由 GitHub Releases 提供的签名自动更新

应用固定标识为 `com.summerflow.studytracker`。正式发布后不得随意修改，否则会影响应用识别、本地 WebView 数据目录和安装升级。

## 功能

- 今日任务、拖动排序、快速完成/状态切换、复制、编辑和删除。
- 每项任务独立记录计划/实际时长、专注度、精力、成果和备注。
- 每日复盘、正式打卡、过去日期补签和连续打卡统计。
- 任务组合筛选、批量状态、批量删除和 UTF-8 CSV 导出。
- 标准月历、月度热力图、7/30 天趋势、周趋势和主题/科目投入分布。
- 主题、科目、模板和暑期目标自定义。
- IndexedDB 自动保存、JSON 备份恢复和旧版 `summer-growth-v3` 迁移。
- 桌面版自选备份位置、导入前/更新前自动备份、最近 5 份轮换。
- Tauri 日志、诊断信息导出、只读数据恢复模式。
- 启动延迟检查、手动检查、真实下载进度、用户确认重启安装。

## 技术栈

React、TypeScript、Vite、Tailwind CSS、Zustand、Dexie、React Router、React Hook Form、Zod、date-fns、Recharts、Motion、Vitest、Testing Library、vite-plugin-pwa、Tauri 2 和官方 Tauri 插件。

## 项目结构

```text
src/
  app/                    React 应用入口与路由
  components/             布局和通用 UI
  db/                     Dexie Schema、迁移、只读恢复
  desktop/
    environment/          Web / PWA / Tauri 平台检测
    filesystem/           桌面备份、日志目录、诊断导出
    logging/              安全日志封装
    platform/             运行时版本和系统信息
    updater/              自动更新状态机与更新 UI
  features/               任务、打卡、月历、统计、设置、备份
  pages/                  五个核心页面
  stores/                 Zustand 数据状态
  tests/                  统计、备份、迁移和升级测试
src-tauri/
  capabilities/           最小权限配置
  icons/                  ICO、ICNS、PNG 和平台图标
  src/                    Rust 入口与官方插件注册
  Cargo.toml
  tauri.conf.json
.github/workflows/release.yml
CHANGELOG.md
RELEASE.md
UPDATE_TEST.md
```

## 环境要求

Web/PWA：Node.js 20 或更高版本。

Windows 桌面构建还需要：

- Rust stable MSVC 工具链
- Microsoft C++ Build Tools，“Desktop development with C++”工作负载
- Microsoft Edge WebView2 Runtime
- 构建 MSI 时启用 Windows VBSCRIPT 可选功能

## 安装依赖

```bash
npm install
```

## Web 与 PWA

```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

打开 <http://127.0.0.1:4173>。项目固定使用 `4173`，不使用 Vite 默认的 `5173`。

生产构建：

```bash
npm run build
```

输出目录为 `dist/`。部署平台需要把未知路由回退到 `index.html`，PWA 正式安装需要 HTTPS。

## Tauri 桌面版

桌面开发：

```bash
npm run tauri:dev
```

如果独立的 `npm run dev` 已占用 4173，请先关闭该进程，再运行 `tauri:dev`，因为 Tauri 会自行启动 Vite。

构建 Windows 安装包：

```bash
npm run tauri:build
```

本机原生构建的标准输出目录：

```text
src-tauri/target/release/bundle/nsis/   NSIS setup.exe
src-tauri/target/release/bundle/msi/    MSI
```

GitHub Actions 指定 x64 target 时，输出位于：

```text
src-tauri/target/x86_64-pc-windows-msvc/release/bundle/
```

安装包使用当前用户安装模式，包含开始菜单入口、桌面快捷方式支持、卸载入口、版本号和 SummerFlow 品牌图标。

## 自动更新

更新清单：

<https://github.com/laonanren52-cell/-Task-Check-in/releases/latest/download/latest.json>

更新策略：

- 生产桌面版启动 5 秒后检查；用户可以关闭自动检查。
- 开发环境不执行真实更新下载或安装。
- 普通浏览器和 PWA 不调用任何 Tauri API。
- 普通版本允许稍后更新；`release-metadata.json` 预留 `minimumSupportedVersion`、`mandatory`、`releaseNotes` 和 `publishedAt`。
- 更新下载显示插件返回的真实字节进度；插件未提供安全取消能力，因此界面不展示虚假“取消下载”。
- 安装前先在应用本地数据目录创建 JSON 安全备份，失败则停止更新。
- 下载完成后由用户点击“立即重启并安装”。

## Updater 签名与 Secrets

本机已生成密钥文件：

```text
C:\Users\cheng\.tauri\summerflow.key
C:\Users\cheng\.tauri\summerflow.key.pub
C:\Users\cheng\.tauri\summerflow.password
```

私钥和密码不在项目目录，且 `.gitignore` 会阻止常见密钥文件进入 Git。

GitHub Actions 需要手动配置：

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

> 该私钥是向已安装用户继续发布更新的关键凭据，必须进行离线备份，不得丢失。

严禁把私钥、密码或真实 Secret 写入源码、README、Release 或构建日志。

## 数据保存位置

- Web/PWA：当前浏览器配置文件中的 IndexedDB，数据库名 `summerflow`。
- Tauri：系统为 `com.summerflow.studytracker` 分配的 WebView2 应用数据目录中的 IndexedDB。
- 自动备份：Tauri App Local Data 下的 `backups` 子目录，保留最近 5 份。
- 手动备份：由用户在系统文件对话框中选择位置。
- 日志：Tauri App Log 目录，可在“设置 → 日志与诊断”中打开。

更新流程不会清空 IndexedDB，也不得修改数据库名或 identifier。Dexie Schema 通过版本化事务升级；失败时事务回滚并进入只读恢复模式，可导出原始数据。

## 测试与发布检查

```bash
npm run test
npm run build
npm run release:check
```

`release:check` 检查语义版本、三个版本文件一致性、固定 identifier、updater endpoint、公钥和敏感文件，然后运行测试与 Web/PWA 构建。

版本号只修改 `src-tauri/tauri.conf.json`，随后执行：

```bash
npm run version:sync
```

## GitHub Actions 发布

推送 `v*` Tag 会触发 `.github/workflows/release.yml`：安装 Node/Rust、缓存 Cargo、运行测试和构建、生成 NSIS/MSI、使用 updater 私钥签名、上传安装包和 `.sig`、生成并增强 `latest.json`，最后创建 GitHub Release。

完整发布步骤见 [RELEASE.md](./RELEASE.md)，更新验证矩阵见 [UPDATE_TEST.md](./UPDATE_TEST.md)。

## Windows 代码签名

Updater 更新包签名与 Windows Authenticode 代码签名是两套机制。Updater 签名已经配置；当前没有正式 Windows 代码签名证书，因此安装程序可能出现 SmartScreen 提示。项目不会伪造证书、使用测试证书冒充正式签名，或关闭 Windows 安全验证。

## 常见问题

- `4173 already in use`：关闭已运行的独立 Vite 服务，再执行 `npm run tauri:dev`。
- 找不到 `cargo`/`rustc`：安装 Rust stable MSVC 并重新打开终端。
- 找不到 `link.exe`：安装 Microsoft C++ Build Tools 的 VCTools 工作负载。
- MSI 构建出现 `light.exe`/VBSCRIPT 错误：在 Windows 可选功能中启用 VBSCRIPT；NSIS 可继续单独构建。
- SmartScreen 提示：当前安装包未做 Authenticode 代码签名；核对 GitHub Release 来源和 updater 签名，不要关闭安全验证。
- 更新检查失败：确认网络可访问 GitHub Releases、Release 已公开且包含 `latest.json`、安装包和匹配的 `.sig`。

## 当前限制

- 第一阶段没有账号、后端或云同步。
- 真实 0.1.0→0.1.1 GitHub Release 更新必须在配置两个 GitHub Secrets 并发布两个正式版本后人工完成，项目不会虚报该结果。
- 图表和动画依赖使主包存在大于 500 kB 的非阻塞构建提示，不影响当前运行、安装或 PWA 生成。
