import { Eye, EyeOff, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'
import { createId } from '../../../lib/id'
import type { AIConfig, AIProvider } from '../../../types'
import { callAI, aiErrorText } from '../services/aiClient'
import { setAISecret } from '../services/secretStore'

type Draft = Omit<AIConfig, 'id'|'createdAt'|'updatedAt'> & { apiKey: string }
const defaults: Draft = { displayName:'',provider:'openai-compatible',baseUrl:'https://api.openai.com/v1',apiKey:'',model:'',enabled:true,isDefault:false,temperature:.4,maxTokens:1600,timeout:45,streamEnabled:false }
export function AIConfigDrawer({ item, onClose, onSave }: { item?: AIConfig; onClose:()=>void; onSave:(config:AIConfig)=>Promise<void> }) {
  const [value,setValue] = useState<Draft>(defaults); const [showKey,setShowKey] = useState(false); const [advanced,setAdvanced] = useState(false); const [working,setWorking] = useState(false); const [result,setResult] = useState<string>()
  const toast=useToast()
  useEffect(()=>setValue(item ? { ...item, apiKey:'' } : defaults),[item?.id])
  const change = <K extends keyof Draft>(key:K,next:Draft[K]) => setValue(current=>({...current,[key]:next}))
  const config = (): AIConfig => ({ ...value, id:item?.id ?? createId(), apiKeyHint:value.apiKey ? `••••${value.apiKey.slice(-4)}` : item?.apiKeyHint, createdAt:item?.createdAt ?? new Date().toISOString(), updatedAt:new Date().toISOString() })
  const test = async()=>{setWorking(true);setResult(undefined);try{const candidate=config();if(!value.apiKey&&!item?.apiKeyHint)throw new Error('请先填写 API Key。');const apiKey=value.apiKey || '';if(!apiKey)throw new Error('为保护密钥，请重新填写 API Key 后再测试。');const started=performance.now();const response=await callAI(candidate,apiKey,{system:'你是连接测试助手。',prompt:'仅回复：连接成功。'});setResult(`连接成功 · ${Math.round(performance.now()-started)}ms · ${response.text.slice(0,90)}`)}catch(error){setResult(aiErrorText(error))}finally{setWorking(false)}}
  const save = async()=>{if(!value.displayName.trim()||!value.baseUrl.trim()||!value.model.trim())return toast('请填写配置名称、Base URL 和模型名称。','error');const next=config();try{if(value.apiKey)await setAISecret(next.id,value.apiKey);await onSave(next);toast('AI 配置已保存。');onClose()}catch(error){toast(aiErrorText(error),'error')}}
  return <div className="ai-drawer-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><aside className="ai-drawer" role="dialog" aria-modal="true" aria-labelledby="ai-config-title"><header><div><span className="eyebrow">AI 模型</span><h2 id="ai-config-title">{item?'编辑 AI 配置':'添加 AI 配置'}</h2><p>密钥不会写入本地任务数据或普通备份。</p></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X/></button></header><div className="ai-drawer__body">
    <label>配置名称<input autoFocus value={value.displayName} onChange={e=>change('displayName',e.target.value)} placeholder="例如：DeepSeek 日常"/></label>
    <label>服务类型<select value={value.provider} onChange={e=>change('provider',e.target.value as AIProvider)}><option value="openai-compatible">OpenAI Compatible</option><option value="gemini">Gemini</option><option value="custom">Custom</option></select></label>
    <label>Base URL<input value={value.baseUrl} onChange={e=>change('baseUrl',e.target.value)} placeholder="https://api.example.com/v1"/></label>
    <label>API Key<span className="ai-secret-field"><input type={showKey?'text':'password'} value={value.apiKey} onChange={e=>change('apiKey',e.target.value)} placeholder={item?.apiKeyHint ? `已保存 ${item.apiKeyHint}` : '输入后将安全保存'}/><button type="button" onClick={()=>setShowKey(!showKey)} aria-label={showKey?'隐藏密钥':'显示密钥'}>{showKey?<EyeOff/>:<Eye/>}</button></span></label>
    <label>模型名称<input value={value.model} onChange={e=>change('model',e.target.value)} placeholder="可自由填写 Model ID"/></label>
    <button type="button" className="ai-advanced-toggle" onClick={()=>setAdvanced(!advanced)}>高级设置 {advanced?'收起':'展开'}</button>
    {advanced&&<div className="ai-advanced"><label>Temperature<input type="number" min="0" max="2" step="0.1" value={value.temperature} onChange={e=>change('temperature',Number(e.target.value))}/></label><label>Max Tokens<input type="number" min="128" max="16000" value={value.maxTokens} onChange={e=>change('maxTokens',Number(e.target.value))}/></label><label>请求超时（秒）<input type="number" min="5" max="180" value={value.timeout} onChange={e=>change('timeout',Number(e.target.value))}/></label></div>}
    {result&&<p className={`ai-test-result ${result.startsWith('连接成功')?'is-success':'is-error'}`}>{result}</p>}
  </div><footer><Button variant="secondary" disabled={working} onClick={test}>{working?'正在连接…':'测试连接'}</Button><div><Button variant="ghost" onClick={onClose}>取消</Button><Button onClick={save}><Save/>保存配置</Button></div></footer></aside></div>
}
