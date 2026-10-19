import { useMemo } from 'react'
import { Link } from 'react-router'
import Icon from '../components/Icon.jsx'
import { ACTIVE_STATUSES, addDays, brl, formatDateKey, formatRelative, localDateKey, localTime, startOfWeek, timeToMinutes, todayKey, weekdayOf } from '../lib/format.js'
import { StatusBadge } from './Bookings.jsx'
import { usePainel } from './PainelContext.jsx'

const durationMinutes = booking => (new Date(booking.ends_at) - new Date(booking.starts_at)) / 60000

export function openMinutes(courts, dateKey) {
  const weekday = weekdayOf(dateKey)
  return courts
    .filter(court => court.active)
    .flatMap(court => court.hours.filter(row => row.weekday === weekday))
    .reduce((sum, row) => sum + timeToMinutes(row.closes.slice(0, 5)) - timeToMinutes(row.opens.slice(0, 5)), 0)
}

export default function Dashboard() {
  const { arena, courts, courtById, bookings, pending, openBooking } = usePainel()
  const timeZone = arena.timezone
  const today = todayKey(timeZone)
  const now = new Date()

  const stats = useMemo(() => {
    const active = bookings.filter(item => ACTIVE_STATUSES.includes(item.status))
    const todays = active.filter(item => localDateKey(item.starts_at, timeZone) === today)
    const confirmedToday = todays.filter(item => item.status === 'confirmada')
    const available = openMinutes(courts, today)
    const booked = todays.reduce((sum, item) => sum + durationMinutes(item), 0)
    const weekStart = startOfWeek(today)
    const week = Array.from({ length: 7 }, (_, index) => {
      const dateKey = addDays(weekStart, index)
      const total = active
        .filter(item => item.status === 'confirmada' && localDateKey(item.starts_at, timeZone) === dateKey)
        .reduce((sum, item) => sum + Number(item.price), 0)
      return { dateKey, total }
    })
    return {
      todays,
      confirmedToday: confirmedToday.length,
      revenueToday: confirmedToday.reduce((sum, item) => sum + Number(item.price), 0),
      occupancy: available ? Math.min(100, Math.round(booked / available * 100)) : null,
      next: todays.find(item => new Date(item.ends_at) > now),
      week,
    }
  }, [bookings, courts, timeZone, today])

  const activeCourts = courts.filter(court => court.active).length
  const weekMax = Math.max(...stats.week.map(day => day.total), 1)
  const weekTotal = stats.week.reduce((sum, day) => sum + day.total, 0)
  const next = stats.next

  return (
    <>
      <div className="date-strip">
        <div><span>{formatDateKey(today, { weekday: 'long' }).toUpperCase()}</span><strong>{formatDateKey(today, { day: 'numeric', month: 'long' }).toUpperCase()}</strong></div>
        <p><span className="live-dot"></span> Atualização em tempo real</p>
      </div>

      {!courts.length && (
        <div className="setup-banner">
          <div><strong>Comece cadastrando suas quadras</strong><span>Defina preços e horários de funcionamento para liberar as reservas na sua página.</span></div>
          <Link className="primary" to="/painel/configuracoes">Configurar quadras</Link>
        </div>
      )}

      <section className="arena-pulse">
        <div className="pulse-art" aria-hidden="true"><span className="sun-disc"></span><i className="wave-line one"></i><i className="wave-line two"></i><b>VIVA</b></div>
        <div className="pulse-copy">
          <span className="light-kicker">PRÓXIMO JOGO</span>
          <h2>{next ? localTime(next.starts_at, timeZone) : '--:--'} <small>— {next ? localTime(next.ends_at, timeZone) : '--:--'}</small></h2>
          <p>{next ? `${next.customer_name} · ${courtById[next.court_id]?.name || 'Quadra'} · ${next.people} pessoa${next.people > 1 ? 's' : ''}${next.status === 'pendente' ? ' · aguardando confirmação' : ''}` : 'Sem mais reservas para hoje.'}</p>
          {next ? <button onClick={() => openBooking(next)}>Ver reserva <Icon name="arrow" size={16}/></button> : <Link to="/painel/agenda">Abrir agenda <Icon name="arrow" size={16}/></Link>}
        </div>
        <div className="pulse-tag"><span>AGORA</span><strong>{activeCourts}</strong><small>quadra{activeCourts === 1 ? '' : 's'} ativa{activeCourts === 1 ? '' : 's'}</small></div>
      </section>

      <section className="metrics-grid">
        <Metric icon="calendar" label="RESERVAS HOJE" value={stats.todays.length} note={`${stats.confirmedToday} confirmada${stats.confirmedToday === 1 ? '' : 's'}`} accent="ocean"/>
        <Metric icon="inbox" label="SOLICITAÇÕES" value={pending.length} note={pending.length ? `Mais antiga ${formatRelative(pending.reduce((a, b) => (a.created_at < b.created_at ? a : b)).created_at)}` : 'Nenhuma aguardando'} accent="coral"/>
        <Metric icon="wallet" label="RECEITA CONFIRMADA HOJE" value={brl(stats.revenueToday)} note="Somente reservas confirmadas" accent="sun"/>
        <Metric icon="trend" label="OCUPAÇÃO HOJE" value={stats.occupancy === null ? '—' : `${stats.occupancy}%`} note={stats.occupancy === null ? 'Sem horário de funcionamento hoje' : 'Horas reservadas / horas abertas'} accent="navy"/>
      </section>

      <div className="dashboard-grid">
        <section className="panel schedule-panel">
          <div className="section-head">
            <div><span className="kicker">OPERAÇÃO DE HOJE</span><h2>Reservas do dia</h2></div>
            <Link className="text-button" to="/painel/agenda">Ver agenda <Icon name="arrow" size={17}/></Link>
          </div>
          <div className="booking-list">
            {stats.todays.length ? stats.todays.map(booking => (
              <button className="booking-row" key={booking.id} onClick={() => openBooking(booking)}>
                <div className="time"><strong>{localTime(booking.starts_at, timeZone)}</strong><span>{localTime(booking.ends_at, timeZone)}</span></div>
                <div className={`timeline-dot ${booking.status}`}></div>
                <div className="booking-info"><strong>{booking.customer_name}</strong><span>{courtById[booking.court_id]?.name} · {booking.people} pessoa{booking.people > 1 ? 's' : ''}</span></div>
                <StatusBadge status={booking.status}/>
                <strong className="price">{brl(booking.price)}</strong>
                <Icon name="arrow" size={18}/>
              </button>
            )) : <div className="empty"><Icon name="calendar"/><strong>Nenhuma reserva hoje</strong><span>As reservas confirmadas e pendentes aparecem aqui.</span></div>}
          </div>
        </section>

        <div className="widget-stack">
          <section className="panel requests-widget">
            <div className="section-head">
              <div><span className="kicker">PÁGINA DA ARENA</span><h2>Solicitações</h2></div>
              <Link className="text-button" to="/painel/solicitacoes">Ver todas <Icon name="arrow" size={17}/></Link>
            </div>
            {pending.length ? pending.slice(0, 4).map(item => (
              <button className="notification-item" key={item.id} onClick={() => openBooking(item)}>
                <i></i>
                <div><strong>{item.customer_name}</strong><span>{formatDateKey(localDateKey(item.starts_at, timeZone), { weekday: 'short', day: '2-digit', month: '2-digit' })} · {localTime(item.starts_at, timeZone)} · {courtById[item.court_id]?.name}</span></div>
                <Icon name="arrow" size={16}/>
              </button>
            )) : <div className="notifications-empty"><Icon name="check"/><strong>Tudo em dia</strong><span>Nenhuma solicitação aguardando.</span></div>}
          </section>

          <section className="panel mini-chart-panel">
            <div className="mini-chart-head"><div><span className="kicker">RECEITA CONFIRMADA DA SEMANA</span><h2>{brl(weekTotal)}</h2></div></div>
            <div className="spark-bars">
              {stats.week.map(day => (
                <div key={day.dateKey} className={day.dateKey === today ? 'today' : ''} title={`${formatDateKey(day.dateKey, { weekday: 'long', day: '2-digit', month: '2-digit' })}: ${brl(day.total)}`}>
                  <span style={{ height: `${Math.max(day.total / weekMax * 100, day.total ? 4 : 0)}%` }}></span>
                  <small>{formatDateKey(day.dateKey, { weekday: 'short' }).replace('.', '').toUpperCase()}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function Metric({ icon, label, value, note, accent }) {
  return (
    <article className={`metric metric-${accent}`}>
      <div className="metric-icon"><Icon name={icon} size={19}/></div>
      <div className="metric-copy"><span>{label}</span><strong>{value}</strong><p>{note}</p></div>
    </article>
  )
}
