# SummerFlow Visual Gap Audit

Audit date: 2026-07-21

Scope: visual structure and interaction polish only. Existing Local First data, task/check-in models, AI configuration, Tauri configuration, and release flow are out of scope.

## Evidence reviewed

- Running Today, Dashboard, and Settings pages at `http://127.0.0.1:4173`.
- Current implementations of TodayPage, DashboardPage, SettingsPage, TaskList, ChartContainer, AppShell, and visual CSS.
- Existing visual-upgrade working-tree changes, which are a useful starting point but do not yet meet the requested structural threshold.

| Module | Current appearance | Why it is not yet premium | Specific change in this pass |
|---|---|---|---|
| App shell | Calm paper background, left rail, standard content column. | The backdrop is so low-contrast it reads as plain off-white; the workspace has no page-specific spatial identity. | Add a layered CSS-only atmosphere with page-scoped pigment, grain, and a deliberate content surface; keep the rail quiet and stable. |
| Today header | PageHeader is title + paragraph + three controls arranged like a toolbar. | It remains a conventional dashboard heading, with the action controls carrying the same visual weight as the title. | Replace it with an asymmetric day masthead: date/status/streak on the editorial side and date/action island on the utility side. |
| Today progress | One large rectangle followed by five equal KPI cells. | This is the clearest legacy admin-dashboard pattern; no primary/secondary metric hierarchy exists. | Build a progress observatory: primary completion reading, ring/trajectory, status conclusion, and only three supporting measures. |
| Today task state | Generic EmptyState within a dashed or bordered content block. | The empty state has no product signature and does not connect the next action to AI planning. | Use a branded learning-path composition with an abstract CSS route, two purposeful entry points, and no stock illustration or emoji. |
| Task list | Functional cards, but visually close to white horizontal list rows. | Priority, effort, and state do not form a scannable left-to-right hierarchy; interaction feedback is weak. | Introduce priority rail, outcome-led content column, duration track, compact state control, and enter/complete/remove motion without changing task operations. |
| Tasks page | Filters/table/card views remain productively dense. | Filter and result regions still inherit a neutral management-console rhythm. | Restyle the filter command area and list shell around the new task-card grammar while retaining current filters and bulk actions. |
| Calendar | Useful month grid with status colors. | It reads as a standard calendar table and lacks a differentiated month rhythm. | Add a month ledger header, restrained copper page atmosphere, and stronger day-cell hierarchy/hover feedback. |
| Dashboard story | A headline card plus four evenly divided metrics. | It has improved wording but still reads as a generic insight dashboard: equal-weight stats and standard chart cards. | Replace with a weekly observatory: editorial thesis, goal trajectory, compact comparison strip, then narrative rhythm/allocation/quality sections. |
| Dashboard charts | Mostly direct Recharts Bar/Area/Line defaults, light gridlines, small custom tooltip. | Shape, axis, labels, legend, annotations, and animation do not yet act as one system; data marks look interchangeable. | Establish `ChartDesignSystem` primitives and chart-specific presentation rules: highlighted today bar, intentional area curve, comparative weekly summaries, ranked allocation strips, and a refined heatmap. |
| Dashboard motion | One GSAP fade-up and Recharts default duration. | Motion is mostly invisible in ordinary use and does not create hierarchy or explain state change. | Add visible first-enter stagger, sequential mark animation, progress transition, and reduced-motion-safe fallback. No continuously running animation or layout-state loop. |
| Settings | Good two-column settings navigation and content card. | It remains a large neutral card inside a second neutral shell; information density has no editorial pacing. | Clarify the content canvas with grouped scene headers, a compact diagnostics/update status composition, and restrained neutral atmosphere. |

## Specific gaps found

1. **More than a color gap:** Today’s equal five-cell metrics and generic Dashboard chart grid preserve their prior information architecture.
2. **Default-backoffice remnants:** equal KPI bands, rectangular progress panels, standard filter bars, and generic white chart containers persist.
3. **Recharts resemblance:** existing charts use the library’s familiar axis/grid/tooltip anatomy with only color/radius overrides; chart-specific summaries and annotation are absent.
4. **Motion visibility:** GSAP reveal exists, but it is only a short page-level fade. Chart marks and task state changes do not feel choreographed.
5. **Background flatness:** subtle radial pseudo-elements are not visually strong enough to differentiate pages or create foreground/background depth.
6. **Brand distinction:** the system has a good green palette, but no repeatable visual signature beyond rounded pale surfaces.

## Acceptance approach

- Make the Today layout structurally distinct at thumbnail size.
- Make Dashboard charts legible as a designed system rather than raw Recharts compositions.
- Capture before/after screenshots and interaction recordings from a running local build after implementation.
- Test with empty and populated local data, desktop/mobile widths, and reduced motion before any release decision.
