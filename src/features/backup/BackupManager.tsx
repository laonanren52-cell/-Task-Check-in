import { Download, FileJson, FolderOpen, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useToast } from '../../components/ui/Toast'
import { isTauriRuntime } from '../../desktop/environment/platform'
import { createAutomaticBackup, openBackupFolder, pickBackupFile, saveBackupWithDialog } from '../../desktop/filesystem/backup'
import { logError, logInfo } from '../../desktop/logging/logger'
import { convertLegacyBackup } from '../migration/legacy'
import { useAppStore } from '../../stores/appStore'
import type { BackupData } from '../../types'
import { tasksToCsv } from './csv'
import { backupSchema } from './schema'

const download = (name: string, content: string, type: string) => {
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(new Blob([content], { type }))
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(anchor.href)
}

export function BackupManager() {
  const store = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<BackupData>()
  const [clear, setClear] = useState(false)
  const [working, setWorking] = useState(false)
  const toast = useToast()
  const desktop = isTauriRuntime()
  const serialized = () => JSON.stringify(store.exportBackup(), null, 2)

  const markBackup = async () => {
    const now = new Date().toISOString()
    await store.saveSettings({ ...useAppStore.getState().settings, lastDesktopBackupAt: now, updatedAt: now })
  }
  const exportJson = async () => {
    setWorking(true)
    try {
      if (desktop) {
        const path = await saveBackupWithDialog(serialized())
        if (path) { await markBackup(); toast('JSON 备份已保存到所选位置') }
      } else {
        download(`SummerFlow-Backup-${new Date().toISOString().slice(0, 10)}.json`, serialized(), 'application/json')
        toast('JSON 备份已下载')
      }
    } catch (error) { await logError('backup.export.failed', error); toast(error instanceof Error ? error.message : '备份导出失败', 'error') }
    finally { setWorking(false) }
  }
  const parse = async (raw: string) => {
    try { setPreview(backupSchema.parse(JSON.parse(raw)) as BackupData) }
    catch (backupError) {
      try {
        setPreview(convertLegacyBackup(raw))
        toast('已识别旧版学习打卡备份，导入后会自动转换为当前数据结构')
      } catch (legacyError) {
        await logError('backup.import.invalid', legacyError, { currentFormatError: backupError instanceof Error ? backupError.message : 'unknown' })
        toast(`导入文件无效：${legacyError instanceof Error ? legacyError.message : '未知格式'}`, 'error')
      }
    }
  }
  const readBrowserFile = async (file?: File) => {
    if (!file) return
    await parse(await file.text())
    if (fileRef.current) fileRef.current.value = ''
  }
  const chooseDesktopFile = async () => {
    try { const file = await pickBackupFile(); if (file) await parse(file.contents) }
    catch (error) { await logError('backup.import.read.failed', error); toast(error instanceof Error ? error.message : '无法读取备份', 'error') }
  }
  const importNow = async () => {
    if (!preview) return
    setWorking(true)
    try {
      if (desktop) {
        const path = await createAutomaticBackup(serialized(), 'import')
        if (!path) throw new Error('导入前安全备份失败，当前数据未被覆盖')
        await markBackup()
      } else {
        download(`SummerFlow-Before-Import-${new Date().toISOString().slice(0, 10)}.json`, serialized(), 'application/json')
      }
      await store.importBackup(preview)
      if (desktop) await markBackup()
      await logInfo('backup.import.completed', { tasks: preview.tasks.length, checkins: preview.dailyRecords.filter(item => item.checkedIn).length })
      toast('数据恢复完成，已先创建安全备份')
      setPreview(undefined)
    } catch (error) {
      await logError('backup.import.failed', error)
      toast(`导入失败，当前数据未改变：${error instanceof Error ? error.message : '未知错误'}`, 'error')
    } finally { setWorking(false) }
  }

  return <section className="settings-section backup-section">
    <header><div><h2>数据管理</h2><p>{desktop ? '桌面版可选择保存位置，并在更新或导入前自动轮换保留最近 5 份安全备份。' : '数据保存在当前浏览器设备中，请定期导出备份。'}</p></div></header>
    {desktop && <div className="backup-last"><span>最近一次桌面备份</span><b>{store.settings.lastDesktopBackupAt ? new Date(store.settings.lastDesktopBackupAt).toLocaleString('zh-CN') : '尚未备份'}</b></div>}
    <div className="backup-actions">
      <Button disabled={working} onClick={exportJson}><Download />{working ? '正在处理' : '导出全部 JSON'}</Button>
      <Button variant="secondary" onClick={() => desktop ? chooseDesktopFile() : fileRef.current?.click()}><Upload />从 JSON 恢复</Button>
      <input ref={fileRef} hidden type="file" accept="application/json" onChange={event => readBrowserFile(event.target.files?.[0])} />
      {desktop && <Button variant="secondary" onClick={openBackupFolder}><FolderOpen />打开备份目录</Button>}
      <Button variant="secondary" onClick={() => download('SummerFlow-任务明细.csv', tasksToCsv(store.tasks, store.themes, store.subjects), 'text/csv;charset=utf-8')}><FileJson />导出任务 CSV</Button>
      <Button variant="secondary" onClick={async () => { await store.restoreDefaults(); toast('默认分类已恢复') }}><RotateCcw />恢复默认分类</Button>
      <Button variant="danger" onClick={() => setClear(true)}><Trash2 />清空全部数据</Button>
    </div>
    <Dialog open={!!preview} title="确认恢复这份备份？" description="导入前会自动创建当前数据的安全备份；校验或写入失败不会覆盖现有数据。" confirmLabel="确认导入" onClose={() => setPreview(undefined)} onConfirm={importNow}>{preview && <div className="import-summary"><span><b>{preview.tasks.length}</b>任务</span><span><b>{preview.dailyRecords.filter(item => item.checkedIn).length}</b>打卡</span><span><b>{preview.themes.length}</b>主题</span><span><b>{preview.subjects.length}</b>科目</span></div>}</Dialog>
    <Dialog open={clear} title="清空全部本地数据？" description="此操作会删除当前设备中的任务、打卡、复盘与自定义分类。" confirmLabel="确认清空" danger onClose={() => setClear(false)} onConfirm={async () => { await store.clearAll(); setClear(false); toast('数据已清空并恢复默认分类') }}><div className="clear-summary"><span>任务 {store.tasks.length}</span><span>打卡 {store.dailyRecords.filter(item => item.checkedIn).length}</span><span>主题 {store.themes.length}</span><span>科目 {store.subjects.length}</span><span>模板 {store.templates.length}</span></div></Dialog>
  </section>
}
