export type TaskStatus = 'todo' | 'doing' | 'done' | 'missed' | 'cancelled'
export type Priority = 'P1' | 'P2' | 'P3'

export interface AppSettings {
  id: 'app'
  startDate: string
  endDate: string
  goalDays: number
  goalStudyHours: number
  goalTaskCount: number
  dailyGoalMinutes: number
  weeklyGoalMinutes: number
  autoCheckUpdates: boolean
  updateChannel: 'stable'
  lastUpdateCheckAt?: string
  lastDesktopBackupAt?: string
  updatedAt: string
}

export interface Theme {
  id: string
  name: string
  color: string
  icon: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Subject {
  id: string
  name: string
  color: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface TaskTemplate {
  id: string
  name: string
  detail: string
  themeId?: string
  subjectId?: string
  priority: Priority
  plannedDuration: number
  order: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  date: string
  themeId: string
  subjectId: string
  templateId?: string
  name: string
  detail: string
  priority: Priority
  status: TaskStatus
  plannedDuration: number
  actualDuration: number
  focusScore?: number
  energyScore?: number
  output: string
  note: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface DailyRecord {
  date: string
  checkedIn: boolean
  checkinTime?: string
  isMakeup: boolean
  review: string
  nextStep: string
  achievement: string
  problem: string
  satisfaction: string
  mood?: number
  createdAt: string
  updatedAt: string
}

export interface AppMeta {
  key: 'meta'
  schemaVersion: number
  migratedFromLegacy: boolean
  migratedAt?: string
  onboardingCompleted: boolean
}

export type AIProvider = 'openai-compatible' | 'deepseek' | 'gemini' | 'custom'
export type AIFeature = 'planner' | 'breakdown' | 'review' | 'copilot' | 'organize-review'

/** Non-secret model metadata. API keys are deliberately kept out of IndexedDB. */
export interface AIConfig {
  id: string
  displayName: string
  provider: AIProvider
  baseUrl: string
  model: string
  enabled: boolean
  isDefault: boolean
  apiKeyHint?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
  streamEnabled?: boolean
  createdAt: string
  updatedAt: string
}

export interface AIPermissions {
  tasks: boolean
  durations: boolean
  focus: boolean
  reviews: boolean
  goals: boolean
  recentHistory: boolean
}

export interface AIPreferences {
  id: 'preferences'
  permissions: AIPermissions
  consentedAt?: string
  updatedAt: string
}

export interface AIUsageLog {
  id: string
  feature: AIFeature
  configId?: string
  createdAt: string
  success: boolean
  latencyMs?: number
  tokenUsage?: number
  errorCode?: string
}

export interface BackupData {
  schemaVersion: number
  exportedAt: string
  settings: AppSettings
  themes: Theme[]
  subjects: Subject[]
  templates: TaskTemplate[]
  tasks: Task[]
  dailyRecords: DailyRecord[]
  aiConfigs?: Array<Omit<AIConfig, 'apiKeyHint'> & { apiKey: null }>
  aiPreferences?: AIPreferences
}
