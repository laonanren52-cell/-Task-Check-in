import type { z } from 'zod'
import { createId } from '../../../lib/id'
import { useAppStore } from '../../../stores/appStore'
import type { AIFeature, AIConfig } from '../../../types'
import { aiDailyInsightSchema, aiReviewDraftSchema, aiTaskBreakdownSchema, aiTaskPlanSchema, parseAIJson } from '../schemas/aiResponses'
import { callAI } from './aiClient'
import { buildAIContext } from './contextBuilder'
import { isLikelyWrongOutputLanguage, languageCorrectionInstruction, outputLanguageInstruction, resolveOutputLanguage, type ResolvedOutputLanguage } from './outputLanguage'
import { getAISecret } from './secretStore'

export class AIOutputLanguageError extends Error {
  constructor(public readonly rawText: string) { super('AI 返回语言与当前设置不一致，请重新生成。') }
}

function activeConfig(id?: string): AIConfig {
  const state = useAppStore.getState(); const config = id ? state.aiConfigs.find(item => item.id === id) : state.aiConfigs.find(item => item.isDefault) ?? state.aiConfigs.find(item => item.enabled)
  if (!config) throw new Error('请先在“设置 > AI 模型”中添加一个可用模型。')
  if (!config.enabled) throw new Error('所选 AI 模型已停用。')
  return config
}
const stringArray = { type:'array', items:{ type:'string' } }
const structuredOutputFor = (feature: AIFeature) => {
  if (feature === 'planner') return { jsonMode:'array' as const }
  if (feature === 'review') return { jsonMode:'object' as const, jsonSchema:{ name:'daily_review', schema:{ type:'object', additionalProperties:false, required:['headline','positive','adjustment','tomorrowActions','tone'], properties:{ headline:{type:'string'}, positive:stringArray, adjustment:stringArray, tomorrowActions:stringArray, tone:{type:'string',enum:['steady','encouraging','gentle-adjustment','rest']} } } } }
  if (feature === 'organize-review') return { jsonMode:'object' as const, jsonSchema:{ name:'review_draft', schema:{ type:'object', additionalProperties:false, required:['overall','achievement','problem','satisfaction','nextStep'], properties:{ overall:{type:'string'}, achievement:{type:'string'}, problem:{type:'string'}, satisfaction:{type:'string'}, nextStep:{type:'string'} } } } }
  if (feature === 'breakdown') return { jsonMode:'object' as const, jsonSchema:{ name:'task_breakdown', schema:{ type:'object', additionalProperties:false, required:['suitableForOneDay','steps'], properties:{ suitableForOneDay:{type:'boolean'}, warning:{type:'string'}, steps:{type:'array',items:{type:'object',additionalProperties:false,required:['title','estimatedMinutes'],properties:{title:{type:'string'},estimatedMinutes:{type:'integer'},detail:{type:'string'}}}} } } } }
  return undefined
}
const schemaFor: Partial<Record<AIFeature, z.ZodType>> = { planner:aiTaskPlanSchema, breakdown:aiTaskBreakdownSchema, review:aiDailyInsightSchema, 'organize-review':aiReviewDraftSchema }

async function enforceOutputLanguage(feature: AIFeature, text: string, config: AIConfig, key: string, language: ResolvedOutputLanguage) {
  const schema = schemaFor[feature]
  if (schema) parseAIJson(text, schema, feature)
  if (!isLikelyWrongOutputLanguage(text, language)) return text
  const correction = languageCorrectionInstruction(language, text, Boolean(schema))
  const corrected = await callAI(config, key, { ...correction, ...structuredOutputFor(feature) })
  if (schema) parseAIJson(corrected.text, schema, `${feature}-language-correction`)
  if (isLikelyWrongOutputLanguage(corrected.text, language)) throw new AIOutputLanguageError(text)
  return corrected.text
}

export async function generateAI(feature: AIFeature, prompt: { system:string; prompt:string }, date: string, configId?: string, signal?: AbortSignal) {
  const state = useAppStore.getState(); const config = activeConfig(configId); const key = await getAISecret(config.id)
  if (!key) throw new Error('该 AI 配置尚未填写 API Key。')
  const language = resolveOutputLanguage(state.aiPreferences)
  const started = performance.now()
  try {
    const result = await callAI(config, key, { system:`${prompt.system}\n\n${outputLanguageInstruction(language)}`, prompt:prompt.prompt, ...structuredOutputFor(feature), signal })
    const text = await enforceOutputLanguage(feature, result.text, config, key, language)
    await state.logAIUsage({ id:createId(),feature,configId:config.id,createdAt:new Date().toISOString(),success:true,latencyMs:Math.round(performance.now()-started),tokenUsage:result.tokens })
    return text
  } catch (error) {
    await state.logAIUsage({ id:createId(),feature,configId:config.id,createdAt:new Date().toISOString(),success:false,latencyMs:Math.round(performance.now()-started),errorCode:error instanceof Error ? error.name : 'UNKNOWN' })
    throw error
  }
}
export function currentAIContext(date: string) { const state = useAppStore.getState(); return buildAIContext({ ...state, permissions:state.aiPreferences.permissions, outputLanguage:resolveOutputLanguage(state.aiPreferences) }, date) }
export function availableAIConfigs() { return useAppStore.getState().aiConfigs.filter(item => item.enabled) }
