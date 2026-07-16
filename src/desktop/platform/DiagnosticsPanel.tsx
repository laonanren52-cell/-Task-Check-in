import { FileDown, FolderOpen } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAppStore } from '../../stores/appStore'
import { isTauriRuntime } from '../environment/platform'
import { openLogFolder, saveDiagnosticsWithDialog } from '../filesystem/backup'
import { useUpdateStore } from '../updater/store'
import { useAppInfo } from './useAppInfo'

export function DiagnosticsPanel() {
  const info = useAppInfo()
  const appError = useAppStore(state => state.error)
  const updateError = useUpdateStore(state => state.error)
  const [working, setWorking] = useState(false)
  const toast = useToast()
  if (!isTauriRuntime()) return null
  const exportDiagnostics = async () => {
    setWorking(true)
    try {
      const os = await import('@tauri-apps/plugin-os')
      const diagnostics = {
        generatedAt: new Date().toISOString(),
        application: info,
        operatingSystem: { platform: os.platform(), type: os.type(), version: os.version(), arch: os.arch() },
        recentErrors: { updater: updateError ?? null, database: appError ?? null },
      }
      const path = await saveDiagnosticsWithDialog(JSON.stringify(diagnostics, null, 2))
      if (path) toast('诊断信息已导出')
    } catch (error) { toast(error instanceof Error ? error.message : '诊断信息导出失败', 'error') }
    finally { setWorking(false) }
  }
  return <section className="settings-section diagnostics-section"><header><div><h2>日志与诊断</h2><p>诊断文件只包含版本、系统、数据库版本和最近错误，不包含任务、备注或复盘正文。</p></div></header><div className="backup-actions"><Button variant="secondary" onClick={() => openLogFolder()}><FolderOpen />打开日志目录</Button><Button variant="secondary" disabled={working} onClick={exportDiagnostics}><FileDown />{working ? '正在导出' : '导出诊断信息'}</Button></div></section>
}
