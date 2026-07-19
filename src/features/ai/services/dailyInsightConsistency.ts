import type { AIDailyInsight } from '../schemas/aiResponses'
import type { DailyCanonicalSummary } from '../../statistics/canonicalDailySummary'

export class AIDataConsistencyError extends Error {
  constructor(public readonly issues: string[]) {
    super('AI_DATA_CONSISTENCY_ERROR')
  }
}

const allText = (insight: AIDailyInsight) => [insight.headline, ...insight.positive, ...insight.adjustment, ...insight.tomorrowActions].join('\n')
const numberAfter = (text: string, expression: RegExp) => [...text.matchAll(expression)].map(match => Number(match[1]))

/** Rejects only explicit claims about today's canonical metrics, never future suggestions. */
export function validateDailyInsightConsistency(insight: AIDailyInsight, summary: DailyCanonicalSummary): void {
  const text = allText(insight)
  const issues: string[] = []
  const check = (label: string, values: number[], expected: number) => {
    if (values.some(value => value !== expected)) issues.push(`${label} 与本地汇总不一致`)
  }

  check('今日任务数', numberAfter(text, /(?:今天|今日)(?:的)?(?:计划|共有|共)?\s*(\d+)\s*项任务/g), summary.taskCount)
  check('已完成任务数', numberAfter(text, /(?:今天|今日)?(?:已|共)?完成\s*(\d+)\s*项任务/g), summary.completedTaskCount)
  check('今日未完成任务数', numberAfter(text, /(?:今天|今日)(?:还剩|剩余|未完成)\s*(\d+)\s*项/g), summary.unfinishedTaskCount)
  check('完成率', numberAfter(text, /完成率\s*(\d+)\s*%/g), summary.completionRate)
  check('计划时长', numberAfter(text, /(?:计划|预计)(?:总)?(?:投入|时长)?\s*(\d+)\s*分钟/g), summary.plannedMinutes)
  check('实际时长', numberAfter(text, /(?:实际|已经)(?:总)?(?:投入|学习|时长)?\s*(\d+)\s*分钟/g), summary.actualMinutes)

  if (issues.length) throw new AIDataConsistencyError([...new Set(issues)])
}
