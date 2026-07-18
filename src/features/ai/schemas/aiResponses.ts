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

export function parseAIJson<T>(text: string, schema: z.ZodType<T>): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text
  const start = fenced.indexOf(fenced.trimStart().startsWith('[') ? '[' : '{')
  const end = Math.max(fenced.lastIndexOf(']'), fenced.lastIndexOf('}'))
  if (start < 0 || end < start) throw new Error('AI 返回格式异常，请重新生成。')
  const result = schema.safeParse(JSON.parse(fenced.slice(start, end + 1)))
  if (!result.success) throw new Error('AI 返回格式异常，请重新生成。')
  return result.data
}
