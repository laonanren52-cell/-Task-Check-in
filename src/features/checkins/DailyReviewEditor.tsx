import { useEffect, useState } from 'react'
import { CheckCircle2, Save, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAppStore } from '../../stores/appStore'
import type { DailyRecord } from '../../types'
import { AIDailyReviewTools } from '../ai/components/AIDailyReviewTools'

const moods = [
  { score: 1, label: '很差' }, { score: 2, label: '偏低' }, { score: 3, label: '平稳' }, { score: 4, label: '不错' }, { score: 5, label: '很好' },
]

export function DailyReviewEditor({ date, record, onCheckin }: { date: string; record?: DailyRecord; onCheckin: () => void }) {
  const save = useAppStore(state => state.saveDailyRecord)
  const toast = useToast()
  const [value, setValue] = useState(() => toValue(date, record))
  useEffect(() => setValue(toValue(date, record)), [date, record])
  const submit = async () => { await save({ ...value, updatedAt: new Date().toISOString() }); toast('每日复盘已保存') }

  return <section className="review-editor" aria-labelledby="review-title">
    <header className="review-editor__intro">
      <span className="eyebrow">每日复盘</span>
      <h2 id="review-title">把今天真正留下来。</h2>
      <p>先记录今天的状态，再留下一条对明天真正有用的信息。保存的是复盘草稿；完成正式打卡后，这一天才会计入连续记录。</p>
      <div className="review-status">
        <div className="review-step"><Sparkles />今天的状态 <small>这一天整体感觉如何？</small></div>
        <div className="mood-row" role="radiogroup" aria-label="选择今日状态">
          {moods.map(mood => <button type="button" className={value.mood === mood.score ? 'active' : ''} onClick={() => setValue({ ...value, mood: mood.score })} key={mood.score} role="radio" aria-checked={value.mood === mood.score}><b>{mood.score}</b><span>{mood.label}</span></button>)}
        </div>
      </div>
    </header>
    <div className="review-editor__fields">
      <div className="review-fields-heading"><div><span className="eyebrow">今日复盘</span><p>无需写长篇日记；每一格写下一条可回看的证据即可。</p></div></div>
      <label className="wide review-field--lead"><span>今天整体怎么样？</span><small>记录节奏、方法或最重要的感受。</small><textarea placeholder="例如：上午更适合处理需要推理的内容。" value={value.review} onChange={event => setValue({ ...value, review: event.target.value })} /></label>
      <label><span>今日收获</span><small>写下学到的知识、完成的成果或新的发现。</small><textarea placeholder="例如：理解了 DCDC 降压的基本拓扑。" value={value.achievement} onChange={event => setValue({ ...value, achievement: event.target.value })} /></label>
      <label><span>遇到的问题</span><small>记录卡点，明天可以从这里继续。</small><textarea placeholder="例如：还不清楚反馈回路的计算方式。" value={value.problem} onChange={event => setValue({ ...value, problem: event.target.value })} /></label>
      <label><span>今天最满意的事</span><small>给值得肯定的投入留下一条证据。</small><textarea placeholder="例如：按计划完成了英语阅读。" value={value.satisfaction} onChange={event => setValue({ ...value, satisfaction: event.target.value })} /></label>
      <label><span>明日第一步</span><small>写一个打开系统后就能开始的小动作。</small><textarea placeholder="例如：先画出 DCDC 反馈电阻的计算草图。" value={value.nextStep} onChange={event => setValue({ ...value, nextStep: event.target.value })} /></label>
      <div className="review-editor__actions wide"><div><span>先保存，再打卡</span><small>打卡后仍可以修改任务和复盘内容。</small></div><div><Button variant="secondary" onClick={submit}><Save />保存草稿</Button><Button onClick={onCheckin}><CheckCircle2 />{record?.checkedIn ? '取消今日打卡' : '完成今日打卡'}</Button></div></div>
    </div>
    <AIDailyReviewTools date={date} value={value} onApply={draft=>setValue(current=>({...current,...draft}))}/>
  </section>
}

function toValue(date: string, record?: DailyRecord): DailyRecord {
  const now = new Date().toISOString()
  return record ?? { date, checkedIn: false, isMakeup: false, review: '', nextStep: '', achievement: '', problem: '', satisfaction: '', createdAt: now, updatedAt: now }
}
