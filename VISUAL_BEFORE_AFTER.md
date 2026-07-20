# SummerFlow Visual Before / After

## Evidence

The current local evidence is intentionally ignored by Git and can be regenerated without changing product data.

- New Today: `output/playwright/today-after.png`
- New Dashboard: `output/playwright/dashboard-after.png`
- New Settings: `output/playwright/settings-after.png`
- Page transition recording: `output/playwright/page-transitions.webm`
- Task drawer recording: `output/playwright/task-drawer.webm`

The **before** state is documented in [VISUAL_GAP_AUDIT.md](VISUAL_GAP_AUDIT.md) and was inspected from the running pre-change page before implementation. It used a PageHeader toolbar, one rectangular progress panel, five equal statistics cells, and generic empty/chart containers.

## Today

| Aspect | Before | After |
|---|---|---|
| Structure | Heading + controls, then a single progress card and five equal metrics. | Asymmetric day masthead, compact utility island, current-streak marker, and a primary progress observatory with three supporting measures. |
| Task entry | Generic empty state inside the task block. | Learning-path composition with an abstract route and distinct direct/AI task-entry actions. |
| Task cards | White horizontal rows with metadata and a status select. | Priority rail, effort trajectory, outcome-led content hierarchy, compact state actions, and staggered entry/completion transitions. |
| Usability | Main action competes with all metrics and controls. | The next action, completion state, and planned effort are legible before aggregate history. |

## Dashboard

| Aspect | Before | After |
|---|---|---|
| Chart container | Recharts wrapper with a title and light color override. | Chart design system: `ChartContainer`, `ChartHeader`, `ChartSummary`, `ChartLegend`, `ChartAnnotation`, and a dedicated empty state. |
| Seven-day time | One ordinary green bar series. | Gradient rounded bars, independent current-day emphasis, lightweight value labels, a period summary, and 820ms first-enter animation. |
| Thirty-day time | Basic monotone area. | Smooth area trajectory with restrained fill, custom legend, peak summary, and hover-only active point. |
| Weekly signals | Full-size charts even where only two weeks exist. | Comparative summary modules for sparse data; charts take over only once a real trend exists. |
| Allocation | Recharts horizontal bars. | Ranked allocation strips that show order, minutes, share, and proportional investment without a pie chart. |
| Empty data | Generic product empty state. | Purpose-built chart-empty motif that preserves the dashboard’s visual language. |

## Calendar, Tasks, and Settings

| Page | Structural / visual change | Usability effect |
|---|---|---|
| Tasks | Filter/table shell and task cards now use the same workbench surface and priority grammar. | Dense data remains readable without looking like a generic administration table. |
| Calendar | Month panel receives a copper-led ledger atmosphere, stronger surface hierarchy, and day-cell lift on hover. | The calendar reads as a monthly learning record rather than a plain table. |
| Settings | Neutral page atmosphere, elevated settings canvas, and clearer content/header separation. | The existing sectional navigation remains familiar while the content area has calmer pacing. |

## Motion evidence

- Page route transition: opacity `0 → 1`, y `6–12px → 0`, approximately `220–550ms`, custom `cubic-bezier(.22, 1, .36, 1)` / GSAP `power2.out`.
- Task cards: staggered `8px` lift-in at `42ms` increments; priority/status changes use color and opacity transitions.
- Progress and ranked/summary bars: `680–780ms` width interpolation.
- Charts: built-in Recharts entry uses `760–840ms`; all custom CSS and GSAP motion respect `prefers-reduced-motion`.
- Drawer: existing dialog/drawer animation is captured in `task-drawer.webm`; it remains unchanged at the data layer.

## Validation

- Desktop smoke check at 1280×720: Today, Tasks, Calendar, Dashboard, and Settings have no horizontal overflow and no route error.
- Mobile check at 390×844: Today has no horizontal overflow and switches to the mobile navigation / stacked observatory layout.
- Browser console check: no React #185 / maximum-update-depth error after the visual changes.
