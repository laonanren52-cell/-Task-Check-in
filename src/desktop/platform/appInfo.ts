import { DB_SCHEMA_VERSION, DATA_MIGRATION_VERSION } from '../../db/migrations'
import { isTauriRuntime, getRuntimeEnvironment, type RuntimeEnvironment } from '../environment/platform'

export interface AppRuntimeInfo {
  name: string
  version: string
  tauriVersion?: string
  environment: RuntimeEnvironment
  buildTime: string
  gitSha: string
  databaseVersion: number
  migrationVersion: string
  development: boolean
}

export async function getAppRuntimeInfo(): Promise<AppRuntimeInfo> {
  const base: AppRuntimeInfo = {
    name: '夏序 SummerFlow',
    version: __APP_VERSION__,
    environment: getRuntimeEnvironment(),
    buildTime: __BUILD_TIME__,
    gitSha: __GIT_SHA__,
    databaseVersion: DB_SCHEMA_VERSION,
    migrationVersion: DATA_MIGRATION_VERSION,
    development: import.meta.env.DEV,
  }
  if (!isTauriRuntime()) return base
  const { getName, getTauriVersion, getVersion } = await import('@tauri-apps/api/app')
  const [name, version, tauriVersion] = await Promise.all([getName(), getVersion(), getTauriVersion()])
  return { ...base, name, version, tauriVersion, environment: 'tauri' }
}
