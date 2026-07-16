import { BookOpen, CircuitBoard, Code2, Cpu, GripVertical, Languages, Pencil, Plus, Rocket, Trash2, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useToast } from '../../components/ui/Toast'
import { createId } from '../../lib/id'
import { useAppStore } from '../../stores/appStore'
import type { Subject, Theme } from '../../types'

const iconOptions = [
  ['BookOpen', '阅读'], ['Cpu', '芯片'], ['Code2', '编程'], ['CircuitBoard', '硬件'],
  ['Languages', '语言'], ['Trophy', '竞赛'], ['Rocket', '项目'], ['Users', '团队'],
] as const
const icons = { BookOpen, Cpu, Code2, CircuitBoard, Languages, Trophy, Rocket, Users }

export function CategoryManager({ kind }: { kind: 'theme' | 'subject' }) {
  const store = useAppStore()
  const items = kind === 'theme' ? store.themes : store.subjects
  const [editing, setEditing] = useState<Theme | Subject>()
  const [deleting, setDeleting] = useState<Theme | Subject>()
  const [replacement, setReplacement] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4f7da0')
  const [icon, setIcon] = useState('BookOpen')
  const toast = useToast()
  const references = deleting ? store.tasks.filter(task => kind === 'theme' ? task.themeId === deleting.id : task.subjectId === deleting.id).length : 0

  const resetEditor = () => { setName(''); setEditing(undefined); setIcon('BookOpen') }
  const save = async () => {
    if (!name.trim()) { toast('请输入分类名称', 'error'); return }
    const now = new Date().toISOString()
    if (kind === 'theme') {
      await store.saveTheme({ id: editing?.id ?? createId(), name: name.trim(), color, icon, order: editing?.order ?? items.length, createdAt: editing?.createdAt ?? now, updatedAt: now })
    } else {
      await store.saveSubject({ id: editing?.id ?? createId(), name: name.trim(), color, order: editing?.order ?? items.length, createdAt: editing?.createdAt ?? now, updatedAt: now })
    }
    resetEditor()
    toast(`${kind === 'theme' ? '主题' : '科目'}已保存`)
  }
  const startEdit = (item: Theme | Subject) => {
    setEditing(item); setName(item.name); setColor(item.color)
    if (kind === 'theme') setIcon((item as Theme).icon || 'BookOpen')
  }
  const drop = async (from: string, to: string) => {
    const next = [...items]
    const fromIndex = next.findIndex(item => item.id === from)
    const toIndex = next.findIndex(item => item.id === to)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    await Promise.all(next.map((item, order) => kind === 'theme'
      ? store.saveTheme({ ...item, order, updatedAt: new Date().toISOString() } as Theme)
      : store.saveSubject({ ...item, order, updatedAt: new Date().toISOString() } as Subject)))
  }
  const remove = async () => {
    if (!deleting) return
    if (references && !replacement) { toast('请先选择替代分类', 'error'); return }
    try {
      if (kind === 'theme') await store.deleteTheme(deleting.id, references ? replacement : undefined)
      else await store.deleteSubject(deleting.id, references ? replacement : undefined)
      toast('分类已删除'); setDeleting(undefined)
    } catch (error) { toast(error instanceof Error ? error.message : '删除失败', 'error') }
  }

  return <section className="settings-section">
    <header><div><h2>{kind === 'theme' ? '主题或项目' : '学习科目'}</h2><p>拖动排序，自定义名称{kind === 'theme' ? '、图标' : ''}和标识颜色。</p></div></header>
    <div className={`inline-editor ${kind === 'theme' ? 'has-icon' : ''}`}>
      <input value={name} onChange={event => setName(event.target.value)} placeholder={kind === 'theme' ? '例如：硬件设计' : '例如：DCDC'} />
      {kind === 'theme' && <select className="theme-icon-select" value={icon} onChange={event => setIcon(event.target.value)} aria-label="主题图标">{iconOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>}
      <input type="color" value={color} onChange={event => setColor(event.target.value)} aria-label="标识颜色" />
      <Button onClick={save}><Plus />{editing ? '保存修改' : '新增'}</Button>
      {editing && <Button variant="ghost" onClick={resetEditor}>取消</Button>}
    </div>
    <div className="settings-list">
      {items.map(item => {
        const Icon = kind === 'theme' ? icons[((item as Theme).icon || 'BookOpen') as keyof typeof icons] ?? BookOpen : undefined
        return <div className="settings-row" key={item.id} draggable onDragStart={event => event.dataTransfer.setData('text/plain', item.id)} onDragOver={event => event.preventDefault()} onDrop={event => drop(event.dataTransfer.getData('text/plain'), item.id)}>
          <GripVertical />{Icon ? <Icon style={{ color: item.color }} /> : <i style={{ background: item.color }} />}<span>{item.name}</span>
          <button className="icon-button" onClick={() => startEdit(item)} aria-label={`编辑${item.name}`}><Pencil /></button>
          <button className="icon-button danger-text" onClick={() => { setDeleting(item); setReplacement('') }} aria-label={`删除${item.name}`}><Trash2 /></button>
        </div>
      })}
    </div>
    <Dialog open={!!deleting} title={`删除“${deleting?.name ?? ''}”？`} description={references ? `它仍被 ${references} 项任务使用，请先选择替代${kind === 'theme' ? '主题' : '科目'}。` : '删除后无法撤销。'} confirmLabel="删除" danger onClose={() => setDeleting(undefined)} onConfirm={remove}>
      {references > 0 && <select value={replacement} onChange={event => setReplacement(event.target.value)}><option value="">选择替代分类</option>{items.filter(item => item.id !== deleting?.id).map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}
    </Dialog>
  </section>
}
