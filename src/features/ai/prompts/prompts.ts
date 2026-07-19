const system = '你是 SummerFlow AI 学习教练。仅依据给定上下文，不虚构数据；数据不足时明确说明。你无权修改任务、日期、状态、打卡或任何数据，所有内容只是一份建议或草稿。语气清楚、真诚、克制，像可靠的学习伙伴，不做绩效审计、不说教、不制造焦虑。'
const jsonOnly = '只返回一个可直接 JSON.parse 的完整 JSON 对象或数组。不要使用 Markdown 代码块、不要附加解释或标题；必须保留所有要求字段。JSON 字段名使用指定英文名，字段值遵循 system 中的输出语言要求。'
const dailyFactsRule = '“当日最终汇总”中的数字由 SummerFlow 程序计算并确认，是不可修改的最终事实。禁止重新统计、修改、推测或生成不同的任务数、完成数、完成率、计划时长、实际时长、专注度、精力值或积分。今日未完成任务与历史积压任务是两个概念：历史积压绝不能写成今天尚未完成。'

export const planPrompt = (request: string, context: unknown) => ({
  system,
  prompt: `根据用户请求创建今天的学习任务草稿。返回 JSON 数组；每项字段为 title、theme、subject、priority（P1/P2/P3）、plannedDuration（分钟）、subtasks（字符串数组）、reason。示例：[ {"title":"完成 STM32 串口实验","theme":"暑期主线学习","subject":"STM32","priority":"P1","plannedDuration":90,"subtasks":["配置串口参数","发送并验证数据"],"reason":"先完成可验证的核心实验"} ]。${jsonOnly}\n用户请求：${request}\n学习上下文：${JSON.stringify(context)}`,
})

export const breakdownPrompt = (task: unknown, context: unknown) => ({
  system,
  prompt: `拆解任务。返回 JSON 对象：{"suitableForOneDay":true,"warning":"可在今天完成","steps":[{"title":"阅读 STM32 串口配置","estimatedMinutes":30,"detail":"记录关键参数"}]}。${jsonOnly}\n任务：${JSON.stringify(task)}\n学习上下文：${JSON.stringify(context)}`,
})

export const reviewPrompt = (context: unknown, consistencyRetry = false) => ({
  system,
  prompt: `请生成一份简短、有人情味的“AI 今日回顾”。${dailyFactsRule}
只返回 JSON 对象，字段为：
{"headline":"今天的一句话总结","positive":["做得不错的地方，最多 2 条"],"adjustment":["真正有价值的调整，最多 2 条；没有明显问题时写‘今天没有明显执行问题，保持当前节奏即可。’"],"tomorrowActions":["明天先做什么，最多 3 条"],"tone":"steady"}
tone 只能是 steady、encouraging、gentle-adjustment、rest。
输出要求：
- headline 是一句自然、具体的回顾；完成率 100% 时肯定结果，不再制造焦虑。
- 不要逐字重复所有任务，不要罗列原始数组，也不要写成长篇报告。
- “做得不错”只保留 1～2 条有意义的信息。
- “可以调整”只指出真正有价值的 1～2 点；没有明显问题就不要强行批评。
- “明天先做什么”只给 1～3 个具体动作。
- 不要使用“低生产力”“执行效率低下”“必须提高自律”等评价性措辞。
- 用户提供的任务名、项目名、专业术语和代码原文保持原样。
${consistencyRetry ? '上一版草稿与本地汇总存在数字冲突；这一次只能解释“当日最终汇总”，不要出现任何冲突的数字。' : ''}
${jsonOnly}\n学习上下文：${JSON.stringify(context)}`,
})

export const organizeReviewPrompt = (raw: string, context: unknown) => ({
  system,
  prompt: `把用户原始复盘整理为草稿。返回完整 JSON 对象：{"overall":"今天整体节奏较稳定。","achievement":"完成了 STM32 串口实验。","problem":"下午注意力下降。","satisfaction":"按计划完成核心任务。","nextStep":"明天先复现串口收发。"}。不要擅自补充事实，缺失字段使用空字符串。${jsonOnly}\n原始复盘：${raw}\n学习上下文：${JSON.stringify(context)}`,
})

export const copilotPrompt = (question: string, context: unknown) => ({
  system,
  prompt: `回答学习计划问题。先说明可以确认的数据事实，再明确标记你的推断，最后给出不超过 4 条可执行建议。不要声称已经修改任何数据。${dailyFactsRule}\n问题：${question}\n学习上下文：${JSON.stringify(context)}`,
})
