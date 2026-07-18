import Dexie, { type Table } from 'dexie'
import type { AIConfig, AIPreferences, AIUsageLog, AppMeta, AppSettings, DailyRecord, Subject, Task, TaskTemplate, Theme } from '../types'
import { migrateMetaToV3, migrateSettingsV2ToV3 } from './migrations'

export class SummerFlowDatabase extends Dexie {
  settings!: Table<AppSettings, 'app'>
  themes!: Table<Theme, string>
  subjects!: Table<Subject, string>
  templates!: Table<TaskTemplate, string>
  tasks!: Table<Task, string>
  dailyRecords!: Table<DailyRecord, string>
  appMeta!: Table<AppMeta, 'meta'>
  aiConfigs!: Table<AIConfig, string>
  aiPreferences!: Table<AIPreferences, 'preferences'>
  aiUsageLogs!: Table<AIUsageLog, string>

  constructor(name = 'summerflow') {
    super(name)
    this.version(2).stores({
      settings:'id', themes:'id,order,name', subjects:'id,order,name', templates:'id,order',
      tasks:'id,date,status,themeId,subjectId,order,updatedAt', dailyRecords:'date,checkedIn', appMeta:'key'
    })
    this.version(3).stores({
      settings:'id', themes:'id,order,name', subjects:'id,order,name', templates:'id,order',
      tasks:'id,date,status,themeId,subjectId,order,updatedAt', dailyRecords:'date,checkedIn', appMeta:'key'
    }).upgrade(async transaction => {
      const settings = await transaction.table<AppSettings, 'app'>('settings').get('app')
      if (settings) await transaction.table<AppSettings, 'app'>('settings').put(migrateSettingsV2ToV3(settings))
      const meta = await transaction.table<AppMeta, 'meta'>('appMeta').get('meta')
      if (meta) await transaction.table<AppMeta, 'meta'>('appMeta').put(migrateMetaToV3(meta))
    })
    this.version(4).stores({
      settings:'id', themes:'id,order,name', subjects:'id,order,name', templates:'id,order',
      tasks:'id,date,status,themeId,subjectId,order,updatedAt', dailyRecords:'date,checkedIn', appMeta:'key',
      aiConfigs:'id,enabled,isDefault,updatedAt', aiPreferences:'id', aiUsageLogs:'id,feature,configId,createdAt,success'
    }).upgrade(async transaction => {
      const meta = await transaction.table<AppMeta, 'meta'>('appMeta').get('meta')
      if (meta) await transaction.table<AppMeta, 'meta'>('appMeta').put({ ...meta, schemaVersion: 4 })
    })
  }
}

export const db = new SummerFlowDatabase()
