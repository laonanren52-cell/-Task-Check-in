import { Download, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import { tasksToCsv } from '../features/backup/csv'
import { emptyFilters, TaskFilters, type Filters } from '../features/tasks/TaskFilters'
import { PriorityIndicator, StatusBadge } from '../features/tasks/StatusBadge'
import { TaskDrawer } from '../features/tasks/TaskDrawer'
import { TaskList } from '../features/tasks/TaskList'
import { useAppStore } from '../stores/appStore'
import type { Task, TaskStatus } from '../types'

export function TasksPage() {
  const { tasks, themes, subjects, saveTask, deleteTasks } = useAppStore()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<Task>()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toast = useToast()
  const { openNewTask } = useOutletContext<{ openNewTask: () => void }>()
  const rows = useMemo(() => {
    const priority = { P1: 1, P2: 2, P3: 3 }
    return tasks.filter(task =>
      (!filters.date || task.date === filters.date)
      && (!filters.from || task.date >= filters.from)
      && (!filters.to || task.date <= filters.to)
      && (!filters.themeId || task.themeId === filters.themeId)
      && (!filters.subjectId || task.subjectId === filters.subjectId)
      && (!filters.priority || task.priority === filters.priority)
      && (!filters.status || task.status === filters.status)
      && (!filters.query || `${task.name} ${task.detail} ${task.output} ${task.note}`.toLowerCase().includes(filters.query.toLowerCase())),
    ).sort((a, b) => filters.sort === 'date-asc' ? a.date.localeCompare(b.date) : filters.sort === 'priority' ? priority[a.priority] - priority[b.priority] : filters.sort === 'updated' ? b.updatedAt.localeCompare(a.updatedAt) : b.date.localeCompare(a.date))
  }, [tasks, filters])
  const theme = new Map(themes.map(item => [item.id, item.name]))
  const subject = new Map(subjects.map(item => [item.id, item.name]))
  const changeStatus = async (status: TaskStatus) => {
    await Promise.all(tasks.filter(task => selected.includes(task.id)).map(task => saveTask({ ...task, status, updatedAt: new Date().toISOString() })))
    setSelected([]); toast('批量状态已更新')
  }
  const exportCsv = () => {
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(new Blob([tasksToCsv(rows, themes, subjects)], { type: 'text/csv;charset=utf-8' }))
    anchor.download = 'SummerFlow-任务明细.csv'; anchor.click(); URL.revokeObjectURL(anchor.href)
    toast(`已导出 ${rows.length} 项任务`)
  }

  return <div className="page">
    <PageHeader eyebrow="任务明细" title="全部投入，一处查清。" description="组合日期、主题、科目、优先级与状态筛选，批量整理学习记录。" actions={<><Button variant="secondary" onClick={exportCsv}><Download />导出 CSV</Button><Button onClick={openNewTask}><Plus />新增任务</Button></>} />
    <TaskFilters value={filters} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />
    {selected.length > 0 && <div className="batch-bar"><b>已选择 {selected.length} 项</b><select defaultValue="" onChange={event => event.target.value && changeStatus(event.target.value as TaskStatus)}><option value="">批量修改状态</option><option value="todo">待开始</option><option value="doing">进行中</option><option value="done">已完成</option><option value="missed">未完成</option><option value="cancelled">已取消</option></select><Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 />批量删除</Button></div>}
    {rows.length ? <>
      <div className="task-table">
        <div className="task-table__head"><input type="checkbox" aria-label="全选" checked={rows.every(task => selected.includes(task.id))} onChange={event => setSelected(event.target.checked ? rows.map(task => task.id) : [])} /><span>日期</span><span>任务</span><span>主题 / 科目</span><span>优先级</span><span>状态</span><span>投入 / 评分</span></div>
        {rows.map(task => <div className="task-table__row" key={task.id}>
          <input type="checkbox" aria-label={`选择${task.name}`} checked={selected.includes(task.id)} onChange={() => setSelected(current => current.includes(task.id) ? current.filter(id => id !== task.id) : [...current, task.id])} />
          <span>{task.date}</span>
          <button onClick={() => setEditing(task)}><b>{task.name}</b><small>{task.detail || '无子任务'} · {task.output || '无成果记录'}</small></button>
          <span>{theme.get(task.themeId) || '未分类'}<small>{subject.get(task.subjectId) || '未分类'}</small></span>
          <PriorityIndicator priority={task.priority} /><StatusBadge status={task.status} />
          <span>{task.actualDuration} / {task.plannedDuration} min<small>专注 {task.focusScore ?? 0} · 精力 {task.energyScore ?? 0}</small></span>
        </div>)}
      </div>
      <div className="mobile-task-results"><TaskList tasks={rows} /></div>
    </> : <EmptyState title="没有符合条件的任务" description="调整筛选条件，或添加第一项学习任务。" action={<Button onClick={openNewTask}><Plus />新增任务</Button>} />}
    {editing && <TaskDrawer task={editing} onClose={() => setEditing(undefined)} />}
    <Dialog open={confirmDelete} title={`删除 ${selected.length} 项任务？`} description="删除后统计会立即更新，且无法撤销。" danger confirmLabel="批量删除" onClose={() => setConfirmDelete(false)} onConfirm={async () => { await deleteTasks(selected); setSelected([]); setConfirmDelete(false); toast('所选任务已删除') }} />
  </div>
}
