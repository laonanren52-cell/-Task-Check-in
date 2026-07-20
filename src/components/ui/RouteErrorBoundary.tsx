import { AlertTriangle, FileDown, FolderOpen, Home, RefreshCw, ShieldCheck } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useState } from 'react'
import { isTauriRuntime } from '../../desktop/environment/platform'
import { openLogFolder, saveDiagnosticsWithDialog } from '../../desktop/filesystem/backup'
import { safeModeTodayUrl } from '../../app/safeMode'
import { Button } from './Button'
import './routeError.css'

function errorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`
  return error instanceof Error ? error.message : '未知显示错误'
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('你的任务、打卡、复盘和 AI 配置仍保留在当前设备。')
  const desktop = isTauriRuntime()
  const exportDiagnostics = async () => {
    setWorking(true)
    try {
      const saved = await saveDiagnosticsWithDialog(JSON.stringify({ generatedAt: new Date().toISOString(), type: 'route-render-error', message: errorMessage(error), path: window.location.pathname }, null, 2))
      setNotice(saved ? '诊断信息已导出。' : '未选择诊断文件保存位置。')
    } catch { setNotice('诊断信息导出失败，请稍后重试。') }
    finally { setWorking(false) }
  }
  return <main className="route-error-page"><section className="route-error-card" role="alert"><div className="route-error-card__mark"><AlertTriangle /></div><span className="eyebrow">恢复模式</span><h1>SummerFlow 遇到了显示问题。</h1><p>这不会清空或修改你的本地学习数据。可以先安全打开今天页面，继续查看、编辑和备份记录。</p><div className="route-error-actions"><Button onClick={() => window.location.reload()}><RefreshCw />重新加载</Button><Button variant="secondary" onClick={() => window.location.assign('/today')}><Home />返回今天</Button><Button variant="secondary" onClick={() => window.location.assign(safeModeTodayUrl())}><ShieldCheck />以安全模式打开</Button></div>{desktop && <div className="route-error-tools"><Button variant="ghost" disabled={working} onClick={() => void exportDiagnostics()}><FileDown />导出诊断信息</Button><Button variant="ghost" onClick={() => void openLogFolder()}><FolderOpen />打开日志目录</Button></div>}<small>{notice}</small><details><summary>技术信息</summary><code>{errorMessage(error)}</code></details></section></main>
}
