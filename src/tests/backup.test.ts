import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { SummerFlowDatabase } from '../db/database'
import { defaultSettings } from '../db/defaults'
import { backupSchema, parseBackup } from '../features/backup/schema'
import { tasksToCsv } from '../features/backup/csv'
import { validateGoalRange } from '../features/settings/validation'
import type { Task } from '../types'
const dbs:SummerFlowDatabase[]=[]
afterEach(async()=>{for(const db of dbs){db.close();await db.delete()}dbs.length=0})
const task:Task={id:'1',date:'2026-07-16',themeId:'t',subjectId:'s',name:'中文任务',detail:'',priority:'P2',status:'done',plannedDuration:60,actualDuration:60,output:'成果',note:'',order:0,createdAt:'',updatedAt:''}
describe('备份、校验与持久化',()=>{
  it('校验合法 JSON 备份',()=>{const data={schemaVersion:2,exportedAt:'2026-07-16',settings:defaultSettings(),themes:[],subjects:[],templates:[],tasks:[],dailyRecords:[]};expect(backupSchema.parse(data).schemaVersion).toBe(2)})
  it('非法 JSON 不覆盖现有 IndexedDB 数据',async()=>{const database=new SummerFlowDatabase(`invalid-${Date.now()}`);dbs.push(database);await database.tasks.put(task);expect(()=>parseBackup('{bad json')).toThrow();expect(await database.tasks.count()).toBe(1)})
  it('验证日期范围与目标天数',()=>{expect(validateGoalRange('2026-08-01','2026-07-01',1)).toContain('不能晚于');expect(validateGoalRange('2026-07-01','2026-07-10',11)).toContain('不能超过');expect(validateGoalRange('2026-07-01','2026-07-10',10)).toBe('')})
  it('CSV 使用 UTF-8 BOM 并保留中文',()=>{const csv=tasksToCsv([task],[{id:'t',name:'主题',color:'#fff',icon:'Book',order:0,createdAt:'',updatedAt:''}],[{id:'s',name:'科目',color:'#fff',order:0,createdAt:'',updatedAt:''}]);expect(csv.charCodeAt(0)).toBe(0xfeff);expect(csv).toContain('中文任务')})
  it('IndexedDB 关闭后重新打开仍可读取任务',async()=>{const name=`persist-${Date.now()}`,first=new SummerFlowDatabase(name);await first.tasks.put(task);first.close();const second=new SummerFlowDatabase(name);dbs.push(second);expect((await second.tasks.get('1'))?.name).toBe('中文任务')})
})
