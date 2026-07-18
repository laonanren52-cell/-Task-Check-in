import { db } from './database'
import { defaultAIPreferences, defaultMeta, defaultSettings, defaultSubjects, defaultTemplates, defaultThemes } from './defaults'

export async function seedDatabase() {
  await db.transaction('rw',[db.settings,db.themes,db.subjects,db.templates,db.appMeta,db.aiPreferences],async()=>{
    if (!(await db.settings.get('app'))) await db.settings.put(defaultSettings())
    if (!(await db.aiPreferences.get('preferences'))) await db.aiPreferences.put(defaultAIPreferences())
    if (!(await db.themes.count())) await db.themes.bulkPut(defaultThemes())
    if (!(await db.subjects.count())) await db.subjects.bulkPut(defaultSubjects())
    if (!(await db.templates.count())) await db.templates.bulkPut(defaultTemplates())
    if (!(await db.appMeta.get('meta'))) await db.appMeta.put(defaultMeta())
  })
}
