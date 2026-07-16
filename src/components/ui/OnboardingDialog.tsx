import { BookOpen, CheckCircle2, Flag, ListPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { db } from '../../db/database'
import { useAppStore } from '../../stores/appStore'
import { Button } from './Button'

const steps = [
  [Flag, '创建学习主题', '先确定这个暑期最重要的项目或方向。'],
  [BookOpen, '创建学习科目', '让每一项投入都能被准确归类。'],
  [ListPlus, '添加第一项任务', '拆成今天能够验证完成的小步骤。'],
  [CheckCircle2, '完成第一次打卡', '复盘之后正式打卡，开始累计连续天数。'],
] as const

export function OnboardingDialog() {
  const pendingLegacy = useAppStore(state => state.pendingLegacy)
  const [open, setOpen] = useState(false)
  useEffect(() => { if (!pendingLegacy) void db.appMeta.get('meta').then(meta => setOpen(meta?.onboardingCompleted === false)) }, [pendingLegacy])
  const finish = async () => {
    const meta = await db.appMeta.get('meta')
    if (meta) await db.appMeta.put({ ...meta, onboardingCompleted: true })
    setOpen(false)
  }
  if (!open || pendingLegacy) return null
  return <div className="overlay" role="presentation">
    <section className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <button className="icon-button onboarding__close" onClick={finish} aria-label="跳过新手引导"><X /></button>
      <span className="eyebrow">欢迎来到夏序</span>
      <h2 id="onboarding-title">四步建立你的学习节奏</h2>
      <p>分类已经为你准备好，也可以稍后完全自定义。系统不会添加任何虚假的学习记录。</p>
      <div className="onboarding__steps">{steps.map(([Icon, title, description], index) => <div key={title}><span><Icon /></span><b>{index + 1}. {title}</b><small>{description}</small></div>)}</div>
      <div className="onboarding__actions"><Button variant="ghost" onClick={finish}>跳过</Button><Button onClick={finish}>开始使用</Button></div>
    </section>
  </div>
}
