import { Bot, CheckCircle2, Pencil, Plus, ShieldCheck, Stethoscope, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { useToast } from '../../../components/ui/Toast'
import { useAppStore } from '../../../stores/appStore'
import type { AIConfig } from '../../../types'
import { aiErrorText, diagnoseDeepSeek, getProviderCapability, type DeepSeekDiagnostic } from '../services/aiClient'
import { getAISecret } from '../services/secretStore'
import { AIConfigDrawer } from './AIConfigDrawer'

export function AIModelSettings() {
  const { aiConfigs, aiPreferences, aiUsageLogs, saveAIConfig, deleteAIConfig, saveAIPreferences } = useAppStore()
  const [editing, setEditing] = useState<AIConfig>()
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<AIConfig>()
  const [diagnosingId, setDiagnosingId] = useState<string>()
  const [diagnosis, setDiagnosis] = useState<{ configId:string; data?:DeepSeekDiagnostic; error?:string }>()
  const toast = useToast()
  const month = useMemo(() => aiUsageLogs.filter(item => item.createdAt.slice(0, 7) === new Date().toISOString().slice(0, 7)), [aiUsageLogs])
  const success = month.filter(item => item.success).length
  const average = month.length ? Math.round(month.reduce((sum, item) => sum + (item.latencyMs ?? 0), 0) / month.length) : 0

  const runDiagnostic = async (config: AIConfig) => {
    setDiagnosingId(config.id)
    setDiagnosis(undefined)
    try {
      const key = await getAISecret(config.id)
      if (!key) throw new Error('请先编辑该配置并重新保存 API Key，再运行 AI 诊断。')
      const data = await diagnoseDeepSeek(config, key)
      setDiagnosis({ configId:config.id, data })
      toast('DeepSeek AI 诊断完成。')
    } catch (error) {
      const message = aiErrorText(error)
      setDiagnosis({ configId:config.id, error:message })
      toast(message, 'error')
    } finally {
      setDiagnosingId(undefined)
    }
  }

  return <section className="ai-settings">
    <div className="ai-settings__lead"><div><span className="eyebrow">你的服务，你的选择</span><h3>连接自己的 AI 模型。</h3><p>可为不同任务保存多套模型配置。SummerFlow 只在你点击 AI 操作时，按权限发送必要的学习上下文。</p></div><Button onClick={() => setAdding(true)}><Plus/>添加 AI 配置</Button></div>
    <div className="ai-security-note"><ShieldCheck/><span><b>{typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window ? '桌面端密钥已加密保存' : 'Web 模式提示'}</b><small>{typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window ? 'API Key 不进入 IndexedDB、日志或普通 JSON 备份。' : 'Web 模式的 API Key 仅保存在当前浏览器设备，请只在自己的设备使用。'}</small></span></div>
    <div className="ai-config-grid">{aiConfigs.map(config => {
      const capability = getProviderCapability(config)
      const isDeepSeek = capability.adapter === 'deepseek'
      const currentDiagnosis = diagnosis?.configId === config.id ? diagnosis : undefined
      return <article className="ai-config-card" key={config.id}><header><div className="ai-config-card__mark"><Bot/></div><div><h4>{config.displayName}</h4><p>{isDeepSeek ? 'DeepSeek 官方适配' : config.provider} · {config.model}</p></div>{config.isDefault && <span className="ai-default">默认</span>}</header><div className="ai-config-card__meta"><span>{config.enabled ? '已启用' : '已停用'}</span><span>{config.apiKeyHint ?? '尚未填写 Key'}</span></div>{isDeepSeek && <p className="ai-config-card__hint">JSON：json_object · Thinking：已启用 · Parser：只读取 content</p>}{currentDiagnosis?.data && <div className="ai-diagnostic-result is-success"><b>DeepSeek V4 Pro · 推荐模式已验证</b>{currentDiagnosis.data.checks.map(check => <small key={check.name}>{check.ok ? '✓' : '×'} {check.name}：{check.detail}</small>)}</div>}{currentDiagnosis?.error && <div className="ai-diagnostic-result is-error"><b>诊断未通过</b><small>{currentDiagnosis.error}</small></div>}<footer><button onClick={() => saveAIConfig({ ...config, isDefault:true, updatedAt:new Date().toISOString() })}>设为默认</button>{isDeepSeek && <button disabled={diagnosingId === config.id} onClick={() => runDiagnostic(config)}><Stethoscope/>{diagnosingId === config.id ? '正在诊断…' : 'AI 诊断'}</button>}<button onClick={() => setEditing(config)}><Pencil/>编辑</button><button className="danger-text" onClick={() => setDeleting(config)}><Trash2/></button></footer></article>
    })}{!aiConfigs.length && <div className="ai-empty"><CheckCircle2/><h4>先添加一个 AI 配置</h4><p>配置完成后，AI 安排、任务拆解与复盘分析才会开始发送请求。</p></div>}</div>
    <section className="ai-permissions"><div><span className="eyebrow">数据权限</span><h3>决定 AI 可以读取什么。</h3><p>权限影响每次请求构建的上下文，不会改变你的任务或打卡数据。</p></div><div className="ai-permission-grid">{Object.entries({ tasks:'任务与子任务', durations:'学习时长', focus:'专注度与精力', reviews:'每日复盘', goals:'暑期目标', recentHistory:'最近 7 天记录' }).map(([key, label]) => <label key={key}><input type="checkbox" checked={aiPreferences.permissions[key as keyof typeof aiPreferences.permissions]} onChange={event => saveAIPreferences({ ...aiPreferences, permissions:{ ...aiPreferences.permissions, [key]:event.target.checked }, consentedAt:new Date().toISOString(), updatedAt:new Date().toISOString() })}/><span>{label}</span></label>)}</div></section>
    <section className="ai-usage"><span>本月 AI 调用 <b>{month.length}</b> 次</span><span>成功 <b>{success}</b> 次</span><span>平均响应 <b>{average ? `${(average / 1000).toFixed(1)}s` : '—'}</b></span></section>
    {(adding || editing) && <AIConfigDrawer item={editing} onClose={() => { setAdding(false); setEditing(undefined) }} onSave={saveAIConfig}/>}<Dialog open={!!deleting} title="删除 AI 配置？" description="删除后对应 API Key 也会从当前设备移除，无法恢复。" confirmLabel="删除配置" danger onClose={() => setDeleting(undefined)} onConfirm={async () => { if (!deleting) return; await deleteAIConfig(deleting.id); setDeleting(undefined); toast('AI 配置已删除。') }}><p className="dialog__emphasis">{deleting?.displayName}</p></Dialog>
  </section>
}
