import { differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'
import type { DailyRecord, Task } from '../../types'

export const activeTasks=(tasks:Task[])=>tasks.filter(t=>t.status!=='cancelled')
export const completionRate=(tasks:Task[])=>{const valid=activeTasks(tasks);return valid.length?valid.filter(t=>t.status==='done').length/valid.length:0}
export const averageFocus=(tasks:Task[])=>{const values=activeTasks(tasks).map(t=>t.focusScore).filter((x):x is number=>typeof x==='number'&&x>0);return values.length?values.reduce((a,b)=>a+b,0)/values.length:0}
export const dailyPoints=(tasks:Task[])=>Math.round(activeTasks(tasks).reduce((sum,t)=>sum+t.actualDuration,0)/60*10+activeTasks(tasks).filter(t=>t.status==='done').length*2+averageFocus(tasks))
export const totalPoints=(tasks:Task[])=>[...new Set(tasks.map(t=>t.date))].reduce((sum,date)=>sum+dailyPoints(tasks.filter(t=>t.date===date)),0)
export const dailyStats=(tasks:Task[])=>{const valid=activeTasks(tasks),done=valid.filter(t=>t.status==='done').length;return{taskCount:valid.length,done,rate:completionRate(valid),planned:valid.reduce((s,t)=>s+t.plannedDuration,0),actual:valid.reduce((s,t)=>s+t.actualDuration,0),focus:averageFocus(valid),points:dailyPoints(valid)}}

const checkedDates=(records:DailyRecord[])=>[...new Set(records.filter(r=>r.checkedIn).map(r=>r.date))].sort()
export function currentStreak(records:DailyRecord[],reference=new Date()){
  const dates=checkedDates(records),today=format(reference,'yyyy-MM-dd'),eligible=dates.filter(d=>d<=today);if(!eligible.length)return 0
  const last=eligible.at(-1)!;if(differenceInCalendarDays(parseISO(today),parseISO(last))>1)return 0
  let count=1;for(let i=eligible.length-2;i>=0;i--){if(differenceInCalendarDays(parseISO(eligible[i+1]),parseISO(eligible[i]))===1)count++;else break}return count
}
export function longestStreak(records:DailyRecord[]){const dates=checkedDates(records);let best=0,current=0,previous='';for(const date of dates){current=previous&&differenceInCalendarDays(parseISO(date),parseISO(previous))===1?current+1:1;best=Math.max(best,current);previous=date}return best}
export const weeklyMinutes=(tasks:Task[])=>{const map=new Map<string,number>();activeTasks(tasks).forEach(t=>{const key=format(startOfWeek(parseISO(t.date),{weekStartsOn:1}),'yyyy-MM-dd');map.set(key,(map.get(key)??0)+t.actualDuration)});return [...map].sort(([a],[b])=>a.localeCompare(b)).map(([date,minutes])=>({date,minutes}))}
