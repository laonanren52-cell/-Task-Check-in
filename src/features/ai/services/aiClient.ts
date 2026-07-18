import type { AIConfig } from '../../../types'

export type AIClientErrorCode = 'NO_CONFIG'|'INVALID_KEY'|'MODEL_NOT_FOUND'|'NETWORK_ERROR'|'TIMEOUT'|'RATE_LIMIT'|'QUOTA_EXCEEDED'|'INVALID_RESPONSE'|'UNKNOWN'
export class AIClientError extends Error { constructor(public code: AIClientErrorCode, message: string, public detail?: string) { super(message) } }
export type AIRequest = { system: string; prompt: string; signal?: AbortSignal }

const errorMessage: Record<AIClientErrorCode, string> = { NO_CONFIG:'请先在“设置 > AI 模型”中配置可用模型。', INVALID_KEY:'API Key 无效或没有访问权限。', MODEL_NOT_FOUND:'找不到该模型，请检查模型名称。', NETWORK_ERROR:'无法连接到 AI 服务，请检查 Base URL 与网络。', TIMEOUT:'请求超时，请稍后重试或提高超时时间。', RATE_LIMIT:'请求过于频繁，请稍后再试。', QUOTA_EXCEEDED:'服务额度或配额不足，请检查服务商控制台。', INVALID_RESPONSE:'AI 返回格式异常，请重新生成。', UNKNOWN:'AI 服务暂时无法完成请求。' }
export const aiErrorText = (error: unknown) => error instanceof AIClientError ? error.message : error instanceof Error ? error.message : errorMessage.UNKNOWN

function endpoint(config: AIConfig) { const base = config.baseUrl.replace(/\/$/, ''); return /chat\/completions$/.test(base) ? base : `${base}/chat/completions` }
function mapHttp(status: number) { if (status === 401 || status === 403) return 'INVALID_KEY'; if (status === 404) return 'MODEL_NOT_FOUND'; if (status === 408 || status === 504) return 'TIMEOUT'; if (status === 429) return 'RATE_LIMIT'; if (status === 402) return 'QUOTA_EXCEEDED'; return 'UNKNOWN' as AIClientErrorCode }

type OpenAIContentPart = { text?: string | { value?: string }; content?: string }
type OpenAIMessage = { content?: string | OpenAIContentPart[]; reasoning_content?: string | OpenAIContentPart[] }

function contentToText(content: string | OpenAIContentPart[] | undefined): string | undefined {
  if (typeof content === 'string') return content.trim() || undefined
  if (!Array.isArray(content)) return undefined
  const text = content.map(part => {
    if (typeof part.text === 'string') return part.text
    if (typeof part.text === 'object') return part.text.value ?? ''
    return part.content ?? ''
  }).join('').trim()
  return text || undefined
}

function openAIResponseText(data: { choices?: Array<{ message?: OpenAIMessage; text?: string }>; output_text?: string }): string | undefined {
  const choice = data.choices?.[0]
  return contentToText(choice?.message?.content)
    ?? contentToText(choice?.message?.reasoning_content)
    ?? choice?.text?.trim()
    ?? data.output_text?.trim()
}

export async function callAI(config: AIConfig, apiKey: string, request: AIRequest): Promise<{ text: string; tokens?: number }> {
  const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), (config.timeout ?? 45) * 1000)
  const forwardAbort = () => controller.abort(); request.signal?.addEventListener('abort', forwardAbort, { once: true })
  try {
    if (config.provider === 'gemini') {
      const url = `${config.baseUrl.replace(/\/$/, '')}/models/${config.model}:generateContent?key=${encodeURIComponent(apiKey)}`
      const response = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, signal:controller.signal, body:JSON.stringify({ contents:[{ parts:[{ text:`${request.system}\n\n${request.prompt}` }] }], generationConfig:{ temperature:config.temperature ?? .4, maxOutputTokens:config.maxTokens ?? 1600 } }) })
      if (!response.ok) throw new AIClientError(mapHttp(response.status), errorMessage[mapHttp(response.status)])
      const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; usageMetadata?: { totalTokenCount?: number } }
      const text = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('')
      if (!text) throw new AIClientError('INVALID_RESPONSE', errorMessage.INVALID_RESPONSE)
      return { text, tokens:data.usageMetadata?.totalTokenCount }
    }
    const response = await fetch(endpoint(config), { method:'POST', headers:{'content-type':'application/json', Authorization:`Bearer ${apiKey}`}, signal:controller.signal, body:JSON.stringify({ model:config.model, temperature:config.temperature ?? .4, max_tokens:config.maxTokens ?? 1600, messages:[{role:'system',content:request.system},{role:'user',content:request.prompt}] }) })
    if (!response.ok) throw new AIClientError(mapHttp(response.status), errorMessage[mapHttp(response.status)])
    const data = await response.json() as { choices?: Array<{ message?: OpenAIMessage; text?: string }>; output_text?: string; usage?: { total_tokens?: number } }
    const text = openAIResponseText(data)
    if (!text) throw new AIClientError('INVALID_RESPONSE', errorMessage.INVALID_RESPONSE)
    return { text, tokens:data.usage?.total_tokens }
  } catch (error) {
    if (error instanceof AIClientError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') throw new AIClientError('TIMEOUT', errorMessage.TIMEOUT)
    throw new AIClientError('NETWORK_ERROR', errorMessage.NETWORK_ERROR)
  } finally { clearTimeout(timeout); request.signal?.removeEventListener('abort', forwardAbort) }
}
