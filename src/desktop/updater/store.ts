import type { Update } from '@tauri-apps/plugin-updater'
import semver from 'semver'
import { create } from 'zustand'
import { useAppStore } from '../../stores/appStore'
import { createAutomaticBackup } from '../filesystem/backup'
import { isTauriRuntime } from '../environment/platform'
import { logError, logInfo } from '../logging/logger'
import { getAppRuntimeInfo } from '../platform/appInfo'
import type { UpdateReleaseInfo, UpdateStatus } from './types'

interface UpdateState {
  status: UpdateStatus
  currentVersion: string
  release?: UpdateReleaseInfo
  downloadedBytes: number
  totalBytes?: number
  lastCheckedAt?: string
  error?: string
  update?: Update
  initialize: () => Promise<void>
  checkForUpdates: (manual?: boolean) => Promise<void>
  downloadUpdate: () => Promise<void>
  installAndRelaunch: () => Promise<void>
  dismiss: () => void
}

function stringField(raw: Record<string, unknown>, key: string): string | undefined {
  return typeof raw[key] === 'string' ? raw[key] as string : undefined
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: 'idle',
  currentVersion: __APP_VERSION__,
  downloadedBytes: 0,
  initialize: async () => {
    const info = await getAppRuntimeInfo()
    set({ currentVersion: info.version, status: info.environment === 'tauri' && info.development ? 'development' : 'idle' })
    await logInfo('app.started', { version: info.version, environment: info.environment, databaseVersion: info.databaseVersion })
  },
  checkForUpdates: async (manual = false) => {
    if (!isTauriRuntime()) return
    if (import.meta.env.DEV) {
      set({ status: 'development', error: undefined })
      return
    }
    set({ status: 'checking', error: undefined })
    await logInfo('update.check.started', { manual })
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check({ timeout: 30_000 })
      const checkedAt = new Date().toISOString()
      const appStore = useAppStore.getState()
      await appStore.saveSettings({ ...appStore.settings, lastUpdateCheckAt: checkedAt, updatedAt: checkedAt })
      if (!update) {
        set({ status: 'latest', lastCheckedAt: checkedAt, release: undefined, update: undefined })
        await logInfo('update.check.latest', { currentVersion: get().currentVersion })
        return
      }
      const minimumSupportedVersion = stringField(update.rawJson, 'minimumSupportedVersion')
      const explicitMandatory = update.rawJson.mandatory === true
      const mandatory = explicitMandatory || Boolean(minimumSupportedVersion && semver.valid(minimumSupportedVersion) && semver.lt(update.currentVersion, minimumSupportedVersion))
      const release: UpdateReleaseInfo = {
        currentVersion: update.currentVersion,
        latestVersion: update.version,
        releaseNotes: stringField(update.rawJson, 'releaseNotes') ?? update.body ?? '本次更新未提供详细说明。',
        publishedAt: stringField(update.rawJson, 'publishedAt') ?? update.date,
        minimumSupportedVersion,
        mandatory,
      }
      set({ status: 'available', update, release, lastCheckedAt: checkedAt, downloadedBytes: 0, totalBytes: undefined })
      await logInfo('update.available', { currentVersion: update.currentVersion, latestVersion: update.version, mandatory })
    } catch (error) {
      const message = error instanceof Error ? error.message : '检查更新失败'
      set({ status: 'error', error: message })
      await logError('update.check.failed', error)
    }
  },
  downloadUpdate: async () => {
    const update = get().update
    if (!update) return
    set({ status: 'downloading', downloadedBytes: 0, totalBytes: undefined, error: undefined })
    const appStore = useAppStore.getState()
    const backupPath = await createAutomaticBackup(JSON.stringify(appStore.exportBackup(), null, 2), 'update')
    if (!backupPath) {
      set({ status: 'error', error: '更新前安全备份失败。请先在数据管理中手动导出备份，再重试。' })
      return
    }
    const now = new Date().toISOString()
    await appStore.saveSettings({ ...appStore.settings, lastDesktopBackupAt: now, updatedAt: now })
    await logInfo('update.download.started', { latestVersion: update.version })
    try {
      await update.download(event => {
        if (event.event === 'Started') set({ totalBytes: event.data.contentLength, downloadedBytes: 0 })
        if (event.event === 'Progress') set(state => ({ downloadedBytes: state.downloadedBytes + event.data.chunkLength }))
        if (event.event === 'Finished') set({ status: 'downloaded' })
      })
      set({ status: 'downloaded' })
      await logInfo('update.download.finished', { latestVersion: update.version })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新下载失败'
      set({ status: 'error', error: message })
      await logError('update.download.failed', error, { latestVersion: update.version })
    }
  },
  installAndRelaunch: async () => {
    const update = get().update
    if (!update) return
    set({ status: 'installing', error: undefined })
    await logInfo('update.install.started', { latestVersion: update.version })
    try {
      await update.install()
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新安装失败'
      set({ status: 'error', error: message })
      await logError('update.install.failed', error, { latestVersion: update.version })
    }
  },
  dismiss: () => {
    if (get().release?.mandatory) return
    set(state => ({ status: state.update ? 'available' : 'idle' }))
  },
}))
