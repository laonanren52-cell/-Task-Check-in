import { describe, expect, it } from 'vitest'
import type { DailyRecord, Task } from '../types'
import { completionRate, currentStreak, dailyPoints, dailyStats, longestStreak, totalPoints } from '../features/statistics'
const task=(id:string,status:Task['status'],date='2026-07-16',actualDuration=60,focusScore=4):Task=>({id,date,themeId:'t',subjectId:'s',name:id,detail:'',priority:'P2',status,plannedDuration:60,actualDuration,focusScore,energyScore:3,output:'',note:'',order:0,createdAt:'',updatedAt:''})
const record=(date:string,checkedIn=true):DailyRecord=>({date,checkedIn,isMakeup:false,review:'',nextStep:'',achievement:'',problem:'',satisfaction:'',createdAt:'',updatedAt:''})
describe('统计规则',()=>{
  it('计算当日完成率',()=>expect(completionRate([task('1','done'),task('2','todo')])).toBe(.5))
  it('取消任务不计入统计',()=>expect(dailyStats([task('1','done'),task('2','cancelled')])).toMatchObject({taskCount:1,done:1,rate:1,actual:60}))
  it('计算当日积分',()=>expect(dailyPoints([task('1','done')])).toBe(16))
  it('总积分按每天积分求和并保留每日专注分',()=>expect(totalPoints([task('1','done','2026-07-15'),task('2','done','2026-07-16')])).toBe(32))
  it('今天未打卡但昨天已打卡时保留当前连续',()=>expect(currentStreak([record('2026-07-14'),record('2026-07-15')],new Date('2026-07-16T12:00:00'))).toBe(2))
  it('计算最长连续打卡',()=>expect(longestStreak([record('2026-07-01'),record('2026-07-02'),record('2026-07-04')])).toBe(2))
  it('删除任务后统计立即更新',()=>{const tasks=[task('1','done'),task('2','todo')];expect(completionRate(tasks)).toBe(.5);expect(completionRate(tasks.filter(x=>x.id!=='2'))).toBe(1)})
})
