import { create } from 'zustand'
import { db } from '../db/database'
import { defaultMeta, defaultSettings, defaultSubjects, defaultTemplates, defaultThemes } from '../db/defaults'
import { seedDatabase } from '../db/seed'
import { LEGACY_STORAGE_KEY, migrateLegacyStorage, previewLegacy, type MigrationPreview } from '../features/migration/legacy'
import type { AppSettings, BackupData, DailyRecord, Subject, Task, TaskTemplate, Theme } from '../types'

interface AppState {
  ready:boolean; error?:string; settings:AppSettings; themes:Theme[]; subjects:Subject[]; templates:TaskTemplate[]; tasks:Task[]; dailyRecords:DailyRecord[]; migration?:MigrationPreview; pendingLegacy?:string; legacyPreview?:MigrationPreview
  initialize:()=>Promise<void>; migrateLegacy:()=>Promise<void>; dismissLegacy:()=>void; reload:()=>Promise<void>; saveTask:(task:Task)=>Promise<void>; deleteTasks:(ids:string[])=>Promise<void>; reorderTasks:(ordered:Task[])=>Promise<void>
  saveDailyRecord:(record:DailyRecord)=>Promise<void>; saveSettings:(settings:AppSettings)=>Promise<void>; saveTheme:(item:Theme)=>Promise<void>; deleteTheme:(id:string,replacementId?:string)=>Promise<void>
  saveSubject:(item:Subject)=>Promise<void>; deleteSubject:(id:string,replacementId?:string)=>Promise<void>; saveTemplate:(item:TaskTemplate)=>Promise<void>; deleteTemplate:(id:string)=>Promise<void>
  exportBackup:()=>BackupData; importBackup:(data:BackupData)=>Promise<void>; clearAll:()=>Promise<void>; restoreDefaults:()=>Promise<void>
}

const initial={settings:defaultSettings(),themes:[],subjects:[],templates:[],tasks:[],dailyRecords:[]}
export const useAppStore=create<AppState>((set,get)=>({ready:false,...initial,
  reload:async()=>{const[settings,themes,subjects,templates,tasks,dailyRecords]=await Promise.all([db.settings.get('app'),db.themes.orderBy('order').toArray(),db.subjects.orderBy('order').toArray(),db.templates.orderBy('order').toArray(),db.tasks.toArray(),db.dailyRecords.toArray()]);set({settings:settings??defaultSettings(),themes,subjects,templates,tasks,dailyRecords,ready:true,error:undefined})},
  initialize:async()=>{try{await seedDatabase();const meta=await db.appMeta.get('meta');const raw=localStorage.getItem(LEGACY_STORAGE_KEY);if(raw&&!meta?.migratedFromLegacy)set({pendingLegacy:raw,legacyPreview:previewLegacy(raw)});await get().reload()}catch(error){db.close();set({ready:true,error:error instanceof Error?error.message:'无法读取本地数据'})}},
  migrateLegacy:async()=>{const raw=get().pendingLegacy;if(!raw)return;const result=await migrateLegacyStorage({getItem:()=>raw});await get().reload();if(result.status==='migrated')set({migration:result.preview,pendingLegacy:undefined,legacyPreview:undefined})},dismissLegacy:()=>set({pendingLegacy:undefined,legacyPreview:undefined}),
  saveTask:async task=>{await db.tasks.put(task);await get().reload()},deleteTasks:async ids=>{await db.tasks.bulkDelete(ids);await get().reload()},
  reorderTasks:async ordered=>{await db.tasks.bulkPut(ordered.map((task,order)=>({...task,order,updatedAt:new Date().toISOString()})));await get().reload()},
  saveDailyRecord:async record=>{await db.dailyRecords.put(record);await get().reload()},saveSettings:async settings=>{await db.settings.put(settings);await get().reload()},
  saveTheme:async item=>{await db.themes.put(item);await get().reload()},deleteTheme:async(id,replacementId)=>{const count=await db.tasks.where('themeId').equals(id).count();if(count&&!replacementId)throw new Error(`该主题仍被 ${count} 项任务使用`);await db.transaction('rw',[db.tasks,db.themes],async()=>{if(replacementId)await db.tasks.where('themeId').equals(id).modify({themeId:replacementId,updatedAt:new Date().toISOString()});await db.themes.delete(id)});await get().reload()},
  saveSubject:async item=>{await db.subjects.put(item);await get().reload()},deleteSubject:async(id,replacementId)=>{const count=await db.tasks.where('subjectId').equals(id).count();if(count&&!replacementId)throw new Error(`该科目仍被 ${count} 项任务使用`);await db.transaction('rw',[db.tasks,db.subjects],async()=>{if(replacementId)await db.tasks.where('subjectId').equals(id).modify({subjectId:replacementId,updatedAt:new Date().toISOString()});await db.subjects.delete(id)});await get().reload()},
  saveTemplate:async item=>{await db.templates.put(item);await get().reload()},deleteTemplate:async id=>{await db.templates.delete(id);await get().reload()},
  exportBackup:()=>({schemaVersion:2,exportedAt:new Date().toISOString(),settings:get().settings,themes:get().themes,subjects:get().subjects,templates:get().templates,tasks:get().tasks,dailyRecords:get().dailyRecords}),
  importBackup:async data=>{await db.transaction('rw',[db.settings,db.themes,db.subjects,db.templates,db.tasks,db.dailyRecords],async()=>{await Promise.all([db.settings.clear(),db.themes.clear(),db.subjects.clear(),db.templates.clear(),db.tasks.clear(),db.dailyRecords.clear()]);await db.settings.put(data.settings);await db.themes.bulkPut(data.themes);await db.subjects.bulkPut(data.subjects);await db.templates.bulkPut(data.templates);await db.tasks.bulkPut(data.tasks);await db.dailyRecords.bulkPut(data.dailyRecords)});await get().reload()},
  clearAll:async()=>{await db.transaction('rw',[db.settings,db.themes,db.subjects,db.templates,db.tasks,db.dailyRecords,db.appMeta],async()=>{await Promise.all([db.settings.clear(),db.themes.clear(),db.subjects.clear(),db.templates.clear(),db.tasks.clear(),db.dailyRecords.clear(),db.appMeta.clear()]);await db.settings.put(defaultSettings());await db.appMeta.put({...defaultMeta(),migratedFromLegacy:true});await db.themes.bulkPut(defaultThemes());await db.subjects.bulkPut(defaultSubjects());await db.templates.bulkPut(defaultTemplates())});await get().reload()},
  restoreDefaults:async()=>{await db.transaction('rw',[db.themes,db.subjects,db.templates],async()=>{await db.themes.bulkPut(defaultThemes());await db.subjects.bulkPut(defaultSubjects());await db.templates.bulkPut(defaultTemplates())});await get().reload()}
}))
