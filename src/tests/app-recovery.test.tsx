/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { isSafeMode } from '../app/safeMode'
import { RouteErrorBoundary } from '../components/ui/RouteErrorBoundary'

function BrokenRoute(): never {
  throw new Error('render-loop-regression')
}

describe('application recovery', () => {
  it('recognises the explicit non-destructive safe-mode flag only', () => {
    expect(isSafeMode('?safeMode=1')).toBe(true)
    expect(isSafeMode('?safeMode=0')).toBe(false)
    expect(isSafeMode('?date=2026-07-21')).toBe(false)
  })

  it('replaces the React Router default crash page with SummerFlow recovery actions', async () => {
    const router = createMemoryRouter([
      { path: '/', element: <BrokenRoute />, errorElement: <RouteErrorBoundary /> },
    ], { initialEntries: ['/'] })

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: 'SummerFlow 遇到了显示问题。' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '以安全模式打开' })).toBeInTheDocument()
    expect(screen.getByText('这不会清空或修改你的本地学习数据。可以先安全打开今天页面，继续查看、编辑和备份记录。')).toBeInTheDocument()
  })
})
