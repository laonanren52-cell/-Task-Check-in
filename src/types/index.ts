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

export interface BackupData {
  schemaVersion: number
  exportedAt: string
  settings: AppSettings
  themes: Theme[]
  subjects: Subject[]
  templates: TaskTemplate[]
  tasks: Task[]
  dailyRecords: DailyRecord[]
}
