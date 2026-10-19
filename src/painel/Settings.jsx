import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { ConfirmDialog } from '../components/Overlay.jsx'
import * as api from '../lib/api.js'
import { TEMPLATE_VARIABLES, addDays, brl, confirmationMessage, formatPhone, phoneDigits, timeToMinutes, todayKey, zonedToUtc } from '../lib/format.js'
import { usePainel } from './PainelContext.jsx'

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const SLOT_OPTIONS = [30, 60, 90, 120]
const COURT_COLORS = ['#0d8f91', '#ed725e', '#e8ae3c', '#123f49', '#7c5cbf', '#3f9b5b']

export const DEFAULT_TEMPLATE = 'Olá, {nome}! Sua reserva na {arena} está confirmada ✅\n\n📅 {data}\n⏰ {horario}\n🏐 {quadra} · {pessoas} pessoa(s)\n💰 {valor}\n\nAté lá!'

export default function Settings() {
  return (
    <div className="settings-stack">
      <ArenaSection/>
      <TemplateSection/>
      <CourtsSection/>
    </div>
  )
}

function useSaving() {
  const [state, setState] = useState({ busy: false, error: '' })
  const run = async action => {
    setState({ busy: true, error: '' })
    try {
      await action()
      setState({ busy: false, error: '' })
      return true
    } catch (error) {
      setState({ busy: false, error: error.message })
      return false
    }
  }
  return [state, run]
}

function ArenaSection() {
  const { arena, setArena, notify } = usePainel()
  const [form, setForm] = useState(() => ({
    name: arena.name, tagline: arena.tagline || '', description: arena.description || '',
    address: arena.address || '', city: arena.city || '', whatsapp: arena.whatsapp ? formatPhone(arena.whatsapp) : '',
    instagram: arena.instagram || '', booking_window_days: arena.booking_window_days, min_notice_minutes: arena.min_notice_minutes,
  }))
  const [saving, save] = useSaving()
  const publicUrl = `${window.location.origin}/${arena.slug}`

  const change = event => {
    const { name, value } = event.target
    setForm({ ...form, [name]: name === 'whatsapp' ? formatPhone(value) : value })
  }

  const submit = event => {
    event.preventDefault()
    save(async () => {
      const updated = await api.updateArena(arena.id, {
        ...form,
        name: form.name.trim(),
        whatsapp: form.whatsapp ? phoneDigits(form.whatsapp) : null,
        instagram: form.instagram.replace(/^@/, '').trim() || null,
        booking_window_days: Number(form.booking_window_days),
        min_notice_minutes: Number(form.min_notice_minutes),
      })
      setArena(updated)
      notify('Dados da arena salvos.')
    })
  }

  return (
    <section className="panel settings-section">
      <div className="section-head">
        <div><span className="kicker">PÁGINA PÚBLICA</span><h2>Dados da arena</h2></div>
        <div className="public-link">
          <a href={`/${arena.slug}`} target="_blank" rel="noreferrer"><Icon name="link" size={16}/> {publicUrl.replace(/^https?:\/\//, '')}</a>
          <button className="text-button" onClick={() => navigator.clipboard?.writeText(publicUrl).then(() => notify('Link copiado.'))}>Copiar</button>
        </div>
      </div>
      <form className="settings-form" onSubmit={submit}>
        <label>Nome<input required maxLength={80} name="name" value={form.name} onChange={change}/></label>
        <label>Frase de destaque<input maxLength={140} name="tagline" value={form.tagline} onChange={change} placeholder="Ex.: Beach tennis com areia de verdade"/></label>
        <label className="wide">Sobre a arena<textarea rows={4} maxLength={2000} name="description" value={form.description} onChange={change} placeholder="Estrutura, diferenciais, regras…"/></label>
        <label>Endereço<input name="address" value={form.address} onChange={change}/></label>
        <label>Cidade<input name="city" value={form.city} onChange={change} placeholder="São Paulo — SP"/></label>
        <label>WhatsApp da arena<input name="whatsapp" inputMode="tel" value={form.whatsapp} onChange={change} placeholder="(11) 99999-9999"/></label>
        <label>Instagram<input name="instagram" value={form.instagram} onChange={change} placeholder="@suaarena"/></label>
        <label>Reservas abertas até (dias à frente)<input type="number" min="1" max="365" required name="booking_window_days" value={form.booking_window_days} onChange={change}/></label>
        <label>Antecedência mínima (minutos)<input type="number" min="0" max="10080" step="15" required name="min_notice_minutes" value={form.min_notice_minutes} onChange={change}/></label>
        {saving.error && <p className="form-message error wide" role="alert">{saving.error}</p>}
        <div className="form-actions"><button className="primary" disabled={saving.busy}>{saving.busy ? 'Salvando…' : 'Salvar dados'}</button></div>
      </form>
    </section>
  )
}

function TemplateSection() {
  const { arena, setArena, courts, notify } = usePainel()
  const [template, setTemplate] = useState(arena.confirmation_template)
  const [saving, save] = useSaving()
  const textarea = useRef(null)

  const sampleStart = zonedToUtc(addDays(todayKey(arena.timezone), 1), '19:00', arena.timezone)
  const preview = confirmationMessage({
    arena: { ...arena, confirmation_template: template },
    court: courts[0] || { name: 'Quadra 01' },
    booking: {
      customer_name: 'Marina Duarte', people: 4, price: courts[0]?.hourly_price || 90,
      starts_at: sampleStart.toISOString(), ends_at: new Date(sampleStart.getTime() + 3600000).toISOString(),
    },
  })

  const insert = variable => {
    const node = textarea.current
    const token = `{${variable}}`
    const start = node.selectionStart ?? template.length
    const end = node.selectionEnd ?? template.length
    setTemplate(template.slice(0, start) + token + template.slice(end))
    requestAnimationFrame(() => { node.focus(); node.setSelectionRange(start + token.length, start + token.length) })
  }

  const submit = () => save(async () => {
    setArena(await api.updateArena(arena.id, { confirmation_template: template }))
    notify('Mensagem de confirmação salva.')
  })

  return (
    <section className="panel settings-section">
      <div className="section-head">
        <div><span className="kicker">WHATSAPP</span><h2>Mensagem de confirmação</h2></div>
      </div>
      <div className="template-editor">
        <div>
          <p className="settings-help-text">Enviada ao cliente quando você clica em <strong>Confirmar reserva</strong>. Clique numa variável para inseri-la.</p>
          <div className="variable-chips">
            {TEMPLATE_VARIABLES.map(variable => <button type="button" key={variable} onClick={() => insert(variable)}>{`{${variable}}`}</button>)}
          </div>
          <textarea ref={textarea} rows={10} maxLength={1000} value={template} onChange={event => setTemplate(event.target.value)} aria-label="Modelo da mensagem"/>
          {saving.error && <p className="form-message error" role="alert">{saving.error}</p>}
          <div className="form-actions">
            <button type="button" className="secondary" onClick={() => setTemplate(DEFAULT_TEMPLATE)}>Restaurar padrão</button>
            <button type="button" className="primary" disabled={saving.busy || template === arena.confirmation_template || !template.trim()} onClick={submit}>{saving.busy ? 'Salvando…' : 'Salvar mensagem'}</button>
          </div>
        </div>
        <div className="whatsapp-preview" aria-label="Pré-visualização">
          <span className="kicker">PRÉ-VISUALIZAÇÃO</span>
          <div className="bubble">{preview}</div>
        </div>
      </div>
    </section>
  )
}

function CourtsSection() {
  const { arena, courts } = usePainel()
  const [adding, setAdding] = useState(false)

  const blank = {
    arena_id: arena.id, name: `Quadra ${String(courts.length + 1).padStart(2, '0')}`, surface: 'Areia', sports: ['Beach tennis'],
    capacity: 4, hourly_price: 100, color: COURT_COLORS[courts.length % COURT_COLORS.length], active: true, position: courts.length + 1,
    hours: Array.from({ length: 7 }, (_, weekday) => ({ weekday, opens: '07:00', closes: '23:00', slot_minutes: 60 })),
  }

  return (
    <section className="panel settings-section">
      <div className="section-head">
        <div><span className="kicker">ESTRUTURA</span><h2>Quadras, preços e horários</h2></div>
        <span className="count">{courts.filter(item => item.active).length} ativa{courts.filter(item => item.active).length === 1 ? '' : 's'}</span>
      </div>
      <div className="court-editor-list">
        {courts.map(court => <CourtEditor key={court.id} court={court}/>)}
        {adding && <CourtEditor court={blank} startOpen onDone={() => setAdding(false)}/>}
      </div>
      {!adding && <div className="settings-actions"><button className="secondary" onClick={() => setAdding(true)}><Icon name="plus" size={17}/> Adicionar quadra</button></div>}
    </section>
  )
}

function hoursToForm(hours) {
  return {
    slot: hours[0]?.slot_minutes || 60,
    days: WEEKDAYS.map((_, weekday) => {
      const row = hours.find(item => item.weekday === weekday)
      return { open: Boolean(row), opens: row?.opens.slice(0, 5) || '07:00', closes: row ? (row.closes.slice(0, 5) === '24:00' ? '00:00' : row.closes.slice(0, 5)) : '23:00' }
    }),
  }
}

function CourtEditor({ court, startOpen = false, onDone }) {
  const { reloadCourts, notify } = usePainel()
  const isNew = !court.id
  const [open, setOpen] = useState(startOpen)
  const [form, setForm] = useState(() => ({
    name: court.name, surface: court.surface || '', sports: court.sports.join(', '), capacity: court.capacity,
    hourly_price: court.hourly_price, color: court.color, active: court.active,
  }))
  const [schedule, setSchedule] = useState(() => hoursToForm(court.hours))
  const [saving, save] = useSaving()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const change = event => setForm({ ...form, [event.target.name]: event.target.value })
  const changeDay = (weekday, field, value) => setSchedule({ ...schedule, days: schedule.days.map((day, index) => (index === weekday ? { ...day, [field]: value } : day)) })
  const copyToAll = weekday => setSchedule({ ...schedule, days: schedule.days.map(() => ({ ...schedule.days[weekday] })) })

  const submit = event => {
    event.preventDefault()
    save(async () => {
      const rows = schedule.days.flatMap((day, weekday) => {
        if (!day.open) return []
        const closes = day.closes === '00:00' ? '24:00' : day.closes
        if (timeToMinutes(closes) <= timeToMinutes(day.opens)) throw new Error(`${WEEKDAYS[weekday]}: o fechamento deve ser depois da abertura.`)
        if (timeToMinutes(closes) - timeToMinutes(day.opens) < schedule.slot) throw new Error(`${WEEKDAYS[weekday]}: o período aberto é menor que a duração do horário.`)
        return [{ weekday, opens: day.opens, closes, slot_minutes: Number(schedule.slot) }]
      })
      const saved = await api.saveCourt({
        ...(isNew ? { arena_id: court.arena_id, position: court.position } : { id: court.id }),
        name: form.name.trim(),
        surface: form.surface.trim() || null,
        sports: form.sports.split(',').map(item => item.trim()).filter(Boolean),
        capacity: Number(form.capacity),
        hourly_price: Number(form.hourly_price),
        color: form.color,
        active: form.active,
      })
      await api.saveCourtHours(saved, rows)
      await reloadCourts()
      notify(isNew ? 'Quadra criada.' : 'Quadra atualizada.')
      if (isNew) onDone?.()
      else setOpen(false)
    })
  }

  const remove = () => save(async () => {
    await api.deleteCourt(court.id)
    await reloadCourts()
    notify('Quadra excluída.')
  }).then(ok => ok && setConfirmDelete(false))

  return (
    <article className={`court-editor ${open ? 'open' : ''}`}>
      <button type="button" className="court-summary" onClick={() => (isNew ? onDone?.() : setOpen(!open))} aria-expanded={open}>
        <span className="court-color" style={{ background: form.color }}></span>
        <div className="court-name"><strong>{form.name || 'Nova quadra'}</strong><span>{form.surface || '—'} · até {form.capacity} pessoas · {brl(form.hourly_price)}/h</span></div>
        <span className={`status ${form.active ? 'confirmada' : 'cancelada'}`}>{form.active ? 'Ativa' : 'Inativa'}</span>
        <Icon name={isNew ? 'close' : 'arrow'} size={18}/>
      </button>
      {open && (
        <form className="settings-form court-form" onSubmit={submit}>
          <label>Nome<input required maxLength={40} name="name" value={form.name} onChange={change}/></label>
          <label>Piso / tipo<input name="surface" value={form.surface} onChange={change} placeholder="Areia premium"/></label>
          <label className="wide">Esportes (separados por vírgula)<input name="sports" value={form.sports} onChange={change} placeholder="Beach tennis, Futevôlei"/></label>
          <label>Capacidade (pessoas)<input type="number" min="1" max="100" required name="capacity" value={form.capacity} onChange={change}/></label>
          <label>Preço por hora (R$)<input type="number" min="0" step="0.01" required name="hourly_price" value={form.hourly_price} onChange={change}/></label>
          <div className="wide color-row">
            <span>Cor na agenda</span>
            {COURT_COLORS.map(color => <button type="button" key={color} className={form.color === color ? 'selected' : ''} style={{ background: color }} onClick={() => setForm({ ...form, color })} aria-label={`Cor ${color}`}/>)}
            <label className="switch-label">
              <input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })}/>
              <span>{form.active ? 'Ativa — aparece na página' : 'Inativa — oculta da página'}</span>
            </label>
          </div>

          <fieldset className="wide hours-editor">
            <legend>Horário de funcionamento</legend>
            <label className="slot-select">Duração de cada horário
              <select value={schedule.slot} onChange={event => setSchedule({ ...schedule, slot: Number(event.target.value) })}>
                {SLOT_OPTIONS.map(minutes => <option key={minutes} value={minutes}>{minutes} min</option>)}
              </select>
            </label>
            {schedule.days.map((day, weekday) => (
              <div className={`hours-row ${day.open ? '' : 'closed'}`} key={weekday}>
                <label className="day-toggle"><input type="checkbox" checked={day.open} onChange={event => changeDay(weekday, 'open', event.target.checked)}/>{WEEKDAYS[weekday]}</label>
                {day.open ? (
                  <>
                    <input type="time" value={day.opens} onChange={event => changeDay(weekday, 'opens', event.target.value)} aria-label={`${WEEKDAYS[weekday]} abre`}/>
                    <span>às</span>
                    <input type="time" value={day.closes} onChange={event => changeDay(weekday, 'closes', event.target.value)} aria-label={`${WEEKDAYS[weekday]} fecha`}/>
                    <button type="button" className="text-button" onClick={() => copyToAll(weekday)}>Copiar p/ todos</button>
                  </>
                ) : <span className="closed-label">Fechado</span>}
              </div>
            ))}
            <p className="settings-help-text">Use 00:00 no fechamento para fechar à meia-noite.</p>
          </fieldset>

          {saving.error && <p className="form-message error wide" role="alert">{saving.error}</p>}
          <div className="form-actions">
            {!isNew && <button type="button" className="danger-button" onClick={() => setConfirmDelete(true)}><Icon name="trash" size={16}/> Excluir</button>}
            <button type="button" className="secondary" onClick={() => (isNew ? onDone?.() : setOpen(false))}>Cancelar</button>
            <button className="primary" disabled={saving.busy}>{saving.busy ? 'Salvando…' : isNew ? 'Criar quadra' : 'Salvar quadra'}</button>
          </div>
        </form>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Excluir esta quadra?"
          description={saving.error || 'Só é possível excluir quadras sem reservas. Para tirar da página sem perder o histórico, desative a quadra.'}
          confirmLabel="Sim, excluir"
          busy={saving.busy}
          close={() => setConfirmDelete(false)}
          confirm={remove}
        />
      )}
    </article>
  )
}
