import { format, isBefore, parseISO } from 'date-fns'
import { Award, Calendar, CheckCircle2, Clock3, Flame, Plus, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import { DailyReviewEditor } from '../features/checkins/DailyReviewEditor'
import { longestStreak, totalPoints } from '../features/statistics'
import { getCanonicalDailySummary } from '../features/statistics/canonicalDailySummary'
import { TaskList } from '../features/tasks/TaskList'
import { AIPlannerDrawer } from '../features/ai/components/AIPlannerDrawer'
import { defaultSelectedDate, isoToday } from '../lib/date'
import { useAppStore } from '../stores/appStore'

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
    <div className="today-reveal"><PageHeader
      eyebrow={format(parseISO(selected), 'yyyy 年 M 月 d 日 · EEEE')}
      title="今天的学习，有序推进。"
      description="同一天可以记录多个主题、项目和学习科目，每项任务独立留下过程与成果。"
      actions={<>
        <label className="date-control"><Calendar /><input type="date" value={selected} onChange={event => setParams({ date: event.target.value })} /></label>
        <Button variant="secondary" onClick={() => setPlanning(true)}><Sparkles />AI 安排</Button>
        <Button onClick={openNewTask}><Plus />新增任务</Button>
      </>}
    /></div>
    <section className="day-overview grid-flow-dense today-reveal">
      <div className="day-overview__main">
        <span>当天完成进度</span>
        <strong>{summary.completedTaskCount} / {summary.taskCount} 项任务</strong>
        <div className="progress"><i style={{ width: `${summary.completionRate}%` }} /></div>
        <p>{summary.completionRate}% 完成率 · 计划 {summary.plannedMinutes} 分钟 · 实际 {summary.actualMinutes} 分钟 · 专注 {summary.averageFocus || 0}</p>
      </div>
      <Metric icon={<Calendar />} value={`${checkedDays}`} unit="天" label="累计打卡" />
      <Metric icon={<Clock3 />} value={`${Math.round(cumulativeMinutes / 60 * 10) / 10}`} unit="小时" label="累计学习" />
      <Metric icon={<CheckCircle2 />} value={`${completedTasks}`} unit="项" label="累计完成" />
      <Metric icon={<Award />} value={`${totalPoints(tasks)}`} unit="分" label="累计积分" />
      <Metric icon={<Flame />} value={`${longestStreak(dailyRecords)}`} unit="天" label="最长连续" />
    </section>
    {makeup && <div className="makeup-note">你正在查看过去日期的学习记录。完成打卡会明确标记为补签记录。</div>}
    <section className="section-block today-reveal">
      <div className="section-heading"><div><span className="eyebrow">当日任务</span><h2>专注于下一件重要的事</h2></div><span>{summary.taskCount} 项有效任务</span></div>
      {dateTasks.length
        ? <TaskList tasks={dateTasks} reorder />
        : <EmptyState title="这一天还没有任务" description="添加一项清晰、可完成的学习目标，统计会实时更新。" action={<Button onClick={openNewTask}><Plus />添加任务</Button>} />}
    </section>
    <div className="today-reveal"><DailyReviewEditor date={selected} record={record} onCheckin={() => record?.checkedIn ? setConfirmCancel(true) : toggle()} /></div>
    <Dialog open={confirmCancel} title="取消这一天的正式打卡？" description="取消后，这一天不再计入连续打卡；任务和复盘内容会保留。" confirmLabel="取消打卡" danger onClose={() => setConfirmCancel(false)} onConfirm={async () => { await toggle(); setConfirmCancel(false) }} />
    {planning && <AIPlannerDrawer date={selected} onClose={() => setPlanning(false)} />}
  </div>
}

function Metric({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit: string; label: string }) {
  return <div className="overview-metric"><span>{icon}{label}</span><strong>{value}<small>{unit}</small></strong></div>
}
