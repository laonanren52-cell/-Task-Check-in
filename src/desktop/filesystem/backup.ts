import { isTauriRuntime } from '../environment/platform'
import { logError, logInfo } from '../logging/logger'

const BACKUP_DIRECTORY = 'backups'

export function createBackupFilename(date = new Date()): string {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    '-',
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('')
  return `SummerFlow-Backup-${stamp}.json`
}

export async function saveBackupWithDialog(contents: string): Promise<string | null> {
  if (!isTauriRuntime()) return null
  const [{ save }, { writeTextFile }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-fs')])
  const path = await save({ defaultPath: createBackupFilename(), filters: [{ name: 'SummerFlow JSON Backup', extensions: ['json'] }] })
  if (!path) return null
  await writeTextFile(path, contents)
  await logInfo('backup.exported', { destination: 'user-selected' })
  return path
}

export async function pickBackupFile(): Promise<{ path: string; contents: string } | null> {
  if (!isTauriRuntime()) return null
  const [{ open }, { readTextFile }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-fs')])
  const path = await open({ multiple: false, directory: false, filters: [{ name: 'SummerFlow JSON Backup', extensions: ['json'] }] })
  if (!path) return null
  return { path, contents: await readTextFile(path) }
}

export async function createAutomaticBackup(contents: string, reason: 'update' | 'import' | 'manual' = 'manual'): Promise<string | null> {
  if (!isTauriRuntime()) return null
  try {
    const [{ mkdir, readDir, remove, writeTextFile, BaseDirectory }, { appLocalDataDir, join }] = await Promise.all([import('@tauri-apps/plugin-fs'), import('@tauri-apps/api/path')])
    await mkdir(BACKUP_DIRECTORY, { baseDir: BaseDirectory.AppLocalData, recursive: true })
    const filename = createBackupFilename()
    await writeTextFile(`${BACKUP_DIRECTORY}/${filename}`, contents, { baseDir: BaseDirectory.AppLocalData })
    const entries = (await readDir(BACKUP_DIRECTORY, { baseDir: BaseDirectory.AppLocalData })).filter(entry => entry.isFile && entry.name?.endsWith('.json')).sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''))
    await Promise.all(entries.slice(5).map(entry => remove(`${BACKUP_DIRECTORY}/${entry.name}`, { baseDir: BaseDirectory.AppLocalData })))
    await logInfo('backup.automatic', { reason, retained: Math.min(entries.length, 5) })
    return join(await appLocalDataDir(), BACKUP_DIRECTORY, filename)
  } catch (error) {
    await logError('backup.failed', error, { reason })
    return null
  }
}

export async function openBackupFolder(): Promise<void> {
  if (!isTauriRuntime()) return
  const [{ mkdir, BaseDirectory }, { appLocalDataDir, join }, { openPath }] = await Promise.all([import('@tauri-apps/plugin-fs'), import('@tauri-apps/api/path'), import('@tauri-apps/plugin-opener')])
  await mkdir(BACKUP_DIRECTORY, { baseDir: BaseDirectory.AppLocalData, recursive: true })
  await openPath(await join(await appLocalDataDir(), BACKUP_DIRECTORY))
}

export async function openLogFolder(): Promise<void> {
  if (!isTauriRuntime()) return
  const [{ appLogDir }, { openPath }] = await Promise.all([import('@tauri-apps/api/path'), import('@tauri-apps/plugin-opener')])
  await openPath(await appLogDir())
}

export async function saveDiagnosticsWithDialog(contents: string): Promise<string | null> {
  if (!isTauriRuntime()) return null
  const [{ save }, { writeTextFile }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-fs')])
  const path = await save({ defaultPath: `SummerFlow-Diagnostics-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: 'JSON', extensions: ['json'] }] })
  if (!path) return null
  await writeTextFile(path, contents)
  return path
}
