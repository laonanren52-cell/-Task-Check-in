import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { getCanonicalDailySummary } from '../features/statistics/canonicalDailySummary'
import { validateDailyInsightConsistency } from '../features/ai/services/dailyInsightConsistency'

const base = (id: string, overrides: Partial<Task> = {}): Task => ({
  id, date: '2026-07-19', themeId: 'theme', subjectId: 'subject', name: id, detail: '', priority: 'P2', status: 'todo', plannedDuration: 60, actualDuration: 0, focusScore: 4, energyScore: 4, output: '', note: '', order: 0, createdAt: '', updatedAt: '', ...overrides,
})

describe('canonical daily summary', () => {
  it('uses the selected local date only and keeps historical backlog separate', () => {
    const tasks = [
      base('done-1', { status: 'done', actualDuration: 60 }),
      base('done-2', { status: 'done', actualDuration: 60 }),
      base('cancelled', { status: 'cancelled' }),
      base('old-p1', { date: '2026-07-18', priority: 'P1', status: 'todo' }),
      base('future-p1', { date: '2026-07-20', priority: 'P1', status: 'todo' }),
    ]
    const summary = getCanonicalDailySummary(tasks, [], '2026-07-19')
    expect(summary).toMatchObject({ taskCount: 2, completedTaskCount: 2, unfinishedTaskCount: 0, cancelledTaskCount: 1, completionRate: 100, plannedMinutes: 120, actualMinutes: 120 })
    expect(summary.todayUnfinishedP1Tasks).toEqual([])
    expect(summary.overdueBacklogTasks.map(task => task.id)).toEqual(['old-p1'])
  })

  it('rejects an insight that contradicts canonical task counts', () => {
    const summary = getCanonicalDailySummary([base('done', { status: 'done', actualDuration: 60 })], [], '2026-07-19')
    expect(() => validateDailyInsightConsistency({ headline: '今天计划 2 项任务，完成 1 项任务。', positive: [], adjustment: [], tomorrowActions: [], tone: 'steady' }, summary)).toThrow('AI_DATA_CONSISTENCY_ERROR')
    expect(() => validateDailyInsightConsistency({ headline: '今天的 1 项任务已经全部完成。', positive: [], adjustment: [], tomorrowActions: [], tone: 'steady' }, summary)).not.toThrow()
  })
})
