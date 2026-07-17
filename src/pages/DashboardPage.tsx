import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth, subDays } from 'date-fns'
import { Activity, CheckCircle2, Clock3, Flame, Focus, Sparkles, Target, Trophy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { ChartContainer } from '../features/dashboard/ChartContainer'
import { buildAdvice } from '../features/statistics/advice'
import { activeTasks, averageFocus, completionRate, currentStreak, dailyStats, longestStreak, totalPoints, weeklyMinutes } from '../features/statistics'
import { useAppStore } from '../stores/appStore'

const palette = ['#617a95', '#4f806e', '#a77c43', '#7c7196', '#6e8872']
type ChartPayload = { color?: string; name?: string; value?: number | string }
function DashboardTooltip({ active, payload, label }: { active?: boolean; payload?: ChartPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="dashboard-tooltip"><span>{label}</span>{payload.map((item, index) => <b key={`${item.name}-${index}`} style={{ color: item.color }}>{item.value}{item.name === 'rate' ? '%' : ' 分钟'}</b>)}</div>
}

export function DashboardPage() {
  const { tasks, dailyRecords, themes, subjects, settings } = useAppStore()
  const active = activeTasks(tasks)
  const done = active.filter(task => task.status === 'done').length
  const totalMinutes = active.reduce((sum, task) => sum + task.actualDuration, 0)
  const checked = dailyRecords.filter(record => record.checkedIn).length
  const last = (count: number) => Array.from({ length: count }, (_, index) => {
    const day = subDays(new Date(), count - 1 - index)
    const date = format(day, 'yyyy-MM-dd')
    const stats = dailyStats(tasks.filter(task => task.date === date))
    return { date: format(day, 'M/d'), minutes: stats.actual, rate: Math.round(stats.rate * 100), focus: Number(stats.focus.toFixed(1)) }
  })
  const seven = last(7)
  const thirty = last(30)
  const weeks = weeklyMinutes(tasks).slice(-10).map(week => ({
    date: format(parseISO(week.date), 'M/d'), minutes: week.minutes,
    rate: Math.round(completionRate(tasks.filter(task => { const difference = (parseISO(task.date).getTime() - parseISO(week.date).getTime()) / 86400000; return difference >= 0 && difference < 7 })) * 100),
  }))
  const distribution = (items: { id: string; name: string }[], key: 'subjectId' | 'themeId') => items.map(item => ({ name: item.name, value: active.filter(task => task[key] === item.id).reduce((sum, task) => sum + task.actualDuration, 0) })).filter(item => item.value).sort((a, b) => b.value - a.value)
  const subjectData = distribution(subjects, 'subjectId')
  const themeData = distribution(themes, 'themeId')
  const monthDays = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
  const weeklyGoal = settings.weeklyGoalMinutes || settings.dailyGoalMinutes * 7
  const latestWeekMinutes = seven.reduce((sum, item) => sum + item.minutes, 0)

  return <div className="page dashboard-page">
    <PageHeader eyebrow="洞察 / 数据看板" title="让投入形成可读的证据。" description="所有指标只使用这台设备里的真实学习记录；先看节奏，再决定下一步。" />
    <section className="dashboard-summary">
      <div className="dashboard-summary__story"><span className="eyebrow">本周观察</span><h2>{buildAdvice(tasks, dailyRecords)}</h2><p>最近 7 天已记录 {latestWeekMinutes} 分钟；{weeklyGoal ? `距离每周目标还差 ${Math.max(0, weeklyGoal - latestWeekMinutes)} 分钟。` : '在设置中填写每周目标后，这里会提供更具体的节奏判断。'}</p></div>
      <div className="dashboard-summary__goal"><span>暑期时长目标</span><strong>{Math.min(100, Math.round(totalMinutes / Math.max(1, settings.goalStudyHours * 60) * 100))}%</strong><div className="progress"><i style={{ width: `${Math.min(100, totalMinutes / Math.max(1, settings.goalStudyHours * 60) * 100)}%` }} /></div><small>{Math.round(totalMinutes / 60 * 10) / 10} / {settings.goalStudyHours} 小时</small></div>
    </section>
    <section className="dashboard-instrument" aria-label="核心学习指标">
      <DashMetric icon={<Flame />} value={`${checked}`} label="有效打卡天数" /><DashMetric icon={<Activity />} value={`${currentStreak(dailyRecords)}`} label="当前连续" /><DashMetric icon={<Trophy />} value={`${longestStreak(dailyRecords)}`} label="最长连续" /><DashMetric icon={<Clock3 />} value={`${Math.round(totalMinutes / 60 * 10) / 10}h`} label="累计学习" /><DashMetric icon={<CheckCircle2 />} value={`${done}`} label="完成任务" /><DashMetric icon={<Target />} value={`${Math.round(completionRate(tasks) * 100)}%`} label="总体完成率" /><DashMetric icon={<Focus />} value={`${averageFocus(tasks).toFixed(1)}`} label="平均专注度" /><DashMetric icon={<Sparkles />} value={`${totalPoints(tasks)}`} label="累计积分" />
    </section>
    <section className="dashboard-section"><div className="dashboard-section__heading"><span className="eyebrow">节奏</span><h2>时间是否被稳定地投入？</h2></div><div className="dashboard-grid dashboard-grid--trends">
      <ChartContainer title="最近 7 天学习时长" question="每天留下了多少真实投入？" empty={!seven.some(item => item.minutes)}><ResponsiveContainer width="100%" height={250}><BarChart data={seven}><CartesianGrid strokeDasharray="3 4" vertical={false} /><XAxis dataKey="date" /><YAxis width={38} /><Tooltip content={<DashboardTooltip />} cursor={{ fill: 'rgba(80, 111, 98, .07)' }} /><Bar dataKey="minutes" name="minutes" fill={palette[0]} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartContainer>
      <ChartContainer title="最近 30 天学习趋势" question="投入在上升、稳定还是下降？" empty={!thirty.some(item => item.minutes)}><ResponsiveContainer width="100%" height={250}><LineChart data={thirty}><CartesianGrid strokeDasharray="3 4" vertical={false} /><XAxis dataKey="date" interval={5} /><YAxis width={38} /><Tooltip content={<DashboardTooltip />} /><Line type="monotone" dataKey="minutes" name="minutes" stroke={palette[1]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></ChartContainer>
      <ChartContainer title="每周学习时长" question="周与周之间的投入是否持续？" empty={!weeks.length}><ResponsiveContainer width="100%" height={250}><BarChart data={weeks}><CartesianGrid strokeDasharray="3 4" vertical={false} /><XAxis dataKey="date" /><YAxis width={38} /><Tooltip content={<DashboardTooltip />} /><Bar dataKey="minutes" name="minutes" fill={palette[4]} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartContainer>
      <ChartContainer title="每周任务完成率" question="哪些周的执行效率最好？" empty={!weeks.length}><ResponsiveContainer width="100%" height={250}><LineChart data={weeks}><CartesianGrid strokeDasharray="3 4" vertical={false} /><XAxis dataKey="date" /><YAxis domain={[0, 100]} width={38} /><Tooltip content={<DashboardTooltip />} /><Line type="monotone" dataKey="rate" name="rate" stroke={palette[2]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></ChartContainer>
    </div></section>
    <section className="dashboard-section"><div className="dashboard-section__heading"><span className="eyebrow">去向</span><h2>时间正流向哪里？</h2></div><div className="dashboard-grid dashboard-grid--distribution"><ChartContainer title="学习科目投入" question="哪个科目获得了最多的时间？" empty={!subjectData.length}><Distribution data={subjectData} /></ChartContainer><ChartContainer title="主题 / 项目投入" question="时间是否流向当前最重要的项目？" empty={!themeData.length}><Distribution data={themeData} /></ChartContainer></div></section>
    <section className="dashboard-section"><div className="dashboard-section__heading"><span className="eyebrow">质量与连续性</span><h2>状态是否支持长期推进？</h2></div><div className="dashboard-grid dashboard-grid--quality"><ChartContainer title="每日专注度趋势" question="专注度是否正在下降？" empty={!thirty.some(item => item.focus)}><ResponsiveContainer width="100%" height={250}><LineChart data={thirty}><CartesianGrid strokeDasharray="3 4" vertical={false} /><XAxis dataKey="date" interval={5} /><YAxis domain={[0, 5]} width={38} /><Tooltip content={<DashboardTooltip />} /><Line type="monotone" dataKey="focus" name="focus" stroke={palette[3]} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></ChartContainer><ChartContainer title="月度打卡热力图" question="哪些日期形成了连续记录？" empty={!dailyRecords.some(record => record.checkedIn && record.date.startsWith(format(new Date(), 'yyyy-MM')))}><div className="month-heatmap">{monthDays.map(day => { const date = format(day, 'yyyy-MM-dd'); const complete = dailyRecords.some(record => record.date === date && record.checkedIn); const minutes = dailyStats(tasks.filter(task => task.date === date)).actual; return <div key={date} className={`${complete ? 'checked' : ''} heat-${Math.min(4, Math.ceil(minutes / 60))}`} title={`${date}: ${minutes} 分钟`}><span>{format(day, 'd')}</span></div> })}</div></ChartContainer></div></section>
  </div>
}

function DashMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="dash-metric"><span>{icon}{label}</span><strong>{value}</strong></div> }
function Distribution({ data }: { data: { name: string; value: number }[] }) { return <ResponsiveContainer width="100%" height={250}><BarChart data={data.slice(0, 7)} layout="vertical" margin={{ left: 12 }}><CartesianGrid strokeDasharray="3 4" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={88} tickLine={false} axisLine={false} /><Tooltip content={<DashboardTooltip />} cursor={{ fill: 'rgba(80, 111, 98, .07)' }} /><Bar dataKey="value" name="minutes" fill={palette[0]} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer> }
