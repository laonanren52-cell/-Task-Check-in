import { ArchiveRestore, BookOpen, Bot, CircleHelp, FolderKanban, Goal, LayoutTemplate, RefreshCw, Save, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { BackupManager } from '../features/backup/BackupManager'
import { CategoryManager } from '../features/settings/CategoryManager'
import { TemplateManager } from '../features/settings/TemplateManager'
import { validateGoalRange } from '../features/settings/validation'
import { useAppStore } from '../stores/appStore'
import { DiagnosticsPanel } from '../desktop/platform/DiagnosticsPanel'
import { UpdateCenter } from '../desktop/updater/UpdateCenter'
import { AIModelSettings } from '../features/ai/components/AIModelSettings'

type SettingsSection = 'updates' | 'goals' | 'ai' | 'themes' | 'subjects' | 'templates' | 'data' | 'about'

const sections: Array<{ id: SettingsSection; label: string; detail: string; icon: typeof RefreshCw }> = [
  { id: 'updates', label: '软件更新', detail: '版本与自动更新', icon: RefreshCw },
  { id: 'goals', label: '暑期目标', detail: '给学习一个方向', icon: Goal },
  { id: 'ai', label: 'AI 模型', detail: '连接与切换你的模型', icon: Bot },
  { id: 'themes', label: '主题 / 项目', detail: '整理学习主线', icon: FolderKanban },
  { id: 'subjects', label: '学习科目', detail: '维护科目选项', icon: BookOpen },
  { id: 'templates', label: '任务模板', detail: '快速创建任务', icon: LayoutTemplate },
  { id: 'data', label: '数据与备份', detail: '导入、导出与恢复', icon: ArchiveRestore },
  { id: 'about', label: '关于与诊断', detail: '设备与版本信息', icon: CircleHelp },
]

export function SettingsPage() {
  const { settings, saveSettings } = useAppStore()
  const [value, setValue] = useState(settings)
  const [section, setSection] = useState<SettingsSection>('updates')
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => setValue(settings), [settings])

  const save = async () => {
    const issue = validateGoalRange(value.startDate, value.endDate, value.goalDays)
    if (issue) return setError(issue)
    setError('')
    await saveSettings({ ...value, updatedAt: new Date().toISOString() })
    toast('暑期目标已保存')
  }

  return <div className="page settings-page">
    <PageHeader eyebrow="自定义设置" title="把学习工作台调成自己的节奏。" description="常用配置在前，数据与危险操作收在后面；每一项修改都会自动保存在本机。" />
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="设置分区">
        <div className="settings-nav__label"><SlidersHorizontal /> 设置目录</div>
        {sections.map(item => {
          const Icon = item.icon
          return <button key={item.id} className={section === item.id ? 'is-active' : ''} onClick={() => setSection(item.id)}>
            <Icon /><span><b>{item.label}</b><small>{item.detail}</small></span>
          </button>
        })}
      </nav>

      <main className="settings-content">
        {section === 'updates' && <SettingsPanel title="软件更新" description="保持桌面端处于最新版本；更新包不会接触你的本地学习数据。"><UpdateCenter /></SettingsPanel>}
        {section === 'goals' && <SettingsPanel title="暑期目标" description="这些目标用于看板进度，不会自动创建任何任务或学习记录。">
          <div className="goals-grid">
            <label><span>开始日期</span><input type="date" value={value.startDate} onChange={event => setValue({ ...value, startDate: event.target.value })} /></label>
            <label><span>结束日期</span><input type="date" value={value.endDate} onChange={event => setValue({ ...value, endDate: event.target.value })} /></label>
            <label><span>目标打卡天数</span><input type="number" min="0" value={value.goalDays} onChange={event => setValue({ ...value, goalDays: Number(event.target.value) })} /></label>
            <label><span>目标学习时长（小时）</span><input type="number" min="0" value={value.goalStudyHours} onChange={event => setValue({ ...value, goalStudyHours: Number(event.target.value) })} /></label>
            <label><span>目标完成任务数</span><input type="number" min="0" value={value.goalTaskCount} onChange={event => setValue({ ...value, goalTaskCount: Number(event.target.value) })} /></label>
            <label><span>每日目标（分钟）</span><input type="number" min="0" value={value.dailyGoalMinutes} onChange={event => setValue({ ...value, dailyGoalMinutes: Number(event.target.value) })} /></label>
            <label><span>每周目标（分钟）</span><input type="number" min="0" value={value.weeklyGoalMinutes} onChange={event => setValue({ ...value, weeklyGoalMinutes: Number(event.target.value) })} /></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <Button onClick={save}><Save />保存目标</Button>
        </SettingsPanel>}
        {section === 'ai' && <SettingsPanel title="AI 模型" description="连接你自己的 AI 服务；SummerFlow 不绑定固定模型，你可以按任务自由切换。"><AIModelSettings /></SettingsPanel>}
        {section === 'themes' && <SettingsPanel title="主题 / 项目" description="这是任务的学习主线。拖动条目可以调整新增任务时的显示顺序。"><CategoryManager kind="theme" /></SettingsPanel>}
        {section === 'subjects' && <SettingsPanel title="学习科目" description="科目用于观察投入分布，也会作为任务表单中的可选项。"><CategoryManager kind="subject" /></SettingsPanel>}
        {section === 'templates' && <SettingsPanel title="任务模板" description="为高频学习动作预设内容；选用后仍然可以继续编辑。"><TemplateManager /></SettingsPanel>}
        {section === 'data' && <SettingsPanel title="数据与备份" description="数据默认只保存在此设备的 IndexedDB 中。导入前会校验文件，危险操作位于此处。"><BackupManager /></SettingsPanel>}
        {section === 'about' && <SettingsPanel title="关于与诊断" description="查看当前设备、桌面应用能力及版本诊断信息。"><DiagnosticsPanel /></SettingsPanel>}
      </main>
    </div>
  </div>
}

function SettingsPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="settings-panel">
    <header className="settings-panel__heading"><p className="eyebrow">设置</p><h2>{title}</h2><p>{description}</p></header>
    <div className="settings-panel__body">{children}</div>
  </section>
}
