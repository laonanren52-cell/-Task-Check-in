import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { SummerFlowDatabase } from '../db/database'
import { defaultMeta, defaultSettings } from '../db/defaults'
import { migrateReleaseData, migrateSettingsV2ToV3, type LegacySettings } from '../db/migrations'
import { createBackupFilename } from '../desktop/filesystem/backup'
import type { Task } from '../types'

const databases: string[] = []
afterEach(async () => { for (const name of databases) await Dexie.delete(name); databases.length = 0 })

function legacySettings(): LegacySettings {
  const { autoCheckUpdates: _auto, updateChannel: _channel, ...settings } = defaultSettings()
  return settings
}

const task: Task = { id: 'preserved', date: '2026-07-16', themeId: 'theme', subjectId: 'subject', name: '升级前任务', detail: '', priority: 'P1', status: 'done', plannedDuration: 60, actualDuration: 45, output: '', note: '', order: 0, createdAt: '2026-07-16', updatedAt: '2026-07-16' }

describe('桌面版本与 IndexedDB 数据升级', () => {
  it('0.1.0 → 0.1.1 增加自动更新设置但保留目标', () => {
    const result = migrateReleaseData({ settings: legacySettings(), meta: { ...defaultMeta(), schemaVersion: 2 } }, '0.1.0', '0.1.1')
    expect(result.settings.autoCheckUpdates).toBe(true)
    expect(result.settings.updateChannel).toBe('stable')
    expect(result.settings.goalDays).toBe(44)
  })
  it('0.1.1 → 0.2.0 升级迁移版本且不改变设置', () => {
    const settings = migrateSettingsV2ToV3(legacySettings())
    const result = migrateReleaseData({ settings, meta: { ...defaultMeta(), schemaVersion: 2 } }, '0.1.1', '0.2.0')
    expect(result.meta.schemaVersion).toBe(4)
    expect(result.settings).toEqual(settings)
  })
  it('拒绝降级或非语义版本范围', () => {
    const snapshot = { settings: legacySettings(), meta: defaultMeta() }
    expect(() => migrateReleaseData(snapshot, '0.2.0', '0.1.0')).toThrow()
    expect(() => migrateReleaseData(snapshot, 'version-one', '0.2.0')).toThrow()
  })
  it('IndexedDB v2 → v3 后任务保留且设置自动补全', async () => {
    const name = `schema-upgrade-${Date.now()}`
    databases.push(name)
    const old = new Dexie(name)
    old.version(2).stores({ settings: 'id', themes: 'id,order,name', subjects: 'id,order,name', templates: 'id,order', tasks: 'id,date,status,themeId,subjectId,order,updatedAt', dailyRecords: 'date,checkedIn', appMeta: 'key' })
    await old.open()
    await old.table('settings').put(legacySettings())
    await old.table('tasks').put(task)
    await old.table('appMeta').put({ ...defaultMeta(), schemaVersion: 2 })
    old.close()
    const current = new SummerFlowDatabase(name)
    await current.open()
    expect((await current.tasks.get(task.id))?.name).toBe('升级前任务')
    expect((await current.settings.get('app'))?.autoCheckUpdates).toBe(true)
    expect((await current.appMeta.get('meta'))?.schemaVersion).toBe(4)
    current.close()
  })
  it('桌面备份文件名包含可排序时间戳', () => {
    expect(createBackupFilename(new Date(2026, 6, 16, 9, 8, 7))).toBe('SummerFlow-Backup-20260716-090807.json')
  })
})
