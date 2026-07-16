import type { DailyRecord, Task } from '../../types'
import { activeTasks, completionRate, currentStreak } from './index'

export function buildAdvice(tasks:Task[],records:DailyRecord[]){
  const active=activeTasks(tasks),recent=active.filter(t=>Date.now()-new Date(`${t.date}T00:00:00`).getTime()<8*86400000),p1=active.filter(t=>t.priority==='P1')
  if(currentStreak(records)>=21)return '连续记录已经稳定。下一阶段优先减少低价值任务，把时间投入可展示的项目成果。'
  if(p1.length&&completionRate(p1)<.6)return 'P1 任务完成率偏低。建议减少并行目标，每天先完成一项必须任务。'
  if(recent.length>=3&&completionRate(recent)<.5)return '最近 7 天任务完成率不足一半。把任务拆成 60–90 分钟内可验证的步骤。'
  if(!active.length)return '先添加一项清晰、可完成的学习任务，并记录实际时长与输出。'
  return '当前节奏可持续。继续记录真实时长，并在每天结束前完成正式打卡与复盘。'
}
