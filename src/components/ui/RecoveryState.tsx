import { AlertTriangle, Download } from 'lucide-react'
import { useState } from 'react'
import { exportReadonlyRecovery } from '../../db/recovery'
import { isTauriRuntime } from '../../desktop/environment/platform'
import { saveBackupWithDialog } from '../../desktop/filesystem/backup'
import { Button } from './Button'

export function RecoveryState({ message }: { message: string }) {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const exportRaw = async () => {
    setExporting(true); setExportError('')
    try {
      const raw = await exportReadonlyRecovery()
      if (isTauriRuntime()) await saveBackupWithDialog(raw)
      else {
        const anchor = document.createElement('a')
        anchor.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
        anchor.download = `SummerFlow-Recovery-${new Date().toISOString().slice(0, 10)}.json`
        anchor.click(); URL.revokeObjectURL(anchor.href)
      }
    } catch (error) { setExportError(error instanceof Error ? error.message : '原始数据导出失败') }
    finally { setExporting(false) }
  }
  return <div className="state state--error recovery-state"><AlertTriangle /><strong>已进入只读恢复模式</strong><span>数据库升级未完成，系统没有删除或覆盖旧数据。</span><small>{message}</small><Button onClick={exportRaw} disabled={exporting}><Download />{exporting ? '正在导出' : '导出原始数据'}</Button>{exportError && <span className="form-error">{exportError}</span>}</div>
}
