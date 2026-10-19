import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { ACTIVE_STATUSES, addDays, formatDateKey, localDateKey, localMinutes, localTime, minutesToTime, startOfWeek, timeToMinutes, todayKey, weekdayOf } from '../lib/format.js'
import { usePainel } from './PainelContext.jsx'

const HOUR_HEIGHT = 64
const SNAP_MINUTES = 30

export default function Agenda() {
  const { arena, courts, bookings, openBooking, openBookingForm } = usePainel()
  const timeZone = arena.timezone
  const today = todayKey(timeZone)
  const [day, setDay] = useState(today)
  const weekStart = startOfWeek(day)
  const weekdays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  const dayBookings = useMemo(
    () => bookings.filter(item => ACTIVE_STATUSES.includes(item.status) && localDateKey(item.starts_at, timeZone) === day),
    [bookings, day, timeZone],
  )

  const countByDay = useMemo(() => {
    const counts = {}
    bookings.forEach(item => {
      if (!ACTIVE_STATUSES.includes(item.status)) return
      const key = localDateKey(item.starts_at, timeZone)
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [bookings, timeZone])

  const weekday = weekdayOf(day)
  const columns = courts.filter(court => court.active || dayBookings.some(item => item.court_id === court.id))

  // Faixa de horas exibida: funcionamento do dia + qualquer reserva fora dele.
  const { startHour, endHour } = useMemo(() => {
    const windows = columns.flatMap(court => court.hours.filter(row => row.weekday === weekday))
    const starts = [...windows.map(row => timeToMinutes(row.opens.slice(0, 5))), ...dayBookings.map(item => localMinutes(item.starts_at, timeZone))]
    const ends = [...windows.map(row => timeToMinutes(row.closes.slice(0, 5))), ...dayBookings.map(item => localMinutes(item.starts_at, timeZone) + (new Date(item.ends_at) - new Date(item.starts_at)) / 60000)]
    return {
      startHour: starts.length ? Math.floor(Math.min(...starts) / 60) : 7,
      endHour: ends.length ? Math.min(24, Math.ceil(Math.max(...ends) / 60)) : 23,
    }
  }, [columns, dayBookings, timeZone, weekday])

  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index)
  const toY = minutes => (minutes - startHour * 60) / 60 * HOUR_HEIGHT

  const createAt = (court, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const minutes = startHour * 60 + Math.floor((event.clientY - rect.top) / HOUR_HEIGHT * 60 / SNAP_MINUTES) * SNAP_MINUTES
    openBookingForm({ courtId: court.id, dateKey: day, time: minutesToTime(Math.min(minutes, 23 * 60 + 30)) })
  }

  return (
    <section className="panel calendar-panel">
      <div className="section-head agenda-head">
        <div>
          <span className="kicker">{formatDateKey(day, { weekday: 'long' }).toUpperCase()}</span>
          <h2>{formatDateKey(day, { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="agenda-nav">
          <button className="icon-button" onClick={() => setDay(addDays(day, -7))} aria-label="Semana anterior"><Icon name="back" size={18}/></button>
          <button className="secondary" onClick={() => setDay(today)} disabled={day === today}>Hoje</button>
          <button className="icon-button" onClick={() => setDay(addDays(day, 7))} aria-label="Próxima semana"><Icon name="arrow" size={18}/></button>
          <div className="legend"><span><i className="confirmed"></i>Confirmada</span><span><i className="pending"></i>Pendente</span></div>
        </div>
      </div>

      <div className="week-strip" role="tablist" aria-label="Dias da semana">
        {weekdays.map(key => (
          <button key={key} role="tab" aria-selected={key === day} className={`${key === day ? 'active' : ''} ${key === today ? 'is-today' : ''}`} onClick={() => setDay(key)}>
            <span>{formatDateKey(key, { weekday: 'short' }).replace('.', '').toUpperCase()}</span>
            <strong>{key.slice(8)}</strong>
            <small>{countByDay[key] ? `${countByDay[key]} reserva${countByDay[key] > 1 ? 's' : ''}` : '—'}</small>
          </button>
        ))}
      </div>

      {columns.length ? (
        <div className="day-grid-wrap">
          <div className="day-grid" style={{ gridTemplateColumns: `60px repeat(${columns.length}, minmax(150px, 1fr))` }}>
            <div className="day-corner">HORA</div>
            {columns.map(court => (
              <div className="court-head" key={court.id}><i style={{ background: court.color }}></i>{court.name}</div>
            ))}

            <div className="hour-axis" style={{ height: hours.length * HOUR_HEIGHT }}>
              {hours.map(hour => <span key={hour} style={{ top: toY(hour * 60) }}>{String(hour).padStart(2, '0')}:00</span>)}
            </div>

            {columns.map(court => (
              <div
                key={court.id}
                className="court-column"
                style={{ height: hours.length * HOUR_HEIGHT, backgroundSize: `100% ${HOUR_HEIGHT}px` }}
                onClick={event => createAt(court, event)}
                title="Clique para lançar uma reserva"
              >
                {court.hours.filter(row => row.weekday === weekday).map(row => (
                  <span key={row.id} className="open-window" style={{ top: toY(timeToMinutes(row.opens.slice(0, 5))), height: toY(timeToMinutes(row.closes.slice(0, 5))) - toY(timeToMinutes(row.opens.slice(0, 5))) }}></span>
                ))}
                {dayBookings.filter(item => item.court_id === court.id).map(item => {
                  const start = localMinutes(item.starts_at, timeZone)
                  const length = (new Date(item.ends_at) - new Date(item.starts_at)) / 60000
                  return (
                    <button
                      key={item.id}
                      className={`agenda-booking ${item.status}`}
                      style={{ top: toY(start) + 2, height: Math.max(length / 60 * HOUR_HEIGHT - 4, 26) }}
                      onClick={event => { event.stopPropagation(); openBooking(item) }}
                    >
                      <strong>{item.customer_name}</strong>
                      <span>{localTime(item.starts_at, timeZone)}–{localTime(item.ends_at, timeZone)} · {item.people}p</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty"><Icon name="calendar"/><strong>Nenhuma quadra ativa</strong><span>Cadastre ou ative quadras em “Arena e quadras”.</span></div>
      )}
    </section>
  )
}
