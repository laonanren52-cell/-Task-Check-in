/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../components/ui/Toast'
import { TaskDrawer } from '../features/tasks/TaskDrawer'
import { useAppStore } from '../stores/appStore'
import type { Task } from '../types'

const task: Task = {
  id: 'task-1',
  date: '2026-07-18',
  themeId: 'theme-1',
  subjectId: 'subject-1',
  name: 'Focus regression task',
  detail: '',
  priority: 'P2',
  status: 'todo',
  plannedDuration: 60,
  actualDuration: 0,
  output: '',
  note: '',
  order: 1,
  createdAt: '2026-07-18T00:00:00.000Z',
  updatedAt: '2026-07-18T00:00:00.000Z',
}

function renderDrawer() {
  useAppStore.setState({
    ready: true,
    themes: [{ id: 'theme-1', name: 'Theme', color: '#55756b', icon: 'BookOpen', order: 1, createdAt: '', updatedAt: '' }],
    subjects: [{ id: 'subject-1', name: 'Subject', color: '#7890a0', order: 1, createdAt: '', updatedAt: '' }],
    templates: [],
    saveTask: vi.fn(async () => undefined),
  })

  render(
    <ToastProvider>
      <TaskDrawer task={task} onClose={vi.fn()} />
    </ToastProvider>,
  )
}

describe('TaskDrawer focus behavior', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('keeps textarea focus after continuous edits mark the form dirty', async () => {
    renderDrawer()
    const drawer = screen.getByRole('dialog')
    const textareas = document.querySelectorAll('textarea')
    const detail = textareas[0] as HTMLTextAreaElement
    const output = textareas[1] as HTMLTextAreaElement
    const note = textareas[2] as HTMLTextAreaElement
    const name = screen.getByDisplayValue('Focus regression task') as HTMLInputElement

    name.focus()
    fireEvent.change(name, { target: { value: 'Focus regression task 1234567890' } })
    await waitFor(() => expect(document.activeElement).toBe(name))

    detail.focus()
    fireEvent.compositionStart(detail)
    fireEvent.change(detail, { target: { value: 'zhong' } })
    fireEvent.compositionEnd(detail, { data: '中文' })
    fireEvent.change(detail, { target: { value: 'step s' } })
    fireEvent.change(detail, { target: { value: 'step summer 中文输入\nsecond line' } })
    await waitFor(() => expect(document.activeElement).toBe(detail))
    expect(detail).toHaveValue('step summer 中文输入\nsecond line')

    fireEvent.keyDown(detail, { key: 'Backspace' })
    await waitFor(() => expect(document.activeElement).toBe(detail))
    fireEvent.keyDown(detail, { key: 'a', ctrlKey: true })
    fireEvent.paste(detail, { clipboardData: { getData: () => 'pasted detail' } })
    fireEvent.change(detail, { target: { value: 'pasted detail\nnext line' } })
    await waitFor(() => expect(document.activeElement).toBe(detail))
    expect(detail).toHaveValue('pasted detail\nnext line')

    output.focus()
    fireEvent.change(output, { target: { value: 'result text pasted' } })
    await waitFor(() => expect(document.activeElement).toBe(output))

    note.focus()
    fireEvent.change(note, { target: { value: 'note line 1\nnote line 2' } })
    await waitFor(() => expect(document.activeElement).toBe(note))
    expect(screen.getByRole('dialog')).toBe(drawer)
  })
})
