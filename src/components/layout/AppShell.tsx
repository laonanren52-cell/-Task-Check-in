import { motion, useReducedMotion } from 'framer-motion'
import { BarChart3, CalendarDays, ClipboardList, Database, Plus, Settings, Sparkles, Sun } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TaskDrawer } from '../../features/tasks/TaskDrawer'
import { defaultSelectedDate } from '../../lib/date'
import { useAppStore } from '../../stores/appStore'
import { DesktopVersion } from '../../desktop/platform/DesktopVersion'
import { CopilotDrawer } from '../../features/ai/components/CopilotDrawer'
import { AIConsentDialog } from '../../features/ai/components/AIConsentDialog'

const items = [
  ['/today', '今日', Sun],
  ['/tasks', '任务', ClipboardList],
  ['/calendar', '月历', CalendarDays],
  ['/dashboard', '洞察', BarChart3],
  ['/settings', '设置', Settings],
] as const

export function AppShell() {
  const [adding, setAdding] = useState(false)
  const [copilot, setCopilot] = useState(false)
  const settings = useAppStore(state => state.settings)
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const initialDate = location.pathname === '/today'
    ? new URLSearchParams(location.search).get('date') ?? defaultSelectedDate(settings.startDate, settings.endDate)
    : defaultSelectedDate(settings.startDate, settings.endDate)

  return <main className="app-shell overflow-x-hidden w-full max-w-full">
    <aside className="sidebar">
      <button className="brand" onClick={() => navigate('/today')}><span>SF</span><span><b>夏序</b><small>SummerFlow</small></span></button>
      <nav>{items.map(([to, label, Icon]) => <NavLink to={to} key={to}><Icon />{label}</NavLink>)}</nav>
      <div className="storage-note"><Database /><span>数据保存在当前设备<br /><small>Local First · 自动保存</small><DesktopVersion /></span></div>
    </aside>
    <div className="workspace">
      <motion.div key={location.pathname} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}>
        <Outlet context={{ openNewTask: () => setAdding(true) }} />
      </motion.div>
    </div>
    <nav className="mobile-nav">{items.map(([to, label, Icon]) => <NavLink to={to} key={to}><Icon /><small>{label}</small></NavLink>)}</nav>
    <button className="floating-add" aria-label="新增任务" onClick={() => setAdding(true)}><Plus /></button>
    <button className="floating-copilot" aria-label="打开 AI 学习助手" onClick={() => setCopilot(true)}><Sparkles /><span>AI</span></button>
    {adding && <TaskDrawer initialDate={initialDate} onClose={() => setAdding(false)} />}
    {copilot && <CopilotDrawer onClose={() => setCopilot(false)} />}
    <AIConsentDialog />
  </main>
}
