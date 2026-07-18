import { Check, Copy, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { Dialog } from '../../components/ui/Dialog'
import { useToast } from '../../components/ui/Toast'
import { createId } from '../../lib/id'
import { useAppStore } from '../../stores/appStore'
import type { Task, TaskStatus } from '../../types'
import { PriorityIndicator, statusLabels } from './StatusBadge'
import { TaskDrawer } from './TaskDrawer'
import { AITaskBreakdownDrawer } from '../ai/components/AITaskBreakdownDrawer'

const statuses = Object.entries(statusLabels) as [TaskStatus, string][]

export function TaskList({ tasks, reorder = false }: { tasks: Task[]; reorder?: boolean }) {
  const { themes, subjects, saveTask, deleteTasks, reorderTasks } = useAppStore()
  const [editing, setEditing] = useState<Task>()
  const [deleting, setDeleting] = useState<Task>()
  const [breakingDown, setBreakingDown] = useState<Task>()
  const [activeMenu, setActiveMenu] = useState<string>()
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>()
  const menuRef = useRef<HTMLDivElement>(null)
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({})
  const toast = useToast()
  const theme = new Map(themes.map(item => [item.id, item.name]))
  const subject = new Map(subjects.map(item => [item.id, item.name]))
  const menuTask = tasks.find(task => task.id === activeMenu)

  const updateMenuPosition = () => {
    if (!activeMenu) return
    const rect = triggers.current[activeMenu]?.getBoundingClientRect()
    if (!rect) return
    setMenuPosition({ top: Math.min(window.innerHeight - 186, rect.bottom + 8), left: Math.max(12, Math.min(window.innerWidth - 172, rect.right - 160)) })
  }

  useEffect(() => {
    if (!activeMenu) return
    updateMenuPosition()
    const closeIfOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!menuRef.current?.contains(target) && !triggers.current[activeMenu]?.contains(target)) setActiveMenu(undefined)
    }
    document.addEventListener('pointerdown', closeIfOutside)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => { document.removeEventListener('pointerdown', closeIfOutside); window.removeEventListener('resize', updateMenuPosition); window.removeEventListener('scroll', updateMenuPosition, true) }
  }, [activeMenu])

  const changeStatus = async (task: Task, status: TaskStatus) => { await saveTask({ ...task, status, updatedAt: new Date().toISOString() }); toast(`任务已更新为${statusLabels[status]}`) }
  const complete = (task: Task) => changeStatus(task, task.status === 'done' ? 'todo' : 'done')
  const copy = async (task: Task) => { const now = new Date().toISOString(); await saveTask({ ...task, id: createId(), name: `${task.name}（副本）`, status: 'todo', order: Date.now(), createdAt: now, updatedAt: now }); toast('已复制任务') }
  const drop = async (from: string, to: string) => {
    if (from === to) return
    const next = [...tasks]; const fromIndex = next.findIndex(item => item.id === from); const toIndex = next.findIndex(item => item.id === to)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = next.splice(fromIndex, 1); next.splice(toIndex, 0, moved); await reorderTasks(next)
  }

  if (!tasks.length) return null
  return <div className="task-list">
    {tasks.map((task, index) => <article className={`task-card task-card--${task.priority.toLowerCase()}`} key={task.id} draggable={reorder} onDragStart={event => event.dataTransfer.setData('text/plain', task.id)} onDragOver={event => reorder && event.preventDefault()} onDrop={event => drop(event.dataTransfer.getData('text/plain'), task.id)} style={{ '--index': index } as React.CSSProperties}>
      {reorder && <GripVertical className="task-card__grip" aria-label="拖动排序" />}
      <button className={`task-check ${task.status === 'done' ? 'is-checked' : ''}`} onClick={() => complete(task)} aria-label={task.status === 'done' ? '取消完成' : '快速完成'}><Check /></button>
      <button className="task-card__body" onClick={() => setEditing(task)}>
        <div className="task-card__meta"><PriorityIndicator priority={task.priority} /><span>{theme.get(task.themeId) ?? '未分类'}</span><span>{subject.get(task.subjectId) ?? '未分类'}</span></div>
        <h3>{task.name}</h3><p>{task.detail || '尚未补充子任务'}</p>
        <div className="task-card__stats"><span>计划 {task.plannedDuration} 分钟</span><span>实际 {task.actualDuration} 分钟</span><span>专注 {task.focusScore ?? 0}</span><span>精力 {task.energyScore ?? 0}</span></div>
        {task.output && <div className="task-output">成果：{task.output}</div>}{task.note && <div className="task-note">备注：{task.note}</div>}
      </button>
      <div className="task-card__side"><select className={`quick-status badge--${task.status}`} value={task.status} onChange={event => changeStatus(task, event.target.value as TaskStatus)} aria-label={`修改“${task.name}”的状态`}>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button ref={element => { triggers.current[task.id] = element }} className="more-menu__trigger" aria-label="更多操作" aria-expanded={activeMenu === task.id} onClick={() => setActiveMenu(activeMenu === task.id ? undefined : task.id)}><MoreHorizontal /></button></div>
    </article>)}
    {activeMenu && menuTask && menuPosition && createPortal(<div className="more-menu__panel more-menu__panel--portal" ref={menuRef} role="menu" style={{ top: menuPosition.top, left: menuPosition.left }}><button onClick={() => { setEditing(menuTask); setActiveMenu(undefined) }}><Pencil />编辑</button><button onClick={() => { setBreakingDown(menuTask); setActiveMenu(undefined) }}><span className="menu-ai-mark">AI</span>AI 拆解任务</button><button onClick={() => { void copy(menuTask); setActiveMenu(undefined) }}><Copy />复制</button><button className="danger-text" onClick={() => { setDeleting(menuTask); setActiveMenu(undefined) }}><Trash2 />删除</button></div>, document.body)}
    {editing && <TaskDrawer task={editing} onClose={() => setEditing(undefined)} />}
    {breakingDown && <AITaskBreakdownDrawer task={breakingDown} onClose={() => setBreakingDown(undefined)} />}
    <Dialog open={!!deleting} title="删除这项任务？" description="删除后无法恢复，相关统计会立即更新。" confirmLabel="删除任务" danger onClose={() => setDeleting(undefined)} onConfirm={async () => { if (!deleting) return; await deleteTasks([deleting.id]); toast('任务已删除'); setDeleting(undefined) }}><p className="dialog__emphasis">{deleting?.name}</p></Dialog>
  </div>
}
