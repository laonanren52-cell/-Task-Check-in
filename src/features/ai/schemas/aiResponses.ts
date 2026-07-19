import { z } from 'zod'

export const aiTaskPlanSchema = z.array(z.object({
  title: z.string().min(1).max(120), theme: z.string().optional(), subject: z.string().optional(), priority: z.enum(['P1', 'P2', 'P3']).default('P2'), plannedDuration: z.number().int().min(10).max(480), subtasks: z.array(z.string().min(1)).max(8).default([]), reason: z.string().min(1).max(300),
})).min(1).max(8)
export type AITaskPlan = z.infer<typeof aiTaskPlanSchema>

export const aiTaskBreakdownSchema = z.object({
  suitableForOneDay: z.boolean(), warning: z.string().optional(), steps: z.array(z.object({ title: z.string().min(1).max(140), estimatedMinutes: z.number().int().min(5).max(480), detail: z.string().max(300).optional() })).min(2).max(12),
})
export type AITaskBreakdown = z.infer<typeof aiTaskBreakdownSchema>

export const aiDailyInsightSchema = z.object({
  headline: z.string().min(1).max(240),
  positive: z.array(z.string().min(1)).max(2).default([]),
  adjustment: z.array(z.string().min(1)).max(2).default([]),
  tomorrowActions: z.array(z.string().min(1)).max(3).default([]),
  tone: z.enum(['steady', 'encouraging', 'gentle-adjustment', 'rest']).default('steady'),
})
export type AIDailyInsight = z.infer<typeof aiDailyInsightSchema>

export const aiReviewDraftSchema = z.object({ review: z.string().max(1000).optional(), overall: z.string().max(1000).optional(), achievement: z.string().max(700).default(''), problem: z.string().max(700).default(''), satisfaction: z.string().max(700).default(''), nextStep: z.string().max(500).default('') }).transform(value => ({ review:value.review ?? value.overall ?? '', achievement:value.achievement, problem:value.problem, satisfaction:value.satisfaction, nextStep:value.nextStep }))
export type AIReviewDraft = z.infer<typeof aiReviewDraftSchema>

const parseError = () => new Error('AI 返回格式异常，请重新生成。')

type ParserLog = Record<string, unknown>
const parserDebug = (event: string, details: ParserLog) => {
  if (import.meta.env.DEV) console.debug(`[SummerFlow AI parser] ${event}`, details)
  else console.warn(`[SummerFlow AI parser] ${event}`, { ...details, rawContent: undefined, candidate: undefined, parsed: undefined })
}

export class AIResponseParseError extends Error {
  constructor(public readonly diagnostics: { reason: 'no-json'|'invalid-json'|'schema'; issues?: z.core.$ZodIssue[] }) {
    super('AI 返回格式异常，请重新生成。')
  }
}

function balancedJsonAt(text: string, start: number): string | undefined {
  const opening = text[start]
  if (opening !== '{' && opening !== '[') return undefined

  const expectedClosers: string[] = [opening === '{' ? '}' : ']']
  let quote: '"' | "'" | undefined
  let escaped = false

  for (let index = start + 1; index < text.length; index += 1) {
    const character = text[index]
    if (quote) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = undefined
      continue
    }
    if (character === '"' || character === "'") { quote = character; continue }
    if (character === '{') expectedClosers.push('}')
    else if (character === '[') expectedClosers.push(']')
    else if (character === '}' || character === ']') {
      if (expectedClosers.at(-1) !== character) return undefined
      expectedClosers.pop()
      if (expectedClosers.length === 0) return text.slice(start, index + 1)
    }
  }
  return undefined
}

function jsonCandidates(text: string): string[] {
  const candidates: string[] = []
  const add = (candidate?: string) => {
    const normalized = candidate?.trim()
    if (normalized && !candidates.includes(normalized)) candidates.push(normalized)
  }

  const normalized = text.replace(/^\uFEFF/, '').trim()
  for (const match of normalized.matchAll(/```(?:json|JSON)?\s*([\s\S]*?)```/g)) add(match[1])
  for (let index = 0; index < normalized.length; index += 1) {
    if (normalized[index] === '{' || normalized[index] === '[') add(balancedJsonAt(normalized, index))
  }
  add(normalized)
  return candidates
}

function repairJson(candidate: string): string {
  return candidate
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/，(?=\s*[}\]])/g, ',')
    .replace(/,\s*([}\]])/g, '$1')
}

function parseCandidate(candidate: string): unknown {
  const parsed = JSON.parse(candidate)
  return typeof parsed === 'string' ? JSON.parse(parsed.trim()) : parsed
}

export class AIResponseParser {
  static parse<T>(text: string, schema: z.ZodType<T>, feature = 'structured'): T {
    const candidates = jsonCandidates(text)
    let sawJson = false
    let lastIssues: z.core.$ZodIssue[] | undefined
    parserDebug('received', { feature, rawContent: text, contentLength: text.length, candidateCount: candidates.length })
    for (const candidate of candidates) {
    for (const attempt of [candidate, repairJson(candidate)]) {
      try {
          const parsed = parseCandidate(attempt)
          sawJson = true
          const result = schema.safeParse(parsed)
          if (result.success) {
            parserDebug('validated', { feature, candidate: attempt, parsed })
            return result.data
          }
          lastIssues = result.error.issues
          parserDebug('zod-validation-failed', { feature, candidate: attempt, parsed, issues: result.error.issues })
        } catch (error) {
          parserDebug('json-parse-failed', { feature, candidate: attempt, error: error instanceof Error ? error.message : 'Unknown parse error' })
        }
      }
    }
    parserDebug('failed', { feature, rawContent: text, reason: sawJson ? 'schema' : candidates.length ? 'invalid-json' : 'no-json', issues: lastIssues })
    throw new AIResponseParseError({ reason: sawJson ? 'schema' : candidates.length ? 'invalid-json' : 'no-json', issues: lastIssues })
  }
}

export function parseAIJson<T>(text: string, schema: z.ZodType<T>, feature?: string): T {
  try { return AIResponseParser.parse(text, schema, feature) }
  catch (error) {
    if (error instanceof AIResponseParseError) throw error
    throw parseError()
  }
}
