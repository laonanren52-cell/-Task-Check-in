import { format, isBefore, parseISO } from 'date-fns'
import { ArrowUpRight, BrainCircuit, Calendar, CheckCircle2, Clock3, Flame, Plus, Sparkles, Target, Trophy } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { DailyReviewEditor } from '../features/checkins/DailyReviewEditor'
import { currentStreak, longestStreak, totalPoints } from '../features/statistics'
import { getCanonicalDailySummary } from '../features/statistics/canonicalDailySummary'
import { TaskList } from '../features/tasks/TaskList'
import { AIPlannerDrawer } from '../features/ai/components/AIPlannerDrawer'
import { defaultSelectedDate, isoToday } from '../lib/date'
import { useAppStore } from '../stores/appStore'
import type { DailyRecord } from '../types'
import './todayVisuals.css'

export function TodayPage() {
  const { settings, tasks, dailyRecords, saveDailyRecord } = useAppStore()
  const [params, setParams] = useSearchParams()
  const selected = params.get('date') ?? defaultSelectedDate(settings.startDate, settings.endDate)
  const dateTasks = useMemo(
    () => tasks.filter(task => task.date === selected).sort((a, b) => a.order - b.order),
    [tasks, selected],
  )
  const summary = useMemo(() => getCanonicalDailySummary(tasks, dailyRecords, selected), [tasks, dailyRecords, selected])
  const record = dailyRecords.find(item => item.date === selected)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [planning, setPlanning] = useState(false)
  const toast = useToast()
  const { openNewTask } = useOutletContext<{ openNewTask: () => void }>()
  const makeup = isBefore(parseISO(selected), parseISO(isoToday()))
  const checkedDays = dailyRecords.filter(item => item.checkedIn).length
  const cumulativeMinutes = tasks.reduce((sum, task) => sum + task.actualDuration, 0)
  const completedTasks = tasks.filter(task => task.status === 'done').length
  const dayState = summary.taskCount === 0 ? '先留下一条可完成的学习轨迹。' : summary.completionRate === 100 ? '今天的关键安排已全部完成。' : summary.completionRate >= 60 ? '节奏正在推进，先收尾最重要的一件事。' : '从下一件可完成的小任务开始。'
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo('.today-reveal', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .46, stagger: .055, ease: 'power2.out', clearProps: 'transform' })
  }, { scope: pageRef, dependencies: [selected, dateTasks.length], revertOnUpdate: true })

  const toggle = async () => {
    const now = new Date().toISOString()
    await saveDailyRecord(record ? {
      ...record,
      checkedIn: !record.checkedIn,
      checkinTime: !record.checkedIn ? now : undefined,
      isMakeup: !record.checkedIn && makeup,
      updatedAt: now,
    } : {
      date: selected,
      checkedIn: true,
      checkinTime: now,
      isMakeup: makeup,
      review: '',
      nextStep: '',
      achievement: '',
      problem: '',
      satisfaction: '',
      createdAt: now,
      updatedAt: now,
    })
    toast(record?.checkedIn ? '已取消正式打卡' : makeup ? '补签记录已完成' : '今日打卡完成')
  }

  return <div className="page today-page" ref={pageRef}>
    <section className="today-masthead today-reveal">
      <div className="today-masthead__editorial">
        <div className="today-masthead__date"><span>{format(parseISO(selected), 'yyyy 年 M 月 d 日 · EEEE')}</span><i /><span>{record?.checkedIn ? '今日已正式打卡' : '等待今日打卡'}</span></div>
        <h1>把注意力，留给<br />真正重要的一件事。</h1>
        <p>{dayState}</p>
        <div className="today-masthead__streak"><Flame /><span>当前连续</span><b>{currentStreakLabel(dailyRecords)}</b></div>
      </div>
      <div className="today-masthead__utility">
        <label className="date-control today-date-picker"><Calendar /><input type="date" value={selected} onChange={event => setParams({ date: event.target.value })} /></label>
        <div className="today-masthead__actions"><Button variant="secondary" onClick={() => setPlanning(true)}><BrainCircuit />AI 安排</Button><Button onClick={openNewTask}><Plus />新增任务</Button></div>
        <div className="today-masthead__note"><Target /><span><b>今日目标</b> {summary.plannedMinutes || 0} 分钟计划投入</span></div>
      </div>
    </section>
    <section className="today-observatory today-reveal" aria-label="今日学习进度">
      <article className="today-observatory__primary">
        <div><span className="eyebrow">今日进度</span><strong>{summary.completedTaskCount}<small> / {summary.taskCount || 0} 项</small></strong><p>{summary.completionRate}% 完成率 · {dayState}</p></div>
        <div className="today-progress-ring" style={{ '--progress': `${summary.completionRate * 3.6}deg` } as React.CSSProperties}><div><b>{summary.completionRate}%</b><span>完成</span></div></div>
        <div className="today-observatory__track"><div><span>完成轨迹</span><b>{summary.completedTaskCount} 项已完成</b></div><div className="progress"><i style={{ width: `${summary.completionRate}%` }} /></div></div>
      </article>
      <article className="today-observatory__measure"><Clock3 /><span>今日投入</span><strong>{summary.actualMinutes}<small> 分钟</small></strong><p>计划 {summary.plannedMinutes} 分钟</p></article>
      <article className="today-observatory__measure"><Trophy /><span>累计记录</span><strong>{checkedDays}<small> 天</small></strong><p>学习 {Math.round(cumulativeMinutes / 60 * 10) / 10} 小时</p></article>
      <article className="today-observatory__measure today-observatory__measure--accent"><CheckCircle2 /><span>学习积分</span><strong>{totalPoints(tasks)}<small> 分</small></strong><p>已完成 {completedTasks} 项 · 最长 {longestStreak(dailyRecords)} 天</p></article>
    </section>
    {makeup && <div className="makeup-note">你正在查看过去日期的学习记录。完成打卡会明确标记为补签记录。</div>}
    <section className="today-task-stage today-reveal">
      <div className="section-heading today-task-stage__heading"><div><span className="eyebrow">当日任务</span><h2>下一件重要的事</h2><p>任务是今天的工作台，不必一次规划太多。</p></div><div><b>{summary.taskCount}</b><span>项有效任务</span></div></div>
      {dateTasks.length
        ? <TaskList tasks={dateTasks} reorder />
        : <div className="today-empty-path"><div className="today-empty-path__route"><i /><i /><i /><i /></div><div><span className="eyebrow">学习从一条清晰的轨迹开始</span><h3>今天还没有安排。</h3><p>先写下一项足够小、但能真正推进学习的任务。</p><div><Button onClick={openNewTask}><Plus />添加第一项任务</Button><Button variant="secondary" onClick={() => setPlanning(true)}><Sparkles />让 AI 帮我安排<ArrowUpRight /></Button></div></div></div>}
    </section>
    <div className="today-reveal"><DailyReviewEditor date={selected} record={record} onCheckin={() => record?.checkedIn ? setConfirmCancel(true) : toggle()} /></div>
    <Dialog open={confirmCancel} title="取消这一天的正式打卡？" description="取消后，这一天不再计入连续打卡；任务和复盘内容会保留。" confirmLabel="取消打卡" danger onClose={() => setConfirmCancel(false)} onConfirm={async () => { await toggle(); setConfirmCancel(false) }} />
    {planning && <AIPlannerDrawer date={selected} onClose={() => setPlanning(false)} />}
  </div>
}

function currentStreakLabel(records: DailyRecord[]) { return `${currentStreak(records)} 天` }
