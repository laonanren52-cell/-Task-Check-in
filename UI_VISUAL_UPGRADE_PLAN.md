# SummerFlow UI Visual Upgrade Plan

## Goal

Elevate SummerFlow from a capable learning tracker into a calmer, more considered personal learning workbench. Preserve Local First data, existing analytics, and desktop behavior while improving visual hierarchy, chart language, and motion.

## Visual direction

- Fog-white foundation with restrained sage, slate-blue, and warm copper ambient light.
- Editorial hierarchy: one clear weekly narrative, then rhythm, allocation, and quality.
- Data visualization uses forest green, mist blue, muted copper, soft plum, and quiet grey-green; no rainbow palettes or pie charts.
- Surfaces stay readable and low-contrast; atmosphere remains behind content.

## Dashboard structure

1. Weekly overview: one sentence, weekly duration, completion rate, and streak.
2. Rhythm: 7-day duration, 30-day trajectory, weekly duration, weekly completion rate.
3. Allocation: subject and project time rankings using horizontal bars.
4. Quality: focus/energy trend, check-in heatmap, execution stability.
5. Next steps: a concise local weekly summary, goal progress, and overdue-task reminder.

## Motion

- Route fade/raise already exists and remains reduced-motion aware.
- Dashboard sections use a GSAP staggered reveal only on initial entry.
- Metric values count up once; charts use Recharts' lightweight built-in animation.
- Cards use subtle elevation and border-color transitions, not scale jumps.
- The AI review disclosure retains its compact expand/collapse interaction.

## Guardrails

- Do not change IndexedDB schema, task statistics, or Tauri identifier.
- No full-screen gradients, glass overload, particle effects, or horizontal scroll.
- Keep chart information available without animation and honor `prefers-reduced-motion`.
- Verify `npm run test`, `npm run build`, and `git diff --check` after implementation.
