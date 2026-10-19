import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Fecha com Esc, mantém o foco dentro do diálogo e devolve o foco ao fechar.
function useDialog(close) {
  const ref = useRef(null)
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    const previous = document.activeElement
    const node = ref.current
    if (!node.contains(document.activeElement)) node.querySelector('[autofocus]')?.focus() || node.focus()

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current?.()
      }
      if (event.key !== 'Tab') return
      const items = [...node.querySelectorAll(FOCUSABLE)]
      if (!items.length) return
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [])

  return ref
}

const onBackdrop = close => event => event.target === event.currentTarget && close?.()

export function Modal({ close, label, className = 'modal', children }) {
  const ref = useDialog(close)
  return (
    <div className="modal-backdrop" onMouseDown={onBackdrop(close)}>
      <div ref={ref} className={className} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </div>
  )
}

export function Drawer({ close, label, className = '', children }) {
  const ref = useDialog(close)
  return (
    <div className="drawer-backdrop" onMouseDown={onBackdrop(close)}>
      <aside ref={ref} className={`detail-drawer ${className}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </aside>
    </div>
  )
}

export function ConfirmDialog({ title, description, confirmLabel, close, confirm, busy }) {
  return (
    <Modal close={close} label={title} className="confirm-dialog">
      <div className="warning-icon"><Icon name="trash"/></div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div>
        <button className="secondary" onClick={close} autoFocus>Voltar</button>
        <button className="danger-solid" onClick={confirm} disabled={busy}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}

export function CloseButton({ onClick, label = 'Fechar' }) {
  return <button type="button" onClick={onClick} aria-label={label}><Icon name="close"/></button>
}
