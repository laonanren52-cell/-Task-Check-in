import Dexie from 'dexie'

const stores = {
  settings: 'id', themes: 'id,order,name', subjects: 'id,order,name', templates: 'id,order',
  tasks: 'id,date,status,themeId,subjectId,order,updatedAt', dailyRecords: 'date,checkedIn', appMeta: 'key',
}

export async function exportReadonlyRecovery(databaseName = 'summerflow'): Promise<string> {
  const recovery = new Dexie(databaseName)
  recovery.version(2).stores(stores)
  try {
    await recovery.open()
    const [settings, themes, subjects, templates, tasks, dailyRecords, appMeta] = await Promise.all([
      recovery.table('settings').toArray(), recovery.table('themes').toArray(), recovery.table('subjects').toArray(),
      recovery.table('templates').toArray(), recovery.table('tasks').toArray(), recovery.table('dailyRecords').toArray(), recovery.table('appMeta').toArray(),
    ])
    return JSON.stringify({ recoveryMode: true, exportedAt: new Date().toISOString(), databaseName, settings, themes, subjects, templates, tasks, dailyRecords, appMeta }, null, 2)
  } finally { recovery.close() }
}
