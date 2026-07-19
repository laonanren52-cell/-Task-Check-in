import { Check, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'
import type { DailyRecord } from '../../../types'
import { organizeReviewPrompt, reviewPrompt } from '../prompts/prompts'
import { aiDailyInsightSchema, aiReviewDraftSchema, parseAIJson, type AIDailyInsight, type AIReviewDraft } from '../schemas/aiResponses'
import { AIOutputLanguageError, currentAIContext, generateAI } from '../services/aiService'

type RawResult = { mode:'analysis'|'organize'; text:string }

export function AIDailyReviewTools({ date, value, onApply }: { date:string; value:DailyRecord; onApply:(draft:Partial<DailyRecord>) => void }) {
  const [insight, setInsight] = useState<AIDailyInsight>()
  const [draft, setDraft] = useState<AIReviewDraft>()
  const [working, setWorking] = useState<'analysis'|'organize'>()
  const [rawResult, setRawResult] = useState<RawResult>()
  const toast = useToast()
  const analyze = async () => {
    setWorking('analysis'); setRawResult(undefined)
    try { setInsight(parseAIJson(await generateAI('review', reviewPrompt(currentAIContext(date)), date), aiDailyInsightSchema, 'review')) }
    catch (error) { if (error instanceof AIOutputLanguageError) setRawResult({ mode:'analysis', text:error.rawText }); else toast(error instanceof Error ? error.message : '分析失败。', 'error') }
    finally { setWorking(undefined) }
  }
  const organize = async () => {
    const raw = [value.review, value.achievement, value.problem, value.satisfaction, value.nextStep].filter(Boolean).join('\n')
    if (!raw) return toast('先写下一些原始复盘内容，AI 才能帮你整理。', 'error')
    setWorking('organize'); setRawResult(undefined)
    try { setDraft(parseAIJson(await generateAI('organize-review', organizeReviewPrompt(raw, currentAIContext(date)), date), aiReviewDraftSchema, 'organize-review')) }
    catch (error) { if (error instanceof AIOutputLanguageError) setRawResult({ mode:'organize', text:error.rawText }); else toast(error instanceof Error ? error.message : '整理失败。', 'error') }
    finally { setWorking(undefined) }
  }
  const showRaw = () => {
    if (!rawResult) return
    if (rawResult.mode === 'analysis') setInsight(parseAIJson(rawResult.text, aiDailyInsightSchema, 'review-raw'))
    else setDraft(parseAIJson(rawResult.text, aiReviewDraftSchema, 'organize-review-raw'))
    setRawResult(undefined)
  }
  return <section className="ai-review-tools"><div className="ai-review-tools__actions"><Button variant="secondary" disabled={!!working} onClick={analyze}><Sparkles/>{working === 'analysis' ? '正在分析今天…' : 'AI 分析今天'}</Button><Button variant="ghost" disabled={!!working} onClick={organize}>AI 帮我整理</Button></div>{rawResult && <div className="ai-test-result is-error"><span>AI 返回语言与当前设置不一致，请重新生成。</span><Button variant="ghost" onClick={showRaw}>临时显示原始结果</Button></div>}{insight && <article className="ai-insight"><h3>AI 复盘分析</h3><p>{insight.summary}</p><div><b>数据事实</b><ul>{insight.facts.map(item => <li key={item}>{item}</li>)}</ul></div><div><b>AI 推断</b><ul>{insight.inferences.map(item => <li key={item}>{item}</li>)}</ul></div><div><b>明日建议</b><ol>{insight.suggestions.map(item => <li key={item}>{item}</li>)}</ol></div></article>}{draft && <article className="ai-review-draft"><h3>AI 整理草稿</h3><p>{draft.review}</p><Button onClick={() => { onApply(draft); setDraft(undefined) }}><Check/>应用到复盘</Button></article>}</section>
}
