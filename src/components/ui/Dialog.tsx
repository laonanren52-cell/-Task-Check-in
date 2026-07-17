import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './Button'

type DialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
  children?: ReactNode
}

export function Dialog({ open, title, description, confirmLabel = '确认', danger = false, onConfirm, onClose, children }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', key)
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus())
    return () => { document.removeEventListener('keydown', key); previous?.focus() }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className="overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="dialog" ref={panel} role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1}>
        <button className="icon-button dialog__close" onClick={onClose} aria-label="关闭"><X /></button>
        <h2 id="dialog-title">{title}</h2>
        {description && <p>{description}</p>}
        {children && <div className="dialog__body">{children}</div>}
        <div className="dialog__actions"><Button variant="secondary" onClick={onClose}>取消</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></div>
      </div>
    </div>, document.body,
  )
}
