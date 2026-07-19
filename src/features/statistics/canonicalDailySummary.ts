import type { DailyRecord, Task } from '../../types'
import { averageFocus, dailyPoints, dailyStats } from './index'

export interface DailyCanonicalSummary {
  date: string
  timezone: 'Asia/Shanghai'
  taskCount: number
  completedTaskCount: number
  unfinishedTaskCount: number
  cancelledTaskCount: number
  completionRate: number
  plannedMinutes: number
  actualMinutes: number
  averageFocus: number
  averageEnergy: number
  points: number
  checkedIn: boolean
  completedWithoutActualDurationCount: number
  todayTasks: Task[]
  todayUnfinishedTasks: Task[]
  todayUnfinishedP1Tasks: Task[]
  overdueBacklogTasks: Task[]
}

const round = (value: number) => Math.round(value * 100) / 100
const validTask = (task: Task) => task.status !== 'cancelled'

/**
 * The only source of truth for a selected day's task metrics. Dates are local
 * YYYY-MM-DD strings throughout SummerFlow, so this never depends on UTC.
 */
export function getCanonicalDailySummary(tasks: Task[], records: DailyRecord[], date: string): DailyCanonicalSummary {
  const allTodayTasks = tasks.filter(task => task.date === date)
  const todayTasks = allTodayTasks.filter(validTask)
  const stats = dailyStats(todayTasks)
  const todayUnfinishedTasks = todayTasks.filter(task => task.status !== 'done')
  const todayUnfinishedP1Tasks = todayUnfinishedTasks.filter(task => task.priority === 'P1')
  const overdueBacklogTasks = tasks.filter(task => task.date < date && validTask(task) && task.status !== 'done')
  const energyValues = todayTasks
    .map(task => task.energyScore)
    .filter((score): score is number => typeof score === 'number' && score > 0)

  return {
    date,
    timezone: 'Asia/Shanghai',
    taskCount: stats.taskCount,
    completedTaskCount: stats.done,
    unfinishedTaskCount: todayUnfinishedTasks.length,
    cancelledTaskCount: allTodayTasks.length - todayTasks.length,
    completionRate: Math.round(stats.rate * 100),
    plannedMinutes: stats.planned,
    actualMinutes: stats.actual,
    averageFocus: round(averageFocus(todayTasks)),
    averageEnergy: round(energyValues.length ? energyValues.reduce((sum, score) => sum + score, 0) / energyValues.length : 0),
    points: dailyPoints(todayTasks),
    checkedIn: records.some(record => record.date === date && record.checkedIn),
    completedWithoutActualDurationCount: todayTasks.filter(task => task.status === 'done' && task.actualDuration <= 0).length,
    todayTasks,
    todayUnfinishedTasks,
    todayUnfinishedP1Tasks,
    overdueBacklogTasks,
  }
}

export function canonicalSummarySourceHash(summary: DailyCanonicalSummary, record?: DailyRecord): string {
  const taskState = summary.todayTasks
    .map(task => [task.id, task.status, task.plannedDuration, task.actualDuration, task.focusScore ?? '', task.energyScore ?? '', task.updatedAt].join(':'))
    .sort()
    .join('|')
  return [summary.date, taskState, record?.updatedAt ?? ''].join('::')
}
