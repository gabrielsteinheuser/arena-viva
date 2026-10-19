import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import Icon from '../components/Icon.jsx'
import SetupNotice from '../components/SetupNotice.jsx'
import * as api from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { addDays, brl, formatDateKey, formatPhone, isValidPhone, localTime, todayKey, weekdayOf, whatsappUrl } from '../lib/format.js'
import './landing.css'

const VISIBLE_DAYS = 14

export default function Landing({ slug: fixedSlug }) {
  const params = useParams()
  const slug = fixedSlug || params.slug
  const [arena, setArena] = useState(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    setArena(undefined)
    api.getPublicArena(slug).then(setArena).catch(err => setError(err.message))
  }, [slug])

  useEffect(() => {
    if (arena) document.title = `${arena.name} — Reserve sua quadra`
  }, [arena])

  if (!supabase) return <SetupNotice/>
  if (error) return <LpMessage title="Não foi possível carregar" text={error}/>
  if (arena === undefined) return <LpMessage title="Carregando…"/>
  if (!arena) return <LpMessage title="Arena não encontrada" text="Confira o endereço digitado."/>

  const minPrice = arena.courts.length ? Math.min(...arena.courts.map(court => Number(court.hourly_price))) : null
  const sports = [...new Set(arena.courts.flatMap(court => court.sports))]
  const mapsUrl = arena.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${arena.address} ${arena.city || ''}`)}` : null

  return (
    <div className="lp">
      <header className="lp-nav">
        <a className="lp-logo" href="#inicio"><span>{arena.name}</span></a>
        <nav>
          <a href="#quadras">Quadras</a>
          <a href="#local">Localização</a>
          <a className="lp-button small" href="#reservar">Reservar</a>
        </nav>
      </header>

      <section className="lp-hero" id="inicio">
        <div className="lp-hero-copy">
          {sports.length > 0 && <span className="lp-kicker">{sports.join(' · ').toUpperCase()}</span>}
          <h1>{arena.name}</h1>
          {arena.tagline && <p className="lp-tagline">{arena.tagline}</p>}
          <div className="lp-hero-actions">
            <a className="lp-button" href="#reservar">Solicitar reserva <Icon name="arrow" size={18}/></a>
            {arena.whatsapp && <a className="lp-button ghost" href={whatsappUrl(arena.whatsapp)} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18}/> Falar no WhatsApp</a>}
          </div>
          <ul className="lp-facts">
            <li><strong>{arena.courts.length}</strong><span>quadra{arena.courts.length === 1 ? '' : 's'}</span></li>
            {minPrice !== null && <li><strong>{brl(minPrice)}</strong><span>a partir de, por hora</span></li>}
            {arena.city && <li><strong><Icon name="pin" size={18}/></strong><span>{arena.city}</span></li>}
          </ul>
        </div>
        <div className="lp-hero-art" aria-hidden="true">
          <span className="lp-sun"></span>
          <i className="lp-wave one"></i><i className="lp-wave two"></i><i className="lp-wave three"></i>
        </div>
      </section>

      {arena.description && (
        <section className="lp-section lp-about">
          <span className="lp-kicker">SOBRE A ARENA</span>
          <p>{arena.description}</p>
        </section>
      )}

      <section className="lp-section" id="quadras">
        <span className="lp-kicker">ESTRUTURA</span>
        <h2>Nossas quadras</h2>
        <div className="lp-courts">
          {arena.courts.map(court => (
            <article key={court.id} style={{ '--court': court.color }}>
              <h3>{court.name}</h3>
              {court.surface && <p>{court.surface}</p>}
              {court.sports.length > 0 && <div className="lp-tags">{court.sports.map(sport => <span key={sport}>{sport}</span>)}</div>}
              <dl>
                <div><dt>Capacidade</dt><dd>até {court.capacity} pessoas</dd></div>
                <div><dt>Valor</dt><dd>{brl(court.hourly_price)}/h</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section lp-booking" id="reservar">
        <span className="lp-kicker">RESERVA ONLINE</span>
        <h2>Solicite seu horário</h2>
        <p className="lp-lead">Escolha a quadra, o dia e o horário. A arena confirma sua reserva pelo WhatsApp.</p>
        {arena.courts.length ? <BookingRequest arena={arena}/> : <p className="lp-lead">As reservas online ainda não estão disponíveis.</p>}
      </section>

      <section className="lp-section lp-location" id="local">
        <span className="lp-kicker">ONDE ESTAMOS</span>
        <h2>Venha jogar</h2>
        <div className="lp-contact">
          {arena.address && <a href={mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin"/><span><strong>{arena.address}</strong>{arena.city}</span></a>}
          {arena.whatsapp && <a href={whatsappUrl(arena.whatsapp)} target="_blank" rel="noreferrer"><Icon name="whatsapp"/><span><strong>WhatsApp</strong>{formatPhone(arena.whatsapp)}</span></a>}
          {arena.instagram && <a href={`https://instagram.com/${arena.instagram}`} target="_blank" rel="noreferrer"><Icon name="instagram"/><span><strong>Instagram</strong>@{arena.instagram}</span></a>}
        </div>
      </section>

      <footer className="lp-footer">© {new Date().getFullYear()} {arena.name} · Reservas por Arena Viva</footer>
    </div>
  )
}

function LpMessage({ title, text }) {
  return (
    <div className="lp lp-message">
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </div>
  )
}

function BookingRequest({ arena }) {
  const timeZone = arena.timezone
  const today = todayKey(timeZone)
  const days = useMemo(
    () => Array.from({ length: Math.min(VISIBLE_DAYS, arena.booking_window_days + 1) }, (_, index) => addDays(today, index)),
    [today, arena.booking_window_days],
  )

  const [courtId, setCourtId] = useState(arena.courts[0].id)
  const court = arena.courts.find(item => item.id === courtId)
  const openWeekdays = new Set(court.hours.map(row => row.weekday))
  const [day, setDay] = useState(() => days.find(key => openWeekdays.has(weekdayOf(key))) || today)
  const [slots, setSlots] = useState(null)
  const [slotsError, setSlotsError] = useState('')
  const [slot, setSlot] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', people: Math.min(2, court.capacity) })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const requestId = useRef(0)

  useEffect(() => {
    const id = ++requestId.current
    setSlots(null)
    setSlot(null)
    setSlotsError('')
    api.getAvailableSlots(courtId, day)
      .then(list => { if (id === requestId.current) setSlots(list) })
      .catch(err => { if (id === requestId.current) setSlotsError(err.message) })
  }, [courtId, day, reloadKey])

  const chooseCourt = id => {
    const next = arena.courts.find(item => item.id === id)
    const open = new Set(next.hours.map(row => row.weekday))
    setCourtId(id)
    if (!open.has(weekdayOf(day))) setDay(days.find(key => open.has(weekdayOf(key))) || day)
    setForm(current => ({ ...current, people: Math.min(current.people, next.capacity) }))
  }

  const submit = async event => {
    event.preventDefault()
    setError('')
    if (!slot) return setError('Escolha um horário.')
    if (!isValidPhone(form.phone)) return setError('Informe um WhatsApp válido com DDD.')
    setSubmitting(true)
    try {
      await api.requestBooking({ courtId, startsAt: slot.starts_at, name: form.name, phone: form.phone, people: form.people })
      setDone({ court, slot, people: form.people, name: form.name.trim().split(' ')[0] })
      requestAnimationFrame(() => document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' }))
    } catch (err) {
      setError(err.message)
      setReloadKey(key => key + 1)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="lp-card lp-success" role="status">
        <div className="lp-success-icon"><Icon name="check" size={30}/></div>
        <h3>Solicitação enviada, {done.name}!</h3>
        <p>
          {done.court.name} · {formatDateKey(day, { weekday: 'long', day: '2-digit', month: '2-digit' })} ·{' '}
          {localTime(done.slot.starts_at, timeZone)} às {localTime(done.slot.ends_at, timeZone)} · {done.people} pessoa{done.people > 1 ? 's' : ''}
        </p>
        <p className="lp-muted">O horário fica reservado para você enquanto a arena analisa. A confirmação chega pelo WhatsApp.</p>
        <button className="lp-button ghost dark" onClick={() => { setDone(null); setReloadKey(key => key + 1) }}>Fazer outra solicitação</button>
      </div>
    )
  }

  return (
    <form className="lp-card lp-form" onSubmit={submit}>
      <fieldset>
        <legend><b>1</b> Quadra</legend>
        <div className="lp-court-options">
          {arena.courts.map(item => (
            <label key={item.id} className={item.id === courtId ? 'selected' : ''} style={{ '--court': item.color }}>
              <input type="radio" name="court" value={item.id} checked={item.id === courtId} onChange={() => chooseCourt(item.id)}/>
              <strong>{item.name}</strong>
              <span>{brl(item.hourly_price)}/h · até {item.capacity} pessoas</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend><b>2</b> Dia</legend>
        <div className="lp-days">
          {days.map(key => {
            const closed = !openWeekdays.has(weekdayOf(key))
            return (
              <button type="button" key={key} disabled={closed} className={key === day ? 'selected' : ''} aria-pressed={key === day} onClick={() => setDay(key)}>
                <span>{key === today ? 'HOJE' : formatDateKey(key, { weekday: 'short' }).replace('.', '').toUpperCase()}</span>
                <strong>{key.slice(8)}</strong>
                <small>{formatDateKey(key, { month: 'short' }).replace('.', '')}</small>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend><b>3</b> Horário</legend>
        {slotsError ? <p className="lp-error">{slotsError}</p>
          : slots === null ? <p className="lp-muted">Buscando horários livres…</p>
            : slots.length ? (
              <div className="lp-slots">
                {slots.map(item => (
                  <button type="button" key={item.starts_at} className={slot?.starts_at === item.starts_at ? 'selected' : ''} aria-pressed={slot?.starts_at === item.starts_at} onClick={() => setSlot(item)}>
                    {localTime(item.starts_at, timeZone)}
                  </button>
                ))}
              </div>
            ) : <p className="lp-muted">Nenhum horário livre nesse dia. Tente outro dia ou outra quadra.</p>}
      </fieldset>

      <fieldset>
        <legend><b>4</b> Seus dados</legend>
        <div className="lp-fields">
          <label>Nome completo<input required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></label>
          <label>WhatsApp<input required inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={event => setForm({ ...form, phone: formatPhone(event.target.value) })}/></label>
          <label>Quantas pessoas?
            <div className="lp-stepper">
              <button type="button" onClick={() => setForm({ ...form, people: Math.max(1, form.people - 1) })} aria-label="Menos pessoas" disabled={form.people <= 1}>−</button>
              <output aria-live="polite">{form.people}</output>
              <button type="button" onClick={() => setForm({ ...form, people: Math.min(court.capacity, form.people + 1) })} aria-label="Mais pessoas" disabled={form.people >= court.capacity}>+</button>
            </div>
          </label>
        </div>
      </fieldset>

      <div className="lp-summary">
        <div>
          <span>{court.name} · {formatDateKey(day, { weekday: 'short', day: '2-digit', month: '2-digit' })}{slot ? ` · ${localTime(slot.starts_at, timeZone)}` : ''}</span>
          <strong>{slot ? brl(court.hourly_price * (new Date(slot.ends_at) - new Date(slot.starts_at)) / 3600000) : '—'}</strong>
        </div>
        <button className="lp-button" disabled={submitting || !slot}>{submitting ? 'Enviando…' : 'Enviar solicitação'}</button>
      </div>
      {error && <p className="lp-error" role="alert">{error}</p>}
    </form>
  )
}
