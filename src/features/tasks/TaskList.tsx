import { Check, Copy, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Dialog } from '../../components/ui/Dialog'
import { useToast } from '../../components/ui/Toast'
import { createId } from '../../lib/id'
import { useAppStore } from '../../stores/appStore'
import type { Task, TaskStatus } from '../../types'
import { PriorityIndicator, statusLabels } from './StatusBadge'
import { TaskDrawer } from './TaskDrawer'

const statuses = Object.entries(statusLabels) as [TaskStatus, string][]

export function TaskList({ tasks, reorder = false }: { tasks: Task[]; reorder?: boolean }) {
  const { themes, subjects, saveTask, deleteTasks, reorderTasks } = useAppStore()
  const [editing, setEditing] = useState<Task>()
  const [deleting, setDeleting] = useState<Task>()
  const [activeMenu, setActiveMenu] = useState<string>()
  const toast = useToast()
  const theme = new Map(themes.map(item => [item.id, item.name]))
  const subject = new Map(subjects.map(item => [item.id, item.name]))

  const changeStatus = async (task: Task, status: TaskStatus) => {
    await saveTask({ ...task, status, updatedAt: new Date().toISOString() })
    toast(`任务已更新为${statusLabels[status]}`)
  }
  const complete = (task: Task) => changeStatus(task, task.status === 'done' ? 'todo' : 'done')
  const copy = async (task: Task) => {
    const now = new Date().toISOString()
    await saveTask({ ...task, id: createId(), name: `${task.name}（副本）`, status: 'todo', order: Date.now(), createdAt: now, updatedAt: now })
    toast('已复制任务')
  }
  const drop = async (from: string, to: string) => {
    if (from === to) return
    const next = [...tasks]
    const fromIndex = next.findIndex(item => item.id === from)
    const toIndex = next.findIndex(item => item.id === to)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    await reorderTasks(next)
  }

  if (!tasks.length) return null
  return <div className="task-list">
    {tasks.map((task, index) => <article
      className={`task-card task-card--${task.priority.toLowerCase()} ${activeMenu === task.id ? 'is-menu-open' : ''}`}
      key={task.id}
      draggable={reorder}
      onDragStart={event => event.dataTransfer.setData('text/plain', task.id)}
      onDragOver={event => reorder && event.preventDefault()}
      onDrop={event => drop(event.dataTransfer.getData('text/plain'), task.id)}
      style={{ '--index': index } as React.CSSProperties}
    >
      {reorder && <GripVertical className="task-card__grip" aria-label="拖动排序" />}
      <button className={`task-check ${task.status === 'done' ? 'is-checked' : ''}`} onClick={() => complete(task)} aria-label={task.status === 'done' ? '取消完成' : '快速完成'}><Check /></button>
      <button className="task-card__body" onClick={() => setEditing(task)}>
        <div className="task-card__meta"><PriorityIndicator priority={task.priority} /><span>{theme.get(task.themeId) ?? '未分类'}</span><span>{subject.get(task.subjectId) ?? '未分类'}</span></div>
        <h3>{task.name}</h3>
        <p>{task.detail || '尚未补充子任务'}</p>
        <div className="task-card__stats"><span>计划 {task.plannedDuration} 分钟</span><span>实际 {task.actualDuration} 分钟</span><span>专注 {task.focusScore ?? 0}</span><span>精力 {task.energyScore ?? 0}</span></div>
        {task.output && <div className="task-output">成果：{task.output}</div>}
        {task.note && <div className="task-note">备注：{task.note}</div>}
      </button>
      <div className="task-card__side">
        <select className={`quick-status badge--${task.status}`} value={task.status} onChange={event => changeStatus(task, event.target.value as TaskStatus)} aria-label={`修改“${task.name}”的状态`}>
          {statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <div className="more-menu">
          <button className="more-menu__trigger" aria-label="更多操作" aria-expanded={activeMenu === task.id} onClick={() => setActiveMenu(activeMenu === task.id ? undefined : task.id)}><MoreHorizontal /></button>
          {activeMenu === task.id && <div className="more-menu__panel" role="menu"><button onClick={() => { setEditing(task); setActiveMenu(undefined) }}><Pencil />编辑</button><button onClick={() => { void copy(task); setActiveMenu(undefined) }}><Copy />复制</button><button className="danger-text" onClick={() => { setDeleting(task); setActiveMenu(undefined) }}><Trash2 />删除</button></div>}
        </div>
      </div>
    </article>)}
    {editing && <TaskDrawer task={editing} onClose={() => setEditing(undefined)} />}
    <Dialog open={!!deleting} title="删除这项任务？" description={deleting ? `“${deleting.name}”将被永久删除，统计会立即更新。` : ''} confirmLabel="删除任务" danger onClose={() => setDeleting(undefined)} onConfirm={async () => { if (!deleting) return; await deleteTasks([deleting.id]); toast('任务已删除'); setDeleting(undefined) }} />
  </div>
}
