import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { brl, formatDateKey, formatPhone, formatRelative, localDateKey, localTime } from '../lib/format.js'
import { StatusBadge } from './Bookings.jsx'
import { usePainel } from './PainelContext.jsx'

export default function Requests() {
  const { arena, bookings, pending, courtById, confirmAndNotify, openBooking } = usePainel()
  const [busyId, setBusyId] = useState(null)
  const [errors, setErrors] = useState({})
  const timeZone = arena.timezone

  const answered = bookings
    .filter(item => item.source === 'site' && item.status !== 'pendente')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 10)

  const confirm = async booking => {
    setBusyId(booking.id)
    setErrors(current => ({ ...current, [booking.id]: '' }))
    try {
      await confirmAndNotify(booking)
    } catch (error) {
      setErrors(current => ({ ...current, [booking.id]: error.message }))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="requests-layout">
      <section className="panel">
        <div className="section-head">
          <div><span className="kicker">AGUARDANDO SUA RESPOSTA</span><h2>Solicitações pendentes</h2></div>
          <span className="count">{pending.length}</span>
        </div>
        {pending.length ? (
          <div className="request-list">
            {[...pending].sort((a, b) => a.starts_at.localeCompare(b.starts_at)).map(item => (
              <article className="request-card" key={item.id}>
                <div className="request-when">
                  <span>{formatDateKey(localDateKey(item.starts_at, timeZone), { weekday: 'short', day: '2-digit', month: '2-digit' }).toUpperCase()}</span>
                  <strong>{localTime(item.starts_at, timeZone)}</strong>
                  <small>até {localTime(item.ends_at, timeZone)}</small>
                </div>
                <div className="request-info">
                  <strong>{item.customer_name}</strong>
                  <span>{formatPhone(item.phone)} · {item.people} pessoa{item.people > 1 ? 's' : ''}</span>
                  <span>{courtById[item.court_id]?.name} · {brl(item.price)} · recebida {formatRelative(item.created_at)}</span>
                  {errors[item.id] && <p className="form-message error" role="alert">{errors[item.id]}</p>}
                </div>
                <div className="request-actions">
                  <button className="confirm-button" disabled={busyId === item.id} onClick={() => confirm(item)}>
                    <Icon name="whatsapp" size={18}/> {busyId === item.id ? 'Confirmando…' : 'Confirmar reserva'}
                  </button>
                  <button className="secondary" onClick={() => openBooking(item)}>Detalhes</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty"><Icon name="check"/><strong>Nenhuma solicitação aguardando</strong><span>Quando alguém pedir um horário pela página da arena, ele aparece aqui na hora.</span></div>
        )}
      </section>

      <section className="panel">
        <div className="section-head"><div><span className="kicker">HISTÓRICO</span><h2>Respondidas recentemente</h2></div></div>
        {answered.length ? answered.map(item => (
          <button className="booking-row compact" key={item.id} onClick={() => openBooking(item)}>
            <div className="time"><strong>{localTime(item.starts_at, timeZone)}</strong><span>{formatDateKey(localDateKey(item.starts_at, timeZone), { day: '2-digit', month: '2-digit' })}</span></div>
            <div className="booking-info"><strong>{item.customer_name}</strong><span>{courtById[item.court_id]?.name}</span></div>
            <StatusBadge status={item.status}/>
          </button>
        )) : <div className="empty"><span>Nenhuma solicitação respondida ainda.</span></div>}
      </section>
    </div>
  )
}
