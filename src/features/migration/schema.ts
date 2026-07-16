import { z } from 'zod'

export const legacyTaskSchema = z.object({
  id:z.union([z.string(),z.number()]).optional(), date:z.string(), theme:z.string().optional().default('其他'), subject:z.string().optional().default('阅读 / 其他'),
  priority:z.string().optional().default('P2-重要'), name:z.string(), detail:z.string().optional().default(''), status:z.string().optional().default('进行中'),
  plan:z.coerce.number().optional().default(0), actual:z.coerce.number().optional().default(0), focus:z.coerce.number().optional().default(0), energy:z.coerce.number().optional().default(0),
  output:z.string().optional().default(''), note:z.string().optional().default('')
})

export const legacyDataSchema = z.object({
  settings:z.object({
    startDate:z.string().optional(), endDate:z.string().optional(), goalDays:z.coerce.number().optional(), goalHours:z.coerce.number().optional(),
    themes:z.array(z.string()).optional(), subjects:z.array(z.string()).optional(), templates:z.array(z.string()).optional()
  }).passthrough().optional().default({}),
  tasks:z.array(legacyTaskSchema).optional().default([]),
  checkins:z.record(z.string(),z.unknown()).optional().default({}),
  dailyNotes:z.record(z.string(),z.object({review:z.string().optional(),nextStep:z.string().optional()}).passthrough()).optional().default({})
})

export type LegacyData = z.infer<typeof legacyDataSchema>
