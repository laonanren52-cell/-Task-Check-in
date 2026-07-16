# SummerFlow 设计系统

## 产品气质

夏序是安静、清爽、精确且有秩序的个人学习工作台。界面优先服务任务录入、推进和复盘，不模拟企业后台，也不采用营销落地页结构。

## 设计关键词

Glacier Blue、Mist Cyan、纸感留白、精密信息层级、克制反馈、低噪声图表。

## 色彩 Token

| Token | 值 | 用途 |
|---|---|---|
| `--canvas` | `#F3F7F9` | 页面背景 |
| `--surface` | `#FCFEFF` | 内容表面 |
| `--surface-raised` | `#FFFFFF` | 抽屉与任务核心 |
| `--line` | `#DDE7EC` | 常规分隔线 |
| `--line-strong` | `#BED1DB` | 强调边界 |
| `--ink` | `#172B3A` | 主要文字 |
| `--text` | `#5C7282` | 次要文字 |
| `--muted` | `#8799A5` | 辅助文字 |
| `--accent` | `#2E658A` | 主操作与选中 |
| `--accent-hover` | `#214F70` | 主操作悬停 |
| `--success` | `#2D8A70` | 完成与正向反馈 |
| `--warning` | `#AF7A22` | 待打卡与提示 |
| `--danger` | `#B2535B` | 危险操作 |
| `--focus` | `#75A9C7` | 键盘焦点 |

## 字体、间距与形状

- 字体：Geist 为界面英文与数字字体，`Noto Sans SC` 为中文回退；标题使用紧凑字距，正文保持 1.6 行高。
- 间距：4px 基准，常用阶梯为 4 / 8 / 12 / 16 / 24 / 32 / 48。
- 圆角：仅使用 8 / 12 / 16 / 20px。
- 阴影：普通表面不使用投影；悬浮表面使用低对比环境阴影，抽屉使用更深但扩散的阴影。

## 页面框架

- 桌面：窄侧栏、顶部上下文区域、最大内容宽度 1180px、必要时右侧抽屉。
- 移动：底部导航、拇指可达的浮动新增、全宽抽屉、任务卡片列表。
- 今日页：主状态区 + 两个紧凑指标组成 12 列非对称概览；任务为视觉中心；复盘在安静独立区域完成。
- 明细：筛选工具条与高密度任务列表；移动端自动简化为卡片。
- 月历：低饱和状态色和进度细节表达，不整格高亮。
- 看板：按“本周状态、时间投入、任务完成、科目分布、趋势洞察”的顺序呈现。

## 组件体系

`AppShell`、`Sidebar`、`MobileNavigation`、`PageHeader`、`Button`、`IconButton`、`Input`、`Select`、`Drawer`、`Dialog`、`Toast`、`EmptyState`、`TaskCard`、`TaskRow`、`StatusBadge`、`PriorityIndicator`、`Metric`、`ProgressBar`、`ChartContainer`、`CalendarCell`、`ReviewEditor`。

## 动效原则

- 页面与抽屉：240–360ms，使用 `cubic-bezier(.16,1,.3,1)`。
- 微交互：120–180ms，仅改变 transform、opacity 或颜色。
- 支持 `prefers-reduced-motion`，禁止滚动绑定位移动画和强光效。

## 禁止模式

深色大背景、霓虹渐变、厚重阴影、整页同质卡片、默认后台表格、横向主交互滚动、营销 Hero、假数据图表，以及将所有功能塞入一张表单。
