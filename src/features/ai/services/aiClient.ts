import type { AIConfig } from '../../../types'

export type AIClientErrorCode = 'NO_CONFIG'|'INVALID_KEY'|'MODEL_NOT_FOUND'|'NETWORK_ERROR'|'TIMEOUT'|'RATE_LIMIT'|'QUOTA_EXCEEDED'|'INVALID_RESPONSE'|'EMPTY_RESPONSE'|'TRUNCATED'|'UNKNOWN'
export class AIClientError extends Error { constructor(public code: AIClientErrorCode, message: string, public detail?: string) { super(message) } }
export type AIJsonSchema = { name: string; schema: Record<string, unknown> }
export type AIRequest = { system: string; prompt: string; signal?: AbortSignal; jsonMode?: 'object'|'array'; jsonSchema?: AIJsonSchema; thinking?: 'enabled'|'disabled' }

const errorMessage: Record<AIClientErrorCode, string> = { NO_CONFIG:'请先在“设置 > AI 模型”中配置可用模型。', INVALID_KEY:'API Key 无效或没有访问权限。', MODEL_NOT_FOUND:'找不到该模型，请检查模型名称。', NETWORK_ERROR:'无法连接到 AI 服务，请检查 Base URL 与网络。', TIMEOUT:'请求超时，请稍后重试或提高超时时间。', RATE_LIMIT:'请求过于频繁，请稍后再试。', QUOTA_EXCEEDED:'服务额度或配额不足，请检查服务商控制台。', INVALID_RESPONSE:'AI 返回格式异常，请重新生成。', EMPTY_RESPONSE:'DeepSeek 本次返回了空内容，请重新生成。', TRUNCATED:'AI 输出因长度限制被截断，请在设置中提高 Max Tokens 后重试。', UNKNOWN:'AI 服务暂时无法完成请求。' }
export const aiErrorText = (error: unknown) => error instanceof AIClientError ? error.message : error instanceof Error ? error.message : errorMessage.UNKNOWN

type OpenAIContentPart = { text?: string | { value?: string }; content?: string }
type OpenAIMessage = { content?: string | OpenAIContentPart[]; reasoning_content?: string | OpenAIContentPart[]; reasoning?: string | OpenAIContentPart[] }
type OpenAIResponse = { choices?: Array<{ message?: OpenAIMessage; text?: string; finish_reason?: string }>; output_text?: string; usage?: { total_tokens?: number; completion_tokens?: number } }
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>; usageMetadata?: { totalTokenCount?: number; candidatesTokenCount?: number } }
type OutputCapability = 'json-schema'|'json-object'|'prompt-only'
export type ProviderCapability = { adapter:'deepseek'|'openai-compatible'|'gemini'|'custom'; supportsJsonObject:boolean; supportsJsonSchema:boolean; supportsThinking:boolean; supportsStreaming:boolean; parser:'content-only'|'standard' }

const secretKey = /(api[-_]?key|authorization|token|password|secret)/i
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, secretKey.test(key) ? '[REDACTED]' : redact(item)]))
  return value
}
function diagnostics(event: string, details: Record<string, unknown>) {
  const safe = redact(details) as Record<string, unknown>
  if (import.meta.env.DEV) console.debug(`[SummerFlow AI client] ${event}`, safe)
  else console.info(`[SummerFlow AI client] ${event}`, { ...safe, rawResponse: undefined, rawContent: undefined })
}
function endpoint(config: AIConfig) { const base = config.baseUrl.replace(/\/$/, ''); return /chat\/completions$/.test(base) ? base : `${base}/chat/completions` }
function mapHttp(status: number): AIClientErrorCode { if (status === 401 || status === 403) return 'INVALID_KEY'; if (status === 404) return 'MODEL_NOT_FOUND'; if (status === 408 || status === 504) return 'TIMEOUT'; if (status === 429) return 'RATE_LIMIT'; if (status === 402) return 'QUOTA_EXCEEDED'; return 'UNKNOWN' }
function isCompatibilityFailure(status: number) { return status === 400 || status === 422 }
function contentToText(content: string | OpenAIContentPart[] | undefined): string | undefined {
  if (typeof content === 'string') return content.trim() || undefined
  if (!Array.isArray(content)) return undefined
  const text = content.map(part => typeof part.text === 'string' ? part.text : typeof part.text === 'object' ? part.text.value ?? '' : part.content ?? '').join('').trim()
  return text || undefined
}
function openAIResponseText(data: OpenAIResponse, contentOnly = false): string | undefined {
  const choice = data.choices?.[0]
  // DeepSeek thinking puts chain-of-thought in reasoning_content. It must never be
  // used as a business response or fed into JSON.parse/Zod.
  if (contentOnly) return contentToText(choice?.message?.content)
  return contentToText(choice?.message?.content) ?? choice?.text?.trim() ?? data.output_text?.trim()
}
function hostname(baseUrl: string) { try { return new URL(baseUrl).hostname } catch { return '' } }
export function getProviderCapability(config: AIConfig): ProviderCapability {
  const deepSeek = config.provider === 'deepseek' || /(^|\.)api\.deepseek\.com$/i.test(hostname(config.baseUrl)) || /^deepseek-v4-(pro|flash)$/i.test(config.model)
  if (deepSeek) return { adapter:'deepseek', supportsJsonObject:true, supportsJsonSchema:false, supportsThinking:true, supportsStreaming:true, parser:'content-only' }
  if (config.provider === 'gemini') return { adapter:'gemini', supportsJsonObject:true, supportsJsonSchema:false, supportsThinking:false, supportsStreaming:true, parser:'standard' }
  const isOfficialOpenAI = /(^|\.)api\.openai\.com$/i.test(hostname(config.baseUrl))
  const hasKnownSchemaModel = /^(gpt-4o|gpt-4\.1|gpt-5)/i.test(config.model)
  if (config.provider === 'openai-compatible' && isOfficialOpenAI && hasKnownSchemaModel) return { adapter:'openai-compatible', supportsJsonObject:true, supportsJsonSchema:true, supportsThinking:false, supportsStreaming:true, parser:'standard' }
  return { adapter:config.provider === 'custom' ? 'custom' : 'openai-compatible', supportsJsonObject:true, supportsJsonSchema:false, supportsThinking:false, supportsStreaming:true, parser:'standard' }
}
function outputCapability(config: AIConfig, request: AIRequest, provider = getProviderCapability(config)): OutputCapability {
  if (!request.jsonMode) return 'prompt-only'
  if (request.jsonSchema && provider.supportsJsonSchema) return 'json-schema'
  if (request.jsonMode === 'object' && provider.supportsJsonObject) return 'json-object'
  return 'prompt-only'
}
async function responseData(response: Response, context: Record<string, unknown>): Promise<unknown> {
  const rawResponse = await response.text()
  try { const data: unknown = JSON.parse(rawResponse); diagnostics('http-response', { ...context, httpStatus: response.status, rawResponse: data }); return data }
  catch {
    diagnostics('non-json-http-response', { ...context, httpStatus: response.status, rawResponse })
    throw new AIClientError('INVALID_RESPONSE', errorMessage.INVALID_RESPONSE)
  }
}

export async function callAI(config: AIConfig, apiKey: string, request: AIRequest): Promise<{ text: string; tokens?: number; finishReason?: string; truncated: boolean; hasReasoningContent:boolean; capability:ProviderCapability }> {
  const controller = new AbortController(); const timeout = globalThis.setTimeout(() => controller.abort(), (config.timeout ?? 45) * 1000)
  const forwardAbort = () => controller.abort(); request.signal?.addEventListener('abort', forwardAbort, { once: true })
  const provider = getProviderCapability(config)
  const capability = outputCapability(config, request, provider)
  const baseContext = { provider:config.provider, adapter:provider.adapter, model:config.model, baseUrl:config.baseUrl, requestedJsonMode:request.jsonMode ?? 'none', capability, parser:provider.parser, thinking:request.thinking ?? (provider.supportsThinking ? 'enabled' : 'disabled') }
  diagnostics('request', baseContext)
  try {
    if (config.provider === 'gemini') {
      const url = `${config.baseUrl.replace(/\/$/, '')}/models/${config.model}:generateContent?key=${encodeURIComponent(apiKey)}`
      const body = (withJsonMode: boolean) => ({ contents:[{ parts:[{ text:`${request.system}\n\n${request.prompt}` }] }], generationConfig:{ temperature:config.temperature ?? .4, maxOutputTokens:config.maxTokens ?? 1600, ...(withJsonMode && request.jsonMode ? { responseMimeType:'application/json' } : {}) } })
      let response = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, signal:controller.signal, body:JSON.stringify(body(capability !== 'prompt-only')) })
      if (!response.ok && capability !== 'prompt-only' && isCompatibilityFailure(response.status)) {
        diagnostics('structured-output-fallback', { ...baseContext, httpStatus:response.status, reason:'Gemini responseMimeType was rejected' })
        response = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, signal:controller.signal, body:JSON.stringify(body(false)) })
      }
      const data = await responseData(response, baseContext) as GeminiResponse
      if (!response.ok) throw new AIClientError(mapHttp(response.status), errorMessage[mapHttp(response.status)])
      const candidate = data.candidates?.[0]; const text = candidate?.content?.parts?.map(part => part.text ?? '').join('').trim(); const finishReason = candidate?.finishReason
      const truncated = finishReason === 'MAX_TOKENS'
      diagnostics('content-extracted', { ...baseContext, finishReason, tokenUsage:data.usageMetadata?.totalTokenCount, completionTokens:data.usageMetadata?.candidatesTokenCount, truncated, rawContent:text })
      if (truncated) throw new AIClientError('TRUNCATED', errorMessage.TRUNCATED, finishReason)
      if (!text) throw new AIClientError('INVALID_RESPONSE', errorMessage.INVALID_RESPONSE, finishReason)
      return { text, tokens:data.usageMetadata?.totalTokenCount, finishReason, truncated, hasReasoningContent:false, capability:provider }
    }
    const maxTokens = provider.adapter === 'deepseek' ? Math.max(config.maxTokens ?? 0, 4096) : config.maxTokens ?? 1600
    const buildBody = (mode: OutputCapability) => ({ model:config.model, ...(provider.adapter === 'deepseek' ? { thinking:{ type:request.thinking ?? 'enabled' }, reasoning_effort:'high', stream:false } : { temperature:config.temperature ?? .4 }), max_tokens:maxTokens, messages:[{role:'system',content:request.system},{role:'user',content:request.prompt}], ...(mode === 'json-schema' && request.jsonSchema ? { response_format:{ type:'json_schema', json_schema:{ name:request.jsonSchema.name, strict:true, schema:request.jsonSchema.schema } } } : mode === 'json-object' ? { response_format:{type:'json_object'} } : {}) })
    const send = (mode: OutputCapability) => fetch(endpoint(config), { method:'POST', headers:{'content-type':'application/json', Authorization:`Bearer ${apiKey}`}, signal:controller.signal, body:JSON.stringify(buildBody(mode)) })
    let response = await send(capability)
    if (!response.ok && capability !== 'prompt-only' && isCompatibilityFailure(response.status)) {
      diagnostics('structured-output-fallback', { ...baseContext, httpStatus:response.status, reason:'response_format was rejected' })
      response = await send('prompt-only')
    }
    let data = await responseData(response, baseContext) as OpenAIResponse
    if (!response.ok) throw new AIClientError(mapHttp(response.status), errorMessage[mapHttp(response.status)])
    let finishReason = data.choices?.[0]?.finish_reason; let text = openAIResponseText(data, provider.parser === 'content-only'); let truncated = finishReason === 'length'
    let hasReasoningContent = Boolean(contentToText(data.choices?.[0]?.message?.reasoning_content) ?? contentToText(data.choices?.[0]?.message?.reasoning))
    diagnostics('content-extracted', { ...baseContext, finishReason, tokenUsage:data.usage?.total_tokens, completionTokens:data.usage?.completion_tokens, truncated, hasReasoningContent, rawContent:text })
    if (truncated) throw new AIClientError('TRUNCATED', errorMessage.TRUNCATED, finishReason)
    if (!text && provider.adapter === 'deepseek') {
      diagnostics('empty-content-retry', { ...baseContext, finishReason, hasReasoningContent })
      response = await send(capability); data = await responseData(response, { ...baseContext, retry:'empty-content' }) as OpenAIResponse
      if (!response.ok) throw new AIClientError(mapHttp(response.status), errorMessage[mapHttp(response.status)])
      finishReason = data.choices?.[0]?.finish_reason; text = openAIResponseText(data, true); truncated = finishReason === 'length'
      hasReasoningContent = Boolean(contentToText(data.choices?.[0]?.message?.reasoning_content) ?? contentToText(data.choices?.[0]?.message?.reasoning))
      diagnostics('empty-content-retry-result', { ...baseContext, finishReason, truncated, hasReasoningContent, rawContent:text })
      if (truncated) throw new AIClientError('TRUNCATED', errorMessage.TRUNCATED, finishReason)
    }
    if (!text) throw new AIClientError(provider.adapter === 'deepseek' ? 'EMPTY_RESPONSE' : 'INVALID_RESPONSE', provider.adapter === 'deepseek' ? errorMessage.EMPTY_RESPONSE : errorMessage.INVALID_RESPONSE, finishReason)
    return { text, tokens:data.usage?.total_tokens, finishReason, truncated, hasReasoningContent, capability:provider }
  } catch (error) {
    if (error instanceof AIClientError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') throw new AIClientError('TIMEOUT', errorMessage.TIMEOUT)
    diagnostics('request-failed', { ...baseContext, error:error instanceof Error ? error.message : 'Unknown error' })
    throw new AIClientError('NETWORK_ERROR', errorMessage.NETWORK_ERROR)
  } finally { clearTimeout(timeout); request.signal?.removeEventListener('abort', forwardAbort) }
}

export type DeepSeekDiagnostic = {
  capability: ProviderCapability
  recommended: { json:'json_object'; thinking:'enabled'; parser:'content only'; streaming:'disabled in SummerFlow' }
  checks: Array<{ name:'文本'|'JSON Object'|'Thinking'; ok:boolean; detail:string; hasReasoningContent?:boolean }>
}

/** Runs small, non-mutating requests against the selected DeepSeek configuration. */
export async function diagnoseDeepSeek(config: AIConfig, apiKey: string): Promise<DeepSeekDiagnostic> {
  const capability = getProviderCapability(config)
  if (capability.adapter !== 'deepseek') throw new AIClientError('INVALID_RESPONSE', 'AI 诊断仅适用于 DeepSeek 官方 API 或 deepseek-v4 系列模型。')
  const text = await callAI(config, apiKey, { system:'You are a connection diagnostic assistant.', prompt:'Reply with exactly: DeepSeek text OK', thinking:'disabled' })
  const json = await callAI(config, apiKey, { system:'Return only valid JSON.', prompt:'Return exactly this JSON object: {"status":"ok"}. No Markdown.', jsonMode:'object', thinking:'disabled' })
  let jsonOk = false
  try { jsonOk = JSON.parse(json.text).status === 'ok' } catch { jsonOk = false }
  const thinking = await callAI(config, apiKey, { system:'You are a connection diagnostic assistant.', prompt:'Reply with exactly: DeepSeek thinking OK', thinking:'enabled' })
  return {
    capability,
    recommended:{ json:'json_object', thinking:'enabled', parser:'content only', streaming:'disabled in SummerFlow' },
    checks:[
      { name:'文本', ok:text.text === 'DeepSeek text OK', detail:`finish_reason: ${text.finishReason ?? 'unknown'}` },
      { name:'JSON Object', ok:jsonOk, detail:`response_format: json_object; finish_reason: ${json.finishReason ?? 'unknown'}` },
      { name:'Thinking', ok:thinking.text === 'DeepSeek thinking OK', detail:`reasoning_content: ${thinking.hasReasoningContent ? 'present (not parsed)' : 'not returned'}; content only`, hasReasoningContent:thinking.hasReasoningContent },
    ],
  }
}
