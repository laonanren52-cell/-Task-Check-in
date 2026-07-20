import { useEffect, useMemo, useRef, useState } from 'react'
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth, subDays } from 'date-fns'
import { Activity, Clock3, Flame, Target } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from 'framer-motion'
import { ChartAnnotation, ChartContainer, ChartLegend } from '../features/dashboard/ChartContainer'
import { buildAdvice } from '../features/statistics/advice'
import { activeTasks, completionRate, currentStreak, dailyStats, totalPoints, weeklyMinutes } from '../features/statistics'
import { useAppStore } from '../stores/appStore'
import './dashboardVisuals.css'

const palette = ['#315f50', '#6c879b', '#ad8045', '#81758f', '#7f9c86']
type ChartPayload = { color?: string; name?: string; value?: number | string }

function DashboardTooltip({ active, payload, label }: { active?: boolean; payload?: ChartPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="dashboard-tooltip"><span>{label}</span>{payload.map((item, index) => <b key={`${item.name}-${index}`} style={{ color: item.color }}>{chartLabel(item.name, item.value)}</b>)}</div>
}

export function DashboardPage() {
  const { tasks, dailyRecords, themes, subjects, settings } = useAppStore()
  const pageRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const active = activeTasks(tasks)
  const done = active.filter(task => task.status === 'done').length
  const totalMinutes = active.reduce((sum, task) => sum + task.actualDuration, 0)
  const checked = dailyRecords.filter(record => record.checkedIn).length
  const today = format(new Date(), 'yyyy-MM-dd')
  const last = (count: number) => Array.from({ length: count }, (_, index) => {
    const day = subDays(new Date(), count - 1 - index)
    const date = format(day, 'yyyy-MM-dd')
    const todayTasks = tasks.filter(task => task.date === date)
    const stats = dailyStats(todayTasks)
    const energyValues = todayTasks.map(task => task.energyScore).filter((score): score is number => typeof score === 'number' && score > 0)
    return { date: format(day, 'M/d'), fullDate: date, minutes: stats.actual, rate: Math.round(stats.rate * 100), focus: Number(stats.focus.toFixed(1)), energy: Number((energyValues.length ? energyValues.reduce((sum, score) => sum + score, 0) / energyValues.length : 0).toFixed(1)) }
  })
  const seven = last(7)
  const thirty = last(30)
  const recentDates = new Set(seven.map(item => item.fullDate))
  const recentTasks = active.filter(task => recentDates.has(task.date))
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
  const weekRate = Math.round(completionRate(recentTasks) * 100)
  const activeDays = seven.filter(item => item.minutes > 0).length
  const overdue = active.filter(task => task.date < today && task.status !== 'done')
  const summerProgress = Math.min(100, Math.round(totalMinutes / Math.max(1, settings.goalStudyHours * 60) * 100))
  const weeklyMessage = buildWeekMessage({ latestWeekMinutes, weeklyGoal, weekRate, activeDays, overdue: overdue.length })
  const priorWeek = weeks.length > 1 ? weeks[weeks.length - 2] : undefined
  const weekDelta = priorWeek ? latestWeekMinutes - priorWeek.minutes : undefined
  const highestDay = seven.reduce((best, item) => item.minutes > best.minutes ? item : best, seven[0])

  useGSAP(() => {
    if (reduceMotion) return
    gsap.fromTo('.dashboard-reveal', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .55, stagger: .075, ease: 'power2.out', clearProps: 'transform' })
  }, { scope: pageRef, dependencies: [tasks.length, dailyRecords.length, reduceMotion], revertOnUpdate: true })

  return <div className="page dashboard-page dashboard-atmosphere" ref={pageRef}>
    <section className="dashboard-masthead dashboard-reveal"><div><span className="eyebrow">洞察 / 学习节奏</span><h1>让投入形成<br />可读的证据。</h1><p>把真实记录转成下一次行动，而不是一排静态数字。</p></div><div className="dashboard-masthead__meta"><span>本周状态</span><b>{activeDays ? `${activeDays} 天留下记录` : '等待第一条记录'}</b><i /><small>数据只来自当前设备的本地学习记录</small></div></section>
    <section className="dashboard-observatory dashboard-reveal" aria-label="本周学习状态">
      <article className="dashboard-summary">
        <div className="dashboard-summary__story"><span className="eyebrow">本周观察</span><h2>{weeklyMessage}</h2><p>{buildAdvice(tasks, dailyRecords)}</p></div>
        <div className="dashboard-summary__goal"><span>暑期时长目标</span><strong><AnimatedNumber value={summerProgress} suffix="%" /></strong><div className="progress"><i style={{ width: `${summerProgress}%` }} /></div><small>{formatHours(totalMinutes)} / {settings.goalStudyHours} 小时</small></div>
      </article>
      <aside className="dashboard-pulse"><div className="dashboard-pulse__lead"><Clock3 /><span>本周投入</span><strong><AnimatedNumber value={latestWeekMinutes} suffix=" 分钟" /></strong></div><div><Target /><span>任务完成率</span><b>{weekRate}%</b></div><div><Flame /><span>当前连续</span><b>{currentStreak(dailyRecords)} 天</b></div><div><Activity /><span>记录天数</span><b>{activeDays} / 7</b></div></aside>
    </section>
    <section className="dashboard-section dashboard-reveal"><SectionHeading title="节奏" subtitle="时间是否被稳定地投入？" /><div className="dashboard-grid dashboard-grid--rhythm grid-flow-dense">
      <ChartContainer className="chart-container--primary" title="最近 7 天学习时长" question="每天留下了多少真实投入？" summary={<ChartAnnotation label="本周累计" value={`${latestWeekMinutes} 分钟`} />} empty={!seven.some(item => item.minutes)}><ResponsiveContainer width="100%" height={278}><BarChart data={seven} barCategoryGap="35%"><defs><linearGradient id="sevenDayBars" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f866c" /><stop offset="100%" stopColor="#a8c7af" /></linearGradient></defs><CartesianGrid strokeDasharray="2 6" vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis width={38} tickLine={false} axisLine={false} /><Tooltip content={<DashboardTooltip />} cursor={{ fill: 'rgba(49, 95, 80, .045)' }} /><Bar dataKey="minutes" name="学习时长" radius={[9, 9, 3, 3]} animationDuration={reduceMotion ? 0 : 820} animationBegin={reduceMotion ? 0 : 80}><LabelList dataKey="minutes" position="top" formatter={value => Number(value) ? `${value}` : ''} className="chart-value-label" />{seven.map(item => <Cell key={item.fullDate} fill={item.fullDate === today ? '#285f4c' : 'url(#sevenDayBars)'} />)}</Bar></BarChart></ResponsiveContainer></ChartContainer>
      <ChartContainer className="chart-container--side" title="最近 30 天学习趋势" question="投入在上升、稳定还是下降？" summary={<ChartAnnotation label="最高投入" value={highestDay?.minutes ? `${highestDay.date} · ${highestDay.minutes} 分钟` : '等待记录'} />} legend={<ChartLegend items={[{ label: '实际学习时长', color: palette[1] }]} />} empty={!thirty.some(item => item.minutes)}><ResponsiveContainer width="100%" height={278}><AreaChart data={thirty}><defs><linearGradient id="minutesWash" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={palette[1]} stopOpacity={.31} /><stop offset="75%" stopColor={palette[1]} stopOpacity={.04} /><stop offset="100%" stopColor={palette[1]} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="2 6" vertical={false} /><XAxis dataKey="date" interval={5} tickLine={false} axisLine={false} /><YAxis width={38} tickLine={false} axisLine={false} /><Tooltip content={<DashboardTooltip />} /><Area type="monotoneX" dataKey="minutes" name="学习时长" stroke={palette[1]} fill="url(#minutesWash)" strokeWidth={2.6} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fffdfa' }} animationDuration={reduceMotion ? 0 : 840} /></AreaChart></ResponsiveContainer></ChartContainer>
      <ChartContainer title="每周学习时长" question="周与周之间的投入是否持续？" summary={<ChartAnnotation label="环比" value={weekDelta === undefined ? '累积中' : `${weekDelta >= 0 ? '+' : ''}${weekDelta} 分钟`} />} empty={!weeks.length}>{weeks.length < 3 ? <WeekComparison current={latestWeekMinutes} previous={priorWeek?.minutes} /> : <ResponsiveContainer width="100%" height={238}><BarChart data={weeks} barCategoryGap="42%"><CartesianGrid strokeDasharray="2 6" vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis width={38} tickLine={false} axisLine={false} /><Tooltip content={<DashboardTooltip />} /><Bar dataKey="minutes" name="学习时长" fill="#8bac96" radius={[9, 9, 3, 3]} animationDuration={reduceMotion ? 0 : 760}>{weeks.map((week, index) => <Cell key={`${week.date}-${index}`} fill={index === weeks.length - 1 ? '#3f735d' : '#b9ceb9'} />)}</Bar></BarChart></ResponsiveContainer>}</ChartContainer>
      <ChartContainer title="每周任务完成率" question="完成质量是否保持稳定？" summary={<ChartAnnotation label="本周" value={`${weekRate}%`} />} legend={<ChartLegend items={[{ label: '任务完成率', color: palette[2] }]} />} empty={!weeks.length}>{weeks.length < 3 ? <RateComparison current={weekRate} previous={priorWeek?.rate} /> : <ResponsiveContainer width="100%" height={238}><LineChart data={weeks}><CartesianGrid strokeDasharray="2 6" vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} width={38} tickLine={false} axisLine={false} /><Tooltip content={<DashboardTooltip />} /><Line type="monotoneX" dataKey="rate" name="完成率" stroke={palette[2]} strokeWidth={2.7} dot={{ r: 2.5, fill: '#fffdfa', strokeWidth: 2 }} activeDot={{ r: 5, fill: palette[2] }} animationDuration={reduceMotion ? 0 : 780} /></LineChart></ResponsiveContainer>}</ChartContainer>
    </div></section>
    <section className="dashboard-section dashboard-reveal"><SectionHeading title="投入" subtitle="时间正流向哪里？" /><div className="dashboard-grid dashboard-grid--allocation grid-flow-dense"><ChartContainer title="学习科目投入排行" question="时长与占比并排呈现，避免把时间藏在饼图里。" summary={<ChartAnnotation label="第一科目" value={subjectData[0]?.name ?? '暂无'} />} empty={!subjectData.length}><RankedAllocation data={subjectData} /></ChartContainer><ChartContainer title="主题 / 项目投入排行" question="让投入是否流向当前最重要的项目一眼可见。" summary={<ChartAnnotation label="第一项目" value={themeData[0]?.name ?? '暂无'} />} empty={!themeData.length}><RankedAllocation data={themeData} tone="copper" /></ChartContainer></div></section>
    <section className="dashboard-section dashboard-reveal"><SectionHeading title="质量与连续性" subtitle="状态是否支持长期推进？" /><div className="dashboard-grid dashboard-grid--quality grid-flow-dense">
      <ChartContainer className="chart-container--quality" title="专注度与精力趋势" question="高投入日是否也保持了较好的状态？" empty={!thirty.some(item => item.focus || item.energy)}><ResponsiveContainer width="100%" height={244}><LineChart data={thirty}><CartesianGrid strokeDasharray="2 5" vertical={false} /><XAxis dataKey="date" interval={5} tickLine={false} axisLine={false} /><YAxis domain={[0, 5]} width={34} tickLine={false} axisLine={false} /><Tooltip content={<DashboardTooltip />} /><Line type="monotone" dataKey="focus" name="专注度" stroke={palette[3]} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} animationDuration={reduceMotion ? 0 : 650} /><Line type="monotone" dataKey="energy" name="精力值" stroke={palette[0]} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} animationDuration={reduceMotion ? 0 : 700} /></LineChart></ResponsiveContainer></ChartContainer>
      <ChartContainer className="chart-container--heatmap" title="本月打卡热力图" question="哪些日期形成了连续记录？" empty={!dailyRecords.some(record => record.checkedIn && record.date.startsWith(format(new Date(), 'yyyy-MM')))}><div className="month-heatmap">{monthDays.map(day => { const date = format(day, 'yyyy-MM-dd'); const complete = dailyRecords.some(record => record.date === date && record.checkedIn); const minutes = dailyStats(tasks.filter(task => task.date === date)).actual; return <div key={date} className={`${complete ? 'checked' : ''} heat-${Math.min(4, Math.ceil(minutes / 60))}`} title={`${date}: ${minutes} 分钟`}><span>{format(day, 'd')}</span></div> })}</div></ChartContainer>
      <article className="execution-card"><span className="eyebrow">近期执行稳定性</span><strong>{activeDays}<small> / 7 天</small></strong><p>{activeDays >= 5 ? '节奏保持得不错，继续给高认知任务留出完整时段。' : '这周的记录还不够连贯，可以先为明天留下一项最容易开始的任务。'}</p><div className="execution-card__scale"><i style={{ width: `${activeDays / 7 * 100}%` }} /></div></article>
    </div></section>
    <section className="dashboard-next dashboard-reveal"><div><span className="eyebrow">下一步</span><h2>把洞察留在下一次行动里。</h2><p>{weeklyMessage}</p></div><div className="dashboard-next__items"><NextItem label="目标推进" value={weeklyGoal ? `本周还差 ${Math.max(0, weeklyGoal - latestWeekMinutes)} 分钟` : '在设置中补充每周目标'} /><NextItem label="历史积压" value={overdue.length ? `有 ${overdue.length} 项任务等待重新安排` : '暂时没有历史积压'} /><NextItem label="累计积分" value={`${totalPoints(tasks)} 分`} /></div></section>
  </div>
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) { return <div className="dashboard-section__heading"><span className="eyebrow">{title}</span><h2>{subtitle}</h2></div> }
function ChartFooter({ label, value }: { label: string; value: string }) { return <footer className="chart-footer"><span>{label}</span><b>{value}</b></footer> }
function NextItem({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><b>{value}</b></div> }

function WeekComparison({ current, previous }: { current: number; previous?: number }) { return <div className="week-comparison"><div><span>本周</span><b>{current}<small> 分钟</small></b><i style={{ '--bar': `${Math.max(8, previous ? current / Math.max(current, previous) * 100 : 100)}%` } as React.CSSProperties} /></div><div><span>上周</span><b>{previous ?? 0}<small> 分钟</small></b><i className="is-muted" style={{ '--bar': `${Math.max(8, current ? (previous ?? 0) / Math.max(current, previous ?? 0) * 100 : 8)}%` } as React.CSSProperties} /></div></div> }
function RateComparison({ current, previous }: { current: number; previous?: number }) { return <div className="rate-comparison"><strong>{current}%</strong><div><span>本周完成率</span><i><b style={{ width: `${current}%` }} /></i><small>{previous === undefined ? '再完成一周后即可比较环比。' : `较上周 ${current - previous >= 0 ? '提升' : '下降'} ${Math.abs(current - previous)}%`}</small></div></div> }
function RankedAllocation({ data, tone = 'forest' }: { data: { name: string; value: number }[]; tone?: 'forest' | 'copper' }) { const top = Math.max(...data.map(item => item.value)); const total = data.reduce((sum, item) => sum + item.value, 0); return <ol className={`ranked-allocation ranked-allocation--${tone}`}>{data.slice(0, 6).map((item, index) => <li key={item.name}><span className="ranked-allocation__index">{String(index + 1).padStart(2, '0')}</span><div><div><b>{item.name}</b><span>{item.value} 分钟 · {Math.round(item.value / total * 100)}%</span></div><i><em style={{ width: `${item.value / top * 100}%` }} /></i></div></li>)}</ol> }

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(reduceMotion ? value : 0)
  useEffect(() => {
    if (reduceMotion) { setDisplay(value); return }
    const state = { value: 0 }
    const tween = gsap.to(state, { value, duration: .68, ease: 'power2.out', onUpdate: () => setDisplay(state.value) })
    return () => { tween.kill() }
  }, [value, reduceMotion])
  const rounded = Number.isInteger(value) ? Math.round(display) : Math.round(display * 10) / 10
  return <>{rounded}{suffix}</>
}

function chartLabel(name?: string, value?: number | string) {
  const suffix = name === '完成率' ? '%' : name === '专注度' || name === '精力值' ? '' : ' 分钟'
  return `${name ?? '数据'} ${value ?? ''}${suffix}`
}
function formatHours(minutes: number) { return Math.round(minutes / 60 * 10) / 10 }
function buildWeekMessage({ latestWeekMinutes, weeklyGoal, weekRate, activeDays, overdue }: { latestWeekMinutes: number; weeklyGoal: number; weekRate: number; activeDays: number; overdue: number }) {
  if (!latestWeekMinutes) return '这一周还没有留下学习记录，从一项容易开始的小任务重新进入节奏就好。'
  if (weekRate === 100 && activeDays >= 5) return `这周的节奏很稳：${activeDays} 天留下记录，任务也都完成了。`
  if (overdue > 0) return `这周完成率为 ${weekRate}%，另有 ${overdue} 项历史任务可以单独重新安排。`
  if (weeklyGoal && latestWeekMinutes < weeklyGoal) return `这周已投入 ${latestWeekMinutes} 分钟，离目标还差 ${weeklyGoal - latestWeekMinutes} 分钟。`
  return `这周已投入 ${latestWeekMinutes} 分钟，完成率为 ${weekRate}%，保持当前节奏即可。`
}
