import type { Subject, Task, Theme } from '../../types'
const quote=(value:unknown)=>`"${String(value??'').replace(/"/g,'""')}"`
export function tasksToCsv(tasks:Task[],themes:Theme[],subjects:Subject[]){
  const theme=new Map(themes.map(x=>[x.id,x.name])),subject=new Map(subjects.map(x=>[x.id,x.name]))
  const headers=['任务 ID','日期','主题','科目','任务','子任务','优先级','状态','计划分钟','实际分钟','专注度','精力值','输出','备注','创建时间','更新时间','是否取消']
  const rows=tasks.map(t=>[t.id,t.date,theme.get(t.themeId),subject.get(t.subjectId),t.name,t.detail,t.priority,t.status,t.plannedDuration,t.actualDuration,t.focusScore,t.energyScore,t.output,t.note,t.createdAt,t.updatedAt,t.status==='cancelled'?'是':'否'])
  return '\ufeff'+[headers,...rows].map(row=>row.map(quote).join(',')).join('\r\n')
}
