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
  facts: z.array(z.string().min(1)).max(6), inferences: z.array(z.string().min(1)).max(5), suggestions: z.array(z.string().min(1)).max(5), summary: z.string().min(1).max(600),
})
export type AIDailyInsight = z.infer<typeof aiDailyInsightSchema>

export const aiReviewDraftSchema = z.object({ review: z.string().max(1000), achievement: z.string().max(700), problem: z.string().max(700), satisfaction: z.string().max(700), nextStep: z.string().max(500) })
export type AIReviewDraft = z.infer<typeof aiReviewDraftSchema>

const parseError = () => new Error('AI 返回格式异常，请重新生成。')

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

export function parseAIJson<T>(text: string, schema: z.ZodType<T>): T {
  const candidates = jsonCandidates(text)
  for (const candidate of candidates) {
    for (const attempt of [candidate, repairJson(candidate)]) {
      try {
        const result = schema.safeParse(parseCandidate(attempt))
        if (result.success) return result.data
      } catch {
        // Try the next JSON-shaped response before reporting a format error.
      }
    }
  }
  throw parseError()
}
