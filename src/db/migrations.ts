import semver from 'semver'
import type { AppMeta, AppSettings } from '../types'

export const DB_SCHEMA_VERSION = 3
export const DATA_MIGRATION_VERSION = '0.2.0'

export type LegacySettings = Omit<AppSettings, 'autoCheckUpdates' | 'updateChannel'> & Partial<Pick<AppSettings, 'autoCheckUpdates' | 'updateChannel'>>

export function migrateSettingsV2ToV3(settings: LegacySettings): AppSettings {
  return {
    ...settings,
    autoCheckUpdates: settings.autoCheckUpdates ?? true,
    updateChannel: settings.updateChannel ?? 'stable',
  }
}

export function migrateMetaToV3(meta: AppMeta): AppMeta {
  return { ...meta, schemaVersion: DB_SCHEMA_VERSION }
}

export interface ReleaseDataSnapshot {
  settings: LegacySettings
  meta: AppMeta
}

export function migrateReleaseData(snapshot: ReleaseDataSnapshot, fromVersion: string, toVersion: string): ReleaseDataSnapshot {
  if (!semver.valid(fromVersion) || !semver.valid(toVersion) || semver.gt(fromVersion, toVersion)) {
    throw new Error('无效的数据升级版本范围')
  }
  let next: ReleaseDataSnapshot = structuredClone(snapshot)
  if (semver.lt(fromVersion, '0.1.1') && semver.gte(toVersion, '0.1.1')) {
    next = { ...next, settings: migrateSettingsV2ToV3(next.settings) }
  }
  if (semver.lt(fromVersion, '0.2.0') && semver.gte(toVersion, '0.2.0')) {
    next = { ...next, meta: migrateMetaToV3(next.meta) }
  }
  return next
}
