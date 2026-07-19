import { format, subDays } from 'date-fns'
import type { AIPermissions, AppSettings, DailyRecord, Subject, Task, TaskTemplate, Theme } from '../../../types'
import { dailyStats } from '../../statistics'
import type { ResolvedOutputLanguage } from './outputLanguage'

type Source = { tasks: Task[]; dailyRecords: DailyRecord[]; themes: Theme[]; subjects: Subject[]; templates: TaskTemplate[]; settings: AppSettings; permissions: AIPermissions; outputLanguage?: ResolvedOutputLanguage }
export function buildAIContext(source: Source, date: string) {
  const { permissions } = source
  const theme = new Map(source.themes.map(item => [item.id, item.name])); const subject = new Map(source.subjects.map(item => [item.id, item.name]))
  const taskView = (task: Task) => source.outputLanguage === 'en-US'
    ? ({ title:task.name, detail:task.detail, priority:task.priority, status:task.status, theme:theme.get(task.themeId), subject:subject.get(task.subjectId), ...(permissions.durations ? { plannedMinutes:task.plannedDuration, actualMinutes:task.actualDuration } : {}), ...(permissions.focus ? { focusScore:task.focusScore, energyScore:task.energyScore } : {}) })
    : ({ 任务名称:task.name, 具体子任务:task.detail, 优先级:task.priority, 状态:task.status, 主题或项目:theme.get(task.themeId), 学习科目:subject.get(task.subjectId), ...(permissions.durations ? { 计划时长_分钟:task.plannedDuration, 实际时长_分钟:task.actualDuration } : {}), ...(permissions.focus ? { 专注度_1到5:task.focusScore, 精力值_1到5:task.energyScore } : {}) })
  const dayTasks = permissions.tasks ? source.tasks.filter(task => task.date === date).map(taskView) : []
  const recentDates = new Set(Array.from({ length:7 }, (_,index) => format(subDays(new Date(`${date}T00:00:00`), index), 'yyyy-MM-dd')))
  const recent = permissions.recentHistory ? source.tasks.filter(task => recentDates.has(task.date)).map(taskView) : []
  const review = permissions.reviews ? source.dailyRecords.find(item => item.date === date) : undefined
  const payload = source.outputLanguage === 'en-US'
    ? { date, todayTasks:dayTasks, unfinishedPriorityTasks:permissions.tasks ? source.tasks.filter(task => task.priority === 'P1' && task.status !== 'done' && task.status !== 'cancelled').slice(0,8).map(taskView) : [], ...(permissions.recentHistory ? { recentSevenDaySummary:dailyStats(source.tasks.filter(task => recentDates.has(task.date))), recentTasks:recent } : {}), ...(permissions.reviews && review ? { dailyReview:pickReview(review, 'en-US') } : {}), ...(permissions.goals ? { goals:{ startDate:source.settings.startDate,endDate:source.settings.endDate,goalDays:source.settings.goalDays,goalStudyHours:source.settings.goalStudyHours,goalTaskCount:source.settings.goalTaskCount } } : {}), themes:source.themes.map(item => item.name), subjects:source.subjects.map(item => item.name), templates:source.templates.slice(0,16).map((item:TaskTemplate) => item.name) }
    : { 日期:date, 今日任务:dayTasks, 未完成的P1任务:permissions.tasks ? source.tasks.filter(task => task.priority === 'P1' && task.status !== 'done' && task.status !== 'cancelled').slice(0,8).map(taskView) : [], ...(permissions.recentHistory ? { 最近7天汇总:dailyStats(source.tasks.filter(task => recentDates.has(task.date))), 最近7天任务:recent } : {}), ...(permissions.reviews && review ? { 今日复盘:pickReview(review, 'zh-CN') } : {}), ...(permissions.goals ? { 暑期目标:{ 开始日期:source.settings.startDate,结束日期:source.settings.endDate,目标打卡天数:source.settings.goalDays,目标学习小时:source.settings.goalStudyHours,目标任务数:source.settings.goalTaskCount } } : {}), 可用主题:source.themes.map(item => item.name), 可用学习科目:source.subjects.map(item => item.name), 可用任务模板:source.templates.slice(0,16).map((item:TaskTemplate) => item.name) }
  return payload as Record<string, unknown>
}
function pickReview(record: DailyRecord, language: ResolvedOutputLanguage) { return language === 'en-US' ? { mood:record.mood, review:record.review, achievement:record.achievement, problem:record.problem, satisfaction:record.satisfaction, nextStep:record.nextStep } : { 今日状态:record.mood, 今日复盘:record.review, 今日收获:record.achievement, 遇到的问题:record.problem, 满意的事情:record.satisfaction, 明日第一步:record.nextStep } }
