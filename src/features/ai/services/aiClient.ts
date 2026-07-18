import type { AIConfig } from '../../../types'

export type AIClientErrorCode = 'NO_CONFIG'|'INVALID_KEY'|'MODEL_NOT_FOUND'|'NETWORK_ERROR'|'TIMEOUT'|'RATE_LIMIT'|'QUOTA_EXCEEDED'|'INVALID_RESPONSE'|'TRUNCATED'|'UNKNOWN'
export class AIClientError extends Error { constructor(public code: AIClientErrorCode, message: string, public detail?: string) { super(message) } }
export type AIJsonSchema = { name: string; schema: Record<string, unknown> }
export type AIRequest = { system: string; prompt: string; signal?: AbortSignal; jsonMode?: 'object'|'array'; jsonSchema?: AIJsonSchema }

const errorMessage: Record<AIClientErrorCode, string> = { NO_CONFIG:'请先在“设置 > AI 模型”中配置可用模型。', INVALID_KEY:'API Key 无效或没有访问权限。', MODEL_NOT_FOUND:'找不到该模型，请检查模型名称。', NETWORK_ERROR:'无法连接到 AI 服务，请检查 Base URL 与网络。', TIMEOUT:'请求超时，请稍后重试或提高超时时间。', RATE_LIMIT:'请求过于频繁，请稍后再试。', QUOTA_EXCEEDED:'服务额度或配额不足，请检查服务商控制台。', INVALID_RESPONSE:'AI 返回格式异常，请重新生成。', TRUNCATED:'AI 输出因长度限制被截断，请在设置中提高 Max Tokens 后重试。', UNKNOWN:'AI 服务暂时无法完成请求。' }
export const aiErrorText = (error: unknown) => error instanceof AIClientError ? error.message : error instanceof Error ? error.message : errorMessage.UNKNOWN

type OpenAIContentPart = { text?: string | { value?: string }; content?: string }
type OpenAIMessage = { content?: string | OpenAIContentPart[]; reasoning_content?: string | OpenAIContentPart[]; reasoning?: string | OpenAIContentPart[] }
type OpenAIResponse = { choices?: Array<{ message?: OpenAIMessage; text?: string; finish_reason?: string }>; output_text?: string; usage?: { total_tokens?: number; completion_tokens?: number } }
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>; usageMetadata?: { totalTokenCount?: number; candidatesTokenCount?: number } }
type OutputCapability = 'json-schema'|'json-object'|'prompt-only'

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
function openAIResponseText(data: OpenAIResponse): string | undefined {
  const choice = data.choices?.[0]
  return contentToText(choice?.message?.content) ?? contentToText(choice?.message?.reasoning_content) ?? contentToText(choice?.message?.reasoning) ?? choice?.text?.trim() ?? data.output_text?.trim()
}
function outputCapability(config: AIConfig, request: AIRequest): OutputCapability {
  if (!request.jsonMode) return 'prompt-only'
  const isOfficialOpenAI = /(^|\.)api\.openai\.com$/i.test(new URL(config.baseUrl).hostname)
  const hasKnownSchemaModel = /^(gpt-4o|gpt-4\.1|gpt-5)/i.test(config.model)
  if (request.jsonSchema && config.provider === 'openai-compatible' && isOfficialOpenAI && hasKnownSchemaModel) return 'json-schema'
  if (request.jsonMode === 'object') return 'json-object'
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

export async function callAI(config: AIConfig, apiKey: string, request: AIRequest): Promise<{ text: string; tokens?: number; finishReason?: string; truncated: boolean }> {
  const controller = new AbortController(); const timeout = globalThis.setTimeout(() => controller.abort(), (config.timeout ?? 45) * 1000)
  const forwardAbort = () => controller.abort(); request.signal?.addEventListener('abort', forwardAbort, { once: true })
  const capability = outputCapability(config, request)
  const baseContext = { provider:config.provider, model:config.model, baseUrl:config.baseUrl, requestedJsonMode:request.jsonMode ?? 'none', capability }
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
      return { text, tokens:data.usageMetadata?.totalTokenCount, finishReason, truncated }
    }
    const buildBody = (mode: OutputCapability) => ({ model:config.model, temperature:config.temperature ?? .4, max_tokens:config.maxTokens ?? 1600, messages:[{role:'system',content:request.system},{role:'user',content:request.prompt}], ...(mode === 'json-schema' && request.jsonSchema ? { response_format:{ type:'json_schema', json_schema:{ name:request.jsonSchema.name, strict:true, schema:request.jsonSchema.schema } } } : mode === 'json-object' ? { response_format:{type:'json_object'} } : {}) })
    let response = await fetch(endpoint(config), { method:'POST', headers:{'content-type':'application/json', Authorization:`Bearer ${apiKey}`}, signal:controller.signal, body:JSON.stringify(buildBody(capability)) })
    if (!response.ok && capability !== 'prompt-only' && isCompatibilityFailure(response.status)) {
      diagnostics('structured-output-fallback', { ...baseContext, httpStatus:response.status, reason:'response_format was rejected' })
      response = await fetch(endpoint(config), { method:'POST', headers:{'content-type':'application/json', Authorization:`Bearer ${apiKey}`}, signal:controller.signal, body:JSON.stringify(buildBody('prompt-only')) })
    }
    const data = await responseData(response, baseContext) as OpenAIResponse
    if (!response.ok) throw new AIClientError(mapHttp(response.status), errorMessage[mapHttp(response.status)])
    const finishReason = data.choices?.[0]?.finish_reason; const text = openAIResponseText(data); const truncated = finishReason === 'length'
    diagnostics('content-extracted', { ...baseContext, finishReason, tokenUsage:data.usage?.total_tokens, completionTokens:data.usage?.completion_tokens, truncated, rawContent:text })
    if (truncated) throw new AIClientError('TRUNCATED', errorMessage.TRUNCATED, finishReason)
    if (!text) throw new AIClientError('INVALID_RESPONSE', errorMessage.INVALID_RESPONSE, finishReason)
    return { text, tokens:data.usage?.total_tokens, finishReason, truncated }
  } catch (error) {
    if (error instanceof AIClientError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') throw new AIClientError('TIMEOUT', errorMessage.TIMEOUT)
    diagnostics('request-failed', { ...baseContext, error:error instanceof Error ? error.message : 'Unknown error' })
    throw new AIClientError('NETWORK_ERROR', errorMessage.NETWORK_ERROR)
  } finally { clearTimeout(timeout); request.signal?.removeEventListener('abort', forwardAbort) }
}
