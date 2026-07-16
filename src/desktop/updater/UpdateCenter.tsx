import { AlertCircle, CheckCircle2, CloudDownload, ExternalLink, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAppStore } from '../../stores/appStore'
import { isTauriRuntime } from '../environment/platform'
import { useAppInfo } from '../platform/useAppInfo'
import { useUpdateStore } from './store'
import type { UpdateStatus } from './types'

const statusLabels: Record<UpdateStatus, string> = {
  idle: '未检查', checking: '正在检查', latest: '当前已是最新版本', available: '发现新版本', downloading: '正在下载', downloaded: '下载完成', installing: '正在安装', error: '更新失败', development: '开发模式',
}

const releaseUrl = 'https://github.com/laonanren52-cell/-Task-Check-in/releases'

export function UpdateCenter() {
  const { settings, saveSettings } = useAppStore()
  const info = useAppInfo()
  const update = useUpdateStore()
  const toast = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const desktop = isTauriRuntime()
  useEffect(() => { if (update.status === 'available') setDialogOpen(true) }, [update.status])
  const percent = useMemo(() => update.totalBytes ? Math.min(100, Math.round(update.downloadedBytes / update.totalBytes * 100)) : undefined, [update.downloadedBytes, update.totalBytes])
  const openReleasePage = async () => {
    if (desktop) { const { openUrl } = await import('@tauri-apps/plugin-opener'); await openUrl(releaseUrl) }
    else window.open(releaseUrl, '_blank', 'noopener,noreferrer')
  }
  const toggleAutomatic = async () => {
    const now = new Date().toISOString()
    await saveSettings({ ...settings, autoCheckUpdates: !settings.autoCheckUpdates, updatedAt: now })
    toast(!settings.autoCheckUpdates ? '已开启启动时自动检查' : '已关闭自动检查，仍可手动检查')
  }
  const busy = ['checking', 'downloading', 'installing'].includes(update.status)
  return <>
    <section className="settings-section update-center">
      <header><div><h2>软件更新</h2><p>桌面版使用 Tauri 签名更新；Web/PWA 使用独立的 Service Worker 更新提示。</p></div><span className={`runtime-badge runtime-badge--${info?.environment ?? 'browser'}`}>{info?.environment === 'tauri' ? '桌面版' : info?.environment === 'pwa' ? 'PWA' : 'Web'}</span></header>
      <div className="update-grid grid-flow-dense">
        <div className="update-version"><span>当前版本</span><strong>{info?.version ?? __APP_VERSION__}</strong><small>{info?.development ? '开发构建 · 不执行真实更新安装' : '稳定通道'}</small></div>
        <div className="update-state"><span>当前状态</span><b>{statusLabels[update.status]}</b><small>{settings.lastUpdateCheckAt ? `上次检查 ${new Date(settings.lastUpdateCheckAt).toLocaleString('zh-CN')}` : '尚未检查'}</small></div>
        <div className="update-policy"><ShieldCheck /><div><b>非强制更新</b><small>发现版本后由你决定下载和重启；安装前自动创建本地备份。</small></div></div>
        <label className="switch-row"><div><b>启动时自动检查</b><small>关闭后仍可手动检查更新</small></div><input type="checkbox" checked={settings.autoCheckUpdates} onChange={toggleAutomatic} /></label>
        {update.error && <div className="update-error"><AlertCircle />{update.error}</div>}
        <div className="update-actions">
          <Button variant="secondary" onClick={openReleasePage}><ExternalLink />GitHub Releases</Button>
          <Button disabled={!desktop || busy} onClick={() => update.checkForUpdates(true)}><RefreshCw className={update.status === 'checking' ? 'spin' : ''} />检查更新</Button>
          {!desktop && <small>桌面更新功能仅在安装版中启用，当前 Web/PWA 数据不会调用 Tauri API。</small>}
        </div>
      </div>
    </section>
    {dialogOpen && update.release && <div className="overlay" role="presentation">
      <section className="update-dialog" role="dialog" aria-modal="true" aria-labelledby="update-title">
        <div className="update-dialog__top"><span><CloudDownload /></span><div><small>{update.release.mandatory ? '必须更新' : '可用更新'}</small><h2 id="update-title">{update.release.currentVersion} <i>→</i> {update.release.latestVersion}</h2></div></div>
        <div className="update-dialog__meta"><span>发布时间<b>{update.release.publishedAt ? new Date(update.release.publishedAt).toLocaleString('zh-CN') : '未提供'}</b></span><span>下载大小<b>{update.totalBytes ? formatBytes(update.totalBytes) : '下载开始后显示'}</b></span></div>
        <div className="release-notes"><b>更新说明</b><p>{update.release.releaseNotes}</p></div>
        {update.release.minimumSupportedVersion && <div className="mandatory-note"><ShieldCheck />最低支持版本：{update.release.minimumSupportedVersion}</div>}
        {['downloading', 'downloaded', 'installing'].includes(update.status) && <div className="download-progress"><div><span>当前阶段：{statusLabels[update.status]}</span><b>{percent === undefined ? '计算中' : `${percent}%`}</b></div><div className="progress"><i style={{ width: `${percent ?? 4}%` }} /></div><small>{formatBytes(update.downloadedBytes)} / {update.totalBytes ? formatBytes(update.totalBytes) : '总大小未知'}</small></div>}
        {update.status === 'error' && <div className="update-error"><AlertCircle />{update.error}</div>}
        <div className="update-dialog__actions">
          {!update.release.mandatory && update.status !== 'installing' && <Button variant="ghost" onClick={() => { setDialogOpen(false); update.dismiss() }}>稍后更新</Button>}
          {(update.status === 'available' || update.status === 'error') && <Button onClick={() => update.downloadUpdate()}><CloudDownload />下载更新</Button>}
          {update.status === 'downloaded' && <Button onClick={() => update.installAndRelaunch()}><RotateCcw />立即重启并安装</Button>}
          {update.status === 'installing' && <Button disabled><RefreshCw className="spin" />正在安装</Button>}
          {update.status === 'latest' && <Button onClick={() => setDialogOpen(false)}><CheckCircle2 />完成</Button>}
        </div>
      </section>
    </div>}
  </>
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}
