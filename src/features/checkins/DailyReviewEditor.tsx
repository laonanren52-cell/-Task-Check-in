import { useEffect, useState } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAppStore } from '../../stores/appStore'
import type { DailyRecord } from '../../types'

const moods = [
  { score: 1, label: '很差', hint: '今天需要先休息和减负' },
  { score: 2, label: '偏低', hint: '节奏不顺，但仍可复盘' },
  { score: 3, label: '平稳', hint: '按计划继续即可' },
  { score: 4, label: '不错', hint: '今天推进得很扎实' },
  { score: 5, label: '很好', hint: '值得记录这份状态' },
]

export function DailyReviewEditor({date,record}:{date:string;record?:DailyRecord}) {
  const save=useAppStore(s=>s.saveDailyRecord)
  const toast=useToast()
  const[value,setValue]=useState(()=>toValue(date,record))
  useEffect(()=>setValue(toValue(date,record)),[date,record])
  const submit=async()=>{await save({...value,updatedAt:new Date().toISOString()});toast('每日复盘已保存')}

  return <section className="review-editor" aria-labelledby="review-title">
    <div className="review-editor__intro">
      <span className="eyebrow">每日复盘</span>
      <h2 id="review-title">把今天真正留下来</h2>
      <p>先标记今天的状态，再写下收获、卡点与明日第一步。保存后仍可修改；正式打卡才会计入连续记录。</p>
      <div className="review-step"><Sparkles />今天的状态</div>
      <div className="mood-row" aria-label="选择今日状态">
        {moods.map(mood=><button className={value.mood===mood.score?'active':''} onClick={()=>setValue({...value,mood:mood.score})} key={mood.score} aria-pressed={value.mood===mood.score}><b>{mood.score}</b><span>{mood.label}</span><small>{mood.hint}</small></button>)}
      </div>
    </div>
    <div className="review-editor__fields">
      <div className="review-fields-heading"><span className="eyebrow">今日复盘</span><p>不必写得很长，留下对明天有用的一句话就够了。</p></div>
      <label><span>今天整体怎么样</span><small>记录节奏、方法或最重要的感受。</small><textarea placeholder="例如：上午更适合处理需要推理的内容。" value={value.review} onChange={e=>setValue({...value,review:e.target.value})}/></label>
      <label><span>今日收获</span><small>写下学到的知识、完成的成果或新的发现。</small><textarea placeholder="例如：理解了 DCDC 降压的基本拓扑。" value={value.achievement} onChange={e=>setValue({...value,achievement:e.target.value})}/></label>
      <label><span>遇到的问题</span><small>记录卡点，明天可以从这里继续。</small><textarea placeholder="例如：还不清楚反馈回路的计算方式。" value={value.problem} onChange={e=>setValue({...value,problem:e.target.value})}/></label>
      <label><span>今天最满意的事</span><small>给值得肯定的投入留下证据。</small><textarea placeholder="例如：按计划完成了英语阅读。" value={value.satisfaction} onChange={e=>setValue({...value,satisfaction:e.target.value})}/></label>
      <label className="wide"><span>明日第一步</span><small>写一个足够小、打开系统后就能开始的动作。</small><textarea placeholder="例如：先画出 DCDC 反馈电阻的计算草图。" value={value.nextStep} onChange={e=>setValue({...value,nextStep:e.target.value})}/></label>
      <Button onClick={submit}><Save/>保存复盘</Button>
    </div>
  </section>
}
function toValue(date:string,record?:DailyRecord):DailyRecord{const now=new Date().toISOString();return record??{date,checkedIn:false,isMakeup:false,review:'',nextStep:'',achievement:'',problem:'',satisfaction:'',createdAt:now,updatedAt:now}}
