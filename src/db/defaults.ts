import { addDays, format } from 'date-fns'
import type { AIPreferences, AppMeta, AppSettings, Subject, TaskTemplate, Theme } from '../types'
import { stableId } from '../lib/id'

const now = () => new Date().toISOString()
const themeNames = ['暑期主线学习','嵌入式基础','硬件设计','电源学习','竞赛准备','数学建模','英语提升','专业课复习','个人项目','团队项目','资料整理','作品输出','面试准备','其他']
const subjectNames = ['STM32 / 嵌入式','模拟电路','数字电路','C语言','Python','电源 / DCDC','PCB / 原理图','数学建模','高等数学','线性代数','概率论','英语','通信原理','专业课','项目实践','阅读 / 其他']
const templateNames = ['完成 STM32 GPIO 与按键实验','完成 STM32 串口通信实验','完成 STM32 ADC 采集实验','学习 PWM 与电机控制','整理一个完整嵌入式项目','学习运算放大器基础','学习整流与滤波电路','学习 DCDC 基础原理','完成一张电源原理图','复习数字电路重点','完成 C 语言练习题','完成 Python 数据处理练习','学习数学建模算法','完成一道数学建模案例','英语阅读与单词复习','完成英语写作练习','推进比赛项目任务','阅读数据手册','整理今日学习笔记']
const colors = ['#4f7da0','#4c8c84','#7d83ac','#9a7c55','#637f9a','#6d8a70','#8b7094']

export const defaultSettings = (): AppSettings => {
  const start = new Date()
  return { id:'app', startDate:format(start,'yyyy-MM-dd'), endDate:format(addDays(start,46),'yyyy-MM-dd'), goalDays:44, goalStudyHours:140, goalTaskCount:88, dailyGoalMinutes:180, weeklyGoalMinutes:1260, autoCheckUpdates:true, updateChannel:'stable', updatedAt:now() }
}

export const defaultThemes = (): Theme[] => themeNames.map((name,order)=>({id:stableId('theme',name),name,color:colors[order%colors.length],icon:['BookOpen','Cpu','CircuitBoard','Zap','Trophy','Sigma','Languages'][order%7],order,createdAt:now(),updatedAt:now()}))
export const defaultSubjects = (): Subject[] => subjectNames.map((name,order)=>({id:stableId('subject',name),name,color:colors[(order+2)%colors.length],order,createdAt:now(),updatedAt:now()}))
export const defaultTemplates = (): TaskTemplate[] => templateNames.map((name,order)=>({id:stableId('template',name),name,detail:'',priority:'P2',plannedDuration:60,order,createdAt:now(),updatedAt:now()}))
export const defaultMeta = (): AppMeta => ({key:'meta',schemaVersion:4,migratedFromLegacy:false,onboardingCompleted:false})
export const defaultAIPreferences = (): AIPreferences => ({ id: 'preferences', permissions: { tasks: true, durations: true, focus: true, reviews: true, goals: true, recentHistory: true }, outputLanguage:'follow-app', updatedAt: now() })
