import type { SummerFlowDatabase } from '../../db/database'
import { db } from '../../db/database'
import { defaultSettings, defaultSubjects, defaultTemplates, defaultThemes } from '../../db/defaults'
import { createId, stableId } from '../../lib/id'
import type { BackupData, DailyRecord, Priority, Subject, Task, TaskStatus, TaskTemplate, Theme } from '../../types'
import { legacyDataSchema, type LegacyData } from './schema'

export const LEGACY_STORAGE_KEY = 'summer-growth-v3'

export interface MigrationPreview { tasks:number; checkins:number; themes:number; subjects:number; templates:number }

const statusMap: Record<string,TaskStatus> = {'待开始':'todo','进行中':'doing','已完成':'done','未完成':'missed','取消':'cancelled','已取消':'cancelled'}
const priorityOf = (value:string):Priority => value.startsWith('P1')?'P1':value.startsWith('P3')?'P3':'P2'
const statusOf = (value:string):TaskStatus => statusMap[value] ?? (value.includes('完成')&&!value.includes('未')?'done':value.includes('取消')?'cancelled':value.includes('进行')?'doing':'todo')

function unique(values:string[]) { return [...new Set(values.map(x=>x.trim()).filter(Boolean))] }
function convertCategories(parsed:LegacyData) {
  const now=new Date().toISOString()
  const themes=unique([...(parsed.settings.themes??[]),...parsed.tasks.map(t=>t.theme),...defaultThemes().map(x=>x.name)]).map((name,order):Theme=>({id:stableId('theme',name),name,color:defaultThemes()[order%defaultThemes().length]?.color??'#4f7da0',icon:'BookOpen',order,createdAt:now,updatedAt:now}))
  const subjects=unique([...(parsed.settings.subjects??[]),...parsed.tasks.map(t=>t.subject),...defaultSubjects().map(x=>x.name)]).map((name,order):Subject=>({id:stableId('subject',name),name,color:defaultSubjects()[order%defaultSubjects().length]?.color??'#4c8c84',order,createdAt:now,updatedAt:now}))
  const templateNames=unique([...(parsed.settings.templates??[]),...defaultTemplates().map(x=>x.name)])
  const templates=templateNames.map((name,order):TaskTemplate=>({id:stableId('template',name),name,detail:'',priority:'P2',plannedDuration:60,order,createdAt:now,updatedAt:now}))
  return {themes,subjects,templates}
}

export function parseLegacyData(raw:string) { return legacyDataSchema.parse(JSON.parse(raw)) }
export function previewLegacy(raw:string):MigrationPreview {
  const parsed=parseLegacyData(raw), categories=convertCategories(parsed)
  return {tasks:parsed.tasks.length,checkins:Object.values(parsed.checkins).filter(Boolean).length,themes:categories.themes.length,subjects:categories.subjects.length,templates:categories.templates.length}
}

export function convertLegacyData(parsed:LegacyData) {
  const now=new Date().toISOString(), {themes,subjects,templates}=convertCategories(parsed)
  const settings={...defaultSettings(),startDate:parsed.settings.startDate??defaultSettings().startDate,endDate:parsed.settings.endDate??defaultSettings().endDate,goalDays:parsed.settings.goalDays??44,goalStudyHours:parsed.settings.goalHours??140,updatedAt:now}
  const tasks=parsed.tasks.map((old,order):Task=>({id:String(old.id??createId()),date:old.date,themeId:stableId('theme',old.theme),subjectId:stableId('subject',old.subject),name:old.name,detail:old.detail,priority:priorityOf(old.priority),status:statusOf(old.status),plannedDuration:Math.round(old.plan*60),actualDuration:Math.round(old.actual*60),focusScore:old.focus||undefined,energyScore:old.energy||undefined,output:old.output,note:old.note,order,createdAt:now,updatedAt:now}))
  const dates=unique([...Object.keys(parsed.checkins),...Object.keys(parsed.dailyNotes)])
  const dailyRecords=dates.map((date):DailyRecord=>({date,checkedIn:Boolean(parsed.checkins[date]),checkinTime:parsed.checkins[date]?now:undefined,isMakeup:false,review:parsed.dailyNotes[date]?.review??'',nextStep:parsed.dailyNotes[date]?.nextStep??'',achievement:'',problem:'',satisfaction:'',createdAt:now,updatedAt:now}))
  return {settings,themes,subjects,templates,tasks,dailyRecords}
}

export function convertLegacyBackup(raw:string): BackupData {
  const converted=convertLegacyData(parseLegacyData(raw))
  return {schemaVersion:2,exportedAt:new Date().toISOString(),...converted}
}

export async function migrateLegacyStorage(storage:Pick<Storage,'getItem'>=localStorage,database:SummerFlowDatabase=db) {
  const meta=await database.appMeta.get('meta')
  if(meta?.migratedFromLegacy) return {status:'already-migrated' as const}
  const raw=storage.getItem(LEGACY_STORAGE_KEY)
  if(!raw)return {status:'not-found' as const}
  const converted=convertLegacyData(parseLegacyData(raw))
  await database.transaction('rw',[database.settings,database.themes,database.subjects,database.templates,database.tasks,database.dailyRecords,database.appMeta],async()=>{
    await database.settings.put(converted.settings)
    await database.themes.bulkPut(converted.themes);await database.subjects.bulkPut(converted.subjects);await database.templates.bulkPut(converted.templates)
    await database.tasks.bulkPut(converted.tasks);await database.dailyRecords.bulkPut(converted.dailyRecords)
    await database.appMeta.put({key:'meta',schemaVersion:2,migratedFromLegacy:true,migratedAt:new Date().toISOString(),onboardingCompleted:meta?.onboardingCompleted??false})
  })
  return {status:'migrated' as const,preview:previewLegacy(raw)}
}
