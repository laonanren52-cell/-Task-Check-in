import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useToast } from '../../components/ui/Toast'
import { createId } from '../../lib/id'
import { useAppStore } from '../../stores/appStore'
import type { Priority, TaskTemplate } from '../../types'

const blank = { name: '', detail: '', themeId: '', subjectId: '', priority: 'P2' as Priority, plannedDuration: 60 }

export function TemplateManager() {
  const { templates, themes, subjects, saveTemplate, deleteTemplate } = useAppStore()
  const [value, setValue] = useState(blank)
  const [editing, setEditing] = useState<TaskTemplate>()
  const [deleting, setDeleting] = useState<TaskTemplate>()
  const toast = useToast()
  const save = async () => {
    if (!value.name.trim()) { toast('请输入模板名称', 'error'); return }
    const now = new Date().toISOString()
    await saveTemplate({ id: editing?.id ?? createId(), ...value, name: value.name.trim(), themeId: value.themeId || undefined, subjectId: value.subjectId || undefined, order: editing?.order ?? templates.length, createdAt: editing?.createdAt ?? now, updatedAt: now })
    setValue(blank); setEditing(undefined); toast('任务模板已保存')
  }
  const drop = async (from: string, to: string) => {
    const next = [...templates]
    const fromIndex = next.findIndex(item => item.id === from)
    const toIndex = next.findIndex(item => item.id === to)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    await Promise.all(next.map((item, order) => saveTemplate({ ...item, order, updatedAt: new Date().toISOString() })))
  }
  return <section className="settings-section template-manager">
    <header><div><h2>任务模板</h2><p>拖动排序；选择模板时自动填入名称、主题、科目、优先级和计划时长。</p></div></header>
    <div className="template-form">
      <input value={value.name} onChange={event => setValue({ ...value, name: event.target.value })} placeholder="模板名称" />
      <input value={value.detail} onChange={event => setValue({ ...value, detail: event.target.value })} placeholder="默认子任务" />
      <select value={value.themeId} onChange={event => setValue({ ...value, themeId: event.target.value })}><option value="">不绑定主题</option>{themes.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
      <select value={value.subjectId} onChange={event => setValue({ ...value, subjectId: event.target.value })}><option value="">不绑定科目</option>{subjects.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
      <select value={value.priority} onChange={event => setValue({ ...value, priority: event.target.value as Priority })}><option>P1</option><option>P2</option><option>P3</option></select>
      <input type="number" min="0" value={value.plannedDuration} onChange={event => setValue({ ...value, plannedDuration: Number(event.target.value) })} aria-label="计划时长" />
      <Button onClick={save}><Plus />{editing ? '保存修改' : '新增模板'}</Button>
    </div>
    <div className="settings-list">{templates.map(item => <div className="settings-row template-row" key={item.id} draggable onDragStart={event => event.dataTransfer.setData('text/plain', item.id)} onDragOver={event => event.preventDefault()} onDrop={event => drop(event.dataTransfer.getData('text/plain'), item.id)}>
      <GripVertical /><span><b>{item.name}</b><small>{item.priority} · {item.plannedDuration} 分钟</small></span>
      <button className="icon-button" onClick={() => { setEditing(item); setValue({ name: item.name, detail: item.detail, themeId: item.themeId ?? '', subjectId: item.subjectId ?? '', priority: item.priority, plannedDuration: item.plannedDuration }) }} aria-label={`编辑${item.name}`}><Pencil /></button>
      <button className="icon-button danger-text" onClick={() => setDeleting(item)} aria-label={`删除${item.name}`}><Trash2 /></button>
    </div>)}</div>
    <Dialog open={!!deleting} title={`删除“${deleting?.name ?? ''}”？`} description="删除模板不会影响已创建的任务，但该操作无法撤销。" confirmLabel="删除模板" danger onClose={() => setDeleting(undefined)} onConfirm={async () => { if (!deleting) return; await deleteTemplate(deleting.id); setDeleting(undefined); toast('模板已删除') }} />
  </section>
}
