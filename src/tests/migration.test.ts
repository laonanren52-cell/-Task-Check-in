import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { SummerFlowDatabase } from '../db/database'
import { convertLegacyData, migrateLegacyStorage, parseLegacyData } from '../features/migration/legacy'

const raw=JSON.stringify({settings:{startDate:'2026-07-16',endDate:'2026-08-31',themes:['嵌入式基础'],subjects:['STM32'],templates:['串口实验']},tasks:[{id:'old-1',date:'2026-07-16',theme:'嵌入式基础',subject:'STM32',priority:'P1-必须完成',name:'串口实验',detail:'收发测试',status:'已完成',plan:1.5,actual:1,focus:4,energy:3,output:'通过',note:'完成'}],checkins:{'2026-07-16':true},dailyNotes:{'2026-07-16':{review:'稳定',nextStep:'ADC'}}})
const opened:SummerFlowDatabase[]=[]
afterEach(async()=>{for(const db of opened){db.close();await db.delete()}opened.length=0})
describe('旧版 localStorage 迁移',()=>{
  it('验证并读取 summer-growth-v3 结构',()=>expect(parseLegacyData(raw).tasks).toHaveLength(1))
  it('把主题字符串转换为 themeId',()=>expect(convertLegacyData(parseLegacyData(raw)).tasks[0].themeId).toMatch(/^theme-/))
  it('把科目字符串转换为 subjectId',()=>expect(convertLegacyData(parseLegacyData(raw)).tasks[0].subjectId).toMatch(/^subject-/))
  it('完整迁移任务字段与小时到分钟',()=>{const task=convertLegacyData(parseLegacyData(raw)).tasks[0];expect(task).toMatchObject({name:'串口实验',detail:'收发测试',priority:'P1',status:'done',plannedDuration:90,actualDuration:60,focusScore:4,energyScore:3,output:'通过',note:'完成'})})
  it('迁移后不会重复执行',async()=>{const database=new SummerFlowDatabase(`migration-${Date.now()}`);opened.push(database);await database.appMeta.put({key:'meta',schemaVersion:2,migratedFromLegacy:false,onboardingCompleted:false});const storage={getItem:()=>raw};expect((await migrateLegacyStorage(storage,database)).status).toBe('migrated');expect((await migrateLegacyStorage(storage,database)).status).toBe('already-migrated');expect(await database.tasks.count()).toBe(1)})
})
