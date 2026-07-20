import { useMemo, useState } from 'react'
import { Check, ChevronDown, Sparkles } from 'lucide-react'
import type { DailyRecord } from '../../../types'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'
import { useAppStore } from '../../../stores/appStore'
import { canonicalSummarySourceHash, getCanonicalDailySummary } from '../../statistics/canonicalDailySummary'
import { aiDailyInsightSchema, aiReviewDraftSchema, parseAIJson, type AIDailyInsight, type AIReviewDraft } from '../schemas/aiResponses'
import { AIOutputLanguageError, currentAIContext, generateAI } from '../services/aiService'
import { AIDataConsistencyError, validateDailyInsightConsistency } from '../services/dailyInsightConsistency'
import { organizeReviewPrompt, reviewPrompt } from '../prompts/prompts'
import './aiReview.css'

type StoredInsight = { value: AIDailyInsight; sourceHash: string }
type RawResult = { mode: 'analysis' | 'organize'; text: string }

export function AIDailyReviewTools({ date, value, onApply }: { date: string; value: DailyRecord; onApply: (draft: Partial<DailyRecord>) => void }) {
  // Subscribe to each stable store reference separately. Returning a new object
  // from a Zustand selector makes React 19's useSyncExternalStore retry forever.
  const tasks = useAppStore(state => state.tasks)
  const dailyRecords = useAppStore(state => state.dailyRecords)
  const summary = useMemo(() => getCanonicalDailySummary(tasks, dailyRecords, date), [tasks, dailyRecords, date])
  const sourceHash = canonicalSummarySourceHash(summary, dailyRecords.find(record => record.date === date))
  const [insight, setInsight] = useState<StoredInsight>()
  const [draft, setDraft] = useState<AIReviewDraft>()
  const [rawResult, setRawResult] = useState<RawResult>()
  const [working, setWorking] = useState<'analysis' | 'organize'>()
  const [showContent, setShowContent] = useState(true)
  const [needsDurationConfirmation, setNeedsDurationConfirmation] = useState(false)
  const toast = useToast()
  const isStale = Boolean(insight && insight.sourceHash !== sourceHash)

  const createInsight = async (retryForConsistency = false) => {
    const text = await generateAI('review', reviewPrompt(currentAIContext(date), retryForConsistency), date)
    const parsed = parseAIJson(text, aiDailyInsightSchema, 'review')
    try {
      validateDailyInsightConsistency(parsed, summary)
    } catch (error) {
      if (!retryForConsistency) return createInsight(true)
      throw error
    }
    return { value: parsed, sourceHash }
  }

  const analyze = async (confirmed = false) => {
    if (summary.completedWithoutActualDurationCount > 0 && !confirmed) {
      setNeedsDurationConfirmation(true)
      return
    }
    setNeedsDurationConfirmation(false)
    setRawResult(undefined)
    setWorking('analysis')
    try {
      setInsight(await createInsight())
      setShowContent(true)
    } catch (error) {
      if (error instanceof AIOutputLanguageError) setRawResult({ mode: 'analysis', text: error.rawText })
      else if (error instanceof AIDataConsistencyError) toast('本地统计与 AI 文案不一致，已停止展示这次分析。请重新生成。', 'error')
      else toast(error instanceof Error ? error.message : '生成分析失败。', 'error')
    } finally { setWorking(undefined) }
  }

  const organize = async () => {
    const raw = [value.review, value.achievement, value.problem, value.satisfaction, value.nextStep].filter(Boolean).join('\n')
    if (!raw) { toast('先写下一点复盘内容，AI 才能帮你整理。', 'error'); return }
    setWorking('organize')
    try { setDraft(parseAIJson(await generateAI('organize-review', organizeReviewPrompt(raw, currentAIContext(date)), date), aiReviewDraftSchema, 'organize-review')) }
    catch (error) { toast(error instanceof Error ? error.message : '整理失败。', 'error') }
    finally { setWorking(undefined) }
  }

  const showRaw = () => {
    if (!rawResult) return
    if (rawResult.mode === 'analysis') setInsight({ value: parseAIJson(rawResult.text, aiDailyInsightSchema, 'review-raw'), sourceHash })
    else setDraft(parseAIJson(rawResult.text, aiReviewDraftSchema, 'organize-raw'))
    setRawResult(undefined)
  }

  return <section className="ai-review-tools">
    <div className="ai-review-tools__actions">
      <Button variant="secondary" disabled={!!working} onClick={() => void analyze()}><Sparkles />{working === 'analysis' ? '正在分析今天…' : 'AI 分析今天'}</Button>
      <Button variant="ghost" disabled={!!working} onClick={() => void organize()}>AI 帮我整理</Button>
    </div>
    {summary.completedWithoutActualDurationCount > 0 && <div className="ai-insight-notice">有 {summary.completedWithoutActualDurationCount} 项已完成任务还没有填写实际时长，分析中的时长判断可能不完整。</div>}
    {needsDurationConfirmation && <div className="ai-test-result is-error"><span>建议先补充实际时长；也可以继续按当前记录分析。</span><Button variant="ghost" onClick={() => void analyze(true)}>继续分析</Button></div>}
    {rawResult && <div className="ai-test-result is-error"><span>AI 返回语言与当前设置不一致，请重新生成。</span><Button variant="ghost" onClick={showRaw}>临时显示原始结果</Button></div>}
    {insight && <article className={`ai-insight ${isStale ? 'is-stale' : ''}`}>
      <header><div><span className="eyebrow">AI 今日回顾</span><h3>{insight.value.headline}</h3></div><Button variant="ghost" onClick={() => setShowContent(current => !current)}>{showContent ? '收起' : '展开'}<ChevronDown className={showContent ? 'is-open' : ''} /></Button></header>
      <div className="ai-insight__facts"><span>{summary.completedTaskCount} / {summary.taskCount} 项</span><span>{summary.completionRate}% 完成</span><span>{summary.actualMinutes} 分钟投入</span></div>
      {isStale && <div className="ai-insight-notice">任务数据已更新，当前分析可能已过期。<Button variant="ghost" onClick={() => void analyze(true)}>重新分析</Button></div>}
      {showContent && <div className="ai-insight__content">
        {insight.value.positive.length > 0 && <InsightGroup title="做得不错" items={insight.value.positive} />}
        {insight.value.adjustment.length > 0 && <InsightGroup title="可以调整" items={insight.value.adjustment} />}
        {insight.value.tomorrowActions.length > 0 && <InsightGroup title="明天先做什么" items={insight.value.tomorrowActions} ordered />}
      </div>}
      <footer><Button variant="ghost" disabled={!!working} onClick={() => void analyze(true)}><Sparkles />重新分析</Button></footer>
    </article>}
    {draft && <article className="ai-review-draft"><h3>AI 整理草稿</h3><p>{draft.review}</p><Button onClick={() => { onApply(draft); setDraft(undefined) }}><Check />应用到复盘</Button></article>}
  </section>
}

function InsightGroup({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? 'ol' : 'ul'
  return <div><b>{title}</b><List>{items.map(item => <li key={item}>{item}</li>)}</List></div>
}
