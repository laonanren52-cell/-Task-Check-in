import { createId } from '../../../lib/id'
import { useAppStore } from '../../../stores/appStore'
import type { AIFeature, AIConfig } from '../../../types'
import { callAI } from './aiClient'
import { buildAIContext } from './contextBuilder'
import { getAISecret } from './secretStore'

function activeConfig(id?: string): AIConfig {
  const state = useAppStore.getState(); const config = id ? state.aiConfigs.find(item => item.id === id) : state.aiConfigs.find(item => item.isDefault) ?? state.aiConfigs.find(item => item.enabled)
  if (!config) throw new Error('请先在“设置 > AI 模型”中添加一个可用模型。')
  if (!config.enabled) throw new Error('所选 AI 模型已停用。')
  return config
}
export async function generateAI(feature: AIFeature, prompt: { system:string; prompt:string }, date: string, configId?: string, signal?: AbortSignal) {
  const state = useAppStore.getState(); const config = activeConfig(configId); const key = await getAISecret(config.id)
  if (!key) throw new Error('该 AI 配置尚未填写 API Key。')
  const started = performance.now()
  try { const result = await callAI(config, key, { ...prompt, signal }); await state.logAIUsage({ id:createId(),feature,configId:config.id,createdAt:new Date().toISOString(),success:true,latencyMs:Math.round(performance.now()-started),tokenUsage:result.tokens }); return result.text }
  catch (error) { await state.logAIUsage({ id:createId(),feature,configId:config.id,createdAt:new Date().toISOString(),success:false,latencyMs:Math.round(performance.now()-started),errorCode:error instanceof Error ? error.name : 'UNKNOWN' }); throw error }
}
export function currentAIContext(date: string) { const state = useAppStore.getState(); return buildAIContext({ ...state, permissions:state.aiPreferences.permissions }, date) }
export function availableAIConfigs() { return useAppStore.getState().aiConfigs.filter(item => item.enabled) }
