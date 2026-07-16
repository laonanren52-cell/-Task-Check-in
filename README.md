# 夏序 SummerFlow

SummerFlow 是一个面向学生的 Local First 学习管理与每日打卡系统。它将当天的多个学习任务、过程记录、正式打卡与数据复盘收拢在一个安静、清晰的个人工作台中。

## 核心能力

- 同一天创建任意多个任务，并分别记录主题、科目、优先级、状态、计划与实际学习时长。
- 今日工作台：完成率、真实学习时长、连续打卡、学习积分，以及独立的每日复盘空间。
- 任务明细：搜索、状态筛选、批量完成或删除，并可导出 CSV。
- 打卡月历：按任务、完成率、学习时长和正式打卡状态呈现每一天。
- 数据看板：累计指标、近期学习时长、完成率趋势与科目投入分布；无数据时提供空状态。
- 自定义设置：主题、学习科目、任务模板及完整 JSON 备份与恢复。
- Local First：数据保存在浏览器 IndexedDB（数据库名为 `summerflow`），不依赖后端和账号系统。
- PWA：可安装到桌面或移动设备；生产环境使用 HTTPS 时可获得完整安装体验。

## 技术栈

React、TypeScript、Vite、Tailwind CSS、Zustand、Dexie、Recharts、date-fns、vite-plugin-pwa。

## 本地运行

要求：Node.js 20 或更高版本。

```bash
npm install
npm run dev -- --port 4173
```

在浏览器打开 `http://127.0.0.1:4173`。项目约定不使用 Vite 默认的 5173 端口。

## 测试与构建

```bash
npm run test
npm run build
```

构建产物生成于 `dist/`，可部署到任意静态托管服务，例如 GitHub Pages、Vercel、Netlify 或 Nginx。PWA 安装需要部署站点启用 HTTPS。

## 数据备份

在“自定义设置 → 数据管理”中可以：

- 导出完整 JSON 备份；
- 导入并校验 JSON 备份；
- 导出任务 CSV；
- 清空本地数据。

导入文件会先检查基本结构，格式错误不会覆盖现有数据。

## 项目结构

```text
src/
  App.tsx          页面与交互编排
  components.tsx   抽屉、任务行、Toast 等可复用组件
  db.ts            Dexie / IndexedDB 数据层
  logic.ts          统计、积分、连续打卡与导入校验
  store.ts          Zustand 状态同步
  styles.css        设计 Token 与响应式样式
DESIGN.md           产品设计系统说明
```

## 验证状态

- `npm run test`：5 项核心逻辑测试通过。
- `npm run build`：成功生成生产构建与 PWA Service Worker。
