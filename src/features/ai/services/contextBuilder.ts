import { format, subDays } from 'date-fns'
import type { AIPermissions, AppSettings, DailyRecord, Subject, Task, TaskTemplate, Theme } from '../../../types'
import { dailyStats } from '../../statistics'

type Source = { tasks: Task[]; dailyRecords: DailyRecord[]; themes: Theme[]; subjects: Subject[]; templates: TaskTemplate[]; settings: AppSettings; permissions: AIPermissions }
export function buildAIContext(source: Source, date: string) {
  const { permissions } = source
  const theme = new Map(source.themes.map(item => [item.id, item.name])); const subject = new Map(source.subjects.map(item => [item.id, item.name]))
  const taskView = (task: Task) => ({ title: task.name, detail: task.detail, priority: task.priority, status: task.status, theme:theme.get(task.themeId), subject:subject.get(task.subjectId), ...(permissions.durations ? { plannedMinutes:task.plannedDuration, actualMinutes:task.actualDuration } : {}), ...(permissions.focus ? { focus:task.focusScore, energy:task.energyScore } : {}) })
  const dayTasks = permissions.tasks ? source.tasks.filter(task => task.date === date).map(taskView) : []
  const recentDates = new Set(Array.from({ length:7 }, (_,index) => format(subDays(new Date(`${date}T00:00:00`), index), 'yyyy-MM-dd')))
  const recent = permissions.recentHistory ? source.tasks.filter(task => recentDates.has(task.date)).map(taskView) : []
  const review = permissions.reviews ? source.dailyRecords.find(item => item.date === date) : undefined
  return {
    date, todayTasks:dayTasks, unfinishedPriorityTasks:permissions.tasks ? source.tasks.filter(task => task.priority === 'P1' && task.status !== 'done' && task.status !== 'cancelled').slice(0,8).map(taskView) : [],
    ...(permissions.recentHistory ? { recentSevenDaySummary:dailyStats(source.tasks.filter(task => recentDates.has(task.date))), recentTasks:recent } : {}),
    ...(permissions.reviews && review ? { dailyReview:pickReview(review) } : {}),
    ...(permissions.goals ? { goals:{ startDate:source.settings.startDate,endDate:source.settings.endDate,goalDays:source.settings.goalDays,goalStudyHours:source.settings.goalStudyHours,goalTaskCount:source.settings.goalTaskCount } } : {}),
    themes:source.themes.map(item => item.name), subjects:source.subjects.map(item => item.name), templates:source.templates.slice(0,16).map((item:TaskTemplate) => item.name),
  }
}
function pickReview(record: DailyRecord) { return { mood:record.mood, review:record.review, achievement:record.achievement, problem:record.problem, satisfaction:record.satisfaction, nextStep:record.nextStep } }
