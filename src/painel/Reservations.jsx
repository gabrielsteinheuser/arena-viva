import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { STATUS_LABELS, brl, formatDateKey, formatPhone, localDateKey, localTime, phoneDigits } from '../lib/format.js'
import { StatusBadge } from './Bookings.jsx'
import { usePainel } from './PainelContext.jsx'

const STATUS_FILTERS = ['todas', 'pendente', 'confirmada', 'recusada', 'cancelada']
const PERIODS = { proximas: 'Próximas', passadas: 'Passadas', todas: 'Todas' }

export const onActivate = action => event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

export default function Reservations() {
  const { arena, bookings, courtById, openBooking } = usePainel()
  const timeZone = arena.timezone
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('todas')
  const [period, setPeriod] = useState('proximas')

  const filtered = useMemo(() => {
    const now = new Date()
    const text = query.trim().toLowerCase()
    const digits = phoneDigits(query)
    const list = bookings.filter(item => {
      if (status !== 'todas' && item.status !== status) return false
      if (period === 'proximas' && new Date(item.ends_at) < now) return false
      if (period === 'passadas' && new Date(item.ends_at) >= now) return false
      if (!text) return true
      return `${item.customer_name} ${courtById[item.court_id]?.name || ''}`.toLowerCase().includes(text)
        || (digits.length >= 3 && item.phone?.includes(digits))
    })
    return period === 'passadas' ? list.reverse() : list
  }, [bookings, courtById, period, query, status])

  return (
    <section className="panel table-panel">
      <div className="section-head table-head">
        <div><span className="kicker">TODAS AS RESERVAS</span><h2>Reservas</h2></div>
        <label className="search">
          <Icon name="search" size={18}/>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente, telefone ou quadra" aria-label="Buscar reservas"/>
        </label>
      </div>
      <div className="filter-row">
        <div>
          {STATUS_FILTERS.map(item => (
            <button key={item} className={status === item ? 'active' : ''} aria-pressed={status === item} onClick={() => setStatus(item)}>
              {item === 'todas' ? 'Todas' : STATUS_LABELS[item]}
            </button>
          ))}
        </div>
        <div>
          <select className="period-select" value={period} onChange={event => setPeriod(event.target.value)} aria-label="Período">
            {Object.entries(PERIODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <span>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>DATA</th><th>HORÁRIO</th><th>CLIENTE</th><th>QUADRA</th><th>PESSOAS</th><th>STATUS</th><th>VALOR</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} tabIndex={0} onClick={() => openBooking(item)} onKeyDown={onActivate(() => openBooking(item))}>
                <td><strong>{formatDateKey(localDateKey(item.starts_at, timeZone), { day: '2-digit', month: '2-digit' })}</strong><small>{formatDateKey(localDateKey(item.starts_at, timeZone), { weekday: 'short' })}</small></td>
                <td><strong>{localTime(item.starts_at, timeZone)}</strong> — {localTime(item.ends_at, timeZone)}</td>
                <td><strong>{item.customer_name}</strong><small>{item.phone ? formatPhone(item.phone) : '—'}</small></td>
                <td>{courtById[item.court_id]?.name}</td>
                <td>{item.people}</td>
                <td><StatusBadge status={item.status}/></td>
                <td><strong>{brl(item.price)}</strong></td>
                <td><Icon name="arrow" size={17}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="empty"><Icon name="search"/><strong>Nenhuma reserva encontrada</strong><span>Tente mudar os filtros ou o período.</span></div>}
      </div>
    </section>
  )
}
