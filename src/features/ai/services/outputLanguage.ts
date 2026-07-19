import type { AIPreferences } from '../../../types'

export type ResolvedOutputLanguage = 'zh-CN' | 'en-US'

const preservedTerms = new Set(['ai','api','json','stm32','dcdc','python','pcb','gpio','adc','pwm','uart','c','p1','p2','p3'])

export function resolveOutputLanguage(preference?: Pick<AIPreferences, 'outputLanguage'>): ResolvedOutputLanguage {
  if (preference?.outputLanguage === 'en-US') return 'en-US'
  if (preference?.outputLanguage === 'zh-CN') return 'zh-CN'
  // SummerFlow currently ships a Simplified Chinese application shell.
  return 'zh-CN'
}

export function outputLanguageInstruction(language: ResolvedOutputLanguage): string {
  if (language === 'en-US') return 'Output-language requirement: except JSON field names, write all user-facing natural-language values in English. Preserve user-provided task names, project names, technical terms, and code verbatim. Do not translate them merely for style.'
  return '输出语言要求（最高优先级）：除 JSON 字段名外，所有面向用户的自然语言内容必须使用简体中文，包括标题、总结、事实描述、推断、原因、建议和操作说明。保留用户提供的任务名称、项目名称、专业术语和代码原文，不要为了翻译而改变其含义。不要中英文混杂，除非某个技术名词本身更适合保留英文。'
}

/** Ignores common technical tokens so STM32 / DCDC / Python do not trigger a false English warning. */
export function isLikelyWrongOutputLanguage(text: string, language: ResolvedOutputLanguage): boolean {
  const chineseCount = (text.match(/[\u3400-\u9fff]/g) ?? []).length
  const englishWords = (text.match(/[A-Za-z][A-Za-z-]{2,}/g) ?? []).filter(word => !preservedTerms.has(word.toLowerCase()))
  if (language === 'zh-CN') return chineseCount < 12 && englishWords.length >= 4
  return chineseCount >= 12 && chineseCount > englishWords.join('').length
}

export function languageCorrectionInstruction(language: ResolvedOutputLanguage, raw: string, json: boolean): { system:string; prompt:string } {
  const languageName = language === 'zh-CN' ? '简体中文' : 'English'
  return {
    system:`You are a constrained language-correction assistant. ${outputLanguageInstruction(language)}`,
    prompt:json
      ? `只修复语言，不得改变 JSON 字段、事实、数值、数组顺序或用户原文。将所有面向用户的自然语言值转换为 ${languageName}；不要增加新事实。只返回合法 JSON，不要 Markdown。原始 JSON：\n${raw}`
      : `只转换语言，不得增加、删减、概括或改写事实。将面向用户的自然语言转换为 ${languageName}，并保留用户原文与技术名词。原文：\n${raw}`,
  }
}
