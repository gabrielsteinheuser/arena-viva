import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { CloseButton, ConfirmDialog, Drawer, Modal } from '../components/Overlay.jsx'
import * as api from '../lib/api.js'
import {
  STATUS_LABELS, brl, confirmationMessage, formatDateKey, formatPhone, formatRelative, initials, isValidPhone,
  localDateKey, localTime, minutesToTime, phoneDigits, timeToMinutes, todayKey, whatsappUrl, zonedToUtc,
} from '../lib/format.js'
import { usePainel } from './PainelContext.jsx'

export function StatusBadge({ status }) {
  return <span className={`status ${status}`}>{STATUS_LABELS[status] || status}</span>
}

const DIALOGS = {
  recusada: { title: 'Recusar esta solicitação?', description: 'O horário volta a ficar disponível na página da arena.', label: 'Sim, recusar', message: 'Solicitação recusada.' },
  cancelada: { title: 'Cancelar esta reserva?', description: 'O horário volta a ficar disponível na página da arena.', label: 'Sim, cancelar', message: 'Reserva cancelada.' },
}

export function BookingDrawer({ booking, close }) {
  const { arena, courtById, confirmAndNotify, setStatus, openBookingForm } = usePainel()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const timeZone = arena.timezone
  const court = courtById[booking.court_id]
  const dateKey = localDateKey(booking.starts_at, timeZone)
  const active = booking.status === 'pendente' || booking.status === 'confirmada'

  const act = async action => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = status => act(async () => {
    await setStatus(booking, status, DIALOGS[status]?.message || 'Reserva reaberta como pendente.')
    setDialog(null)
  })

  return (
    <>
      <Drawer close={dialog ? null : close} label={`Reserva de ${booking.customer_name}`}>
        <div className="drawer-head"><StatusBadge status={booking.status}/><CloseButton onClick={close}/></div>
        <div className={`drawer-hero ${booking.status}`}>
          <span>{formatDateKey(dateKey).toUpperCase()}</span>
          <h2>{localTime(booking.starts_at, timeZone)} <small>até {localTime(booking.ends_at, timeZone)}</small></h2>
          <p>{court?.name || 'Quadra removida'}</p>
        </div>
        <div className="drawer-person">
          <div className="client-avatar">{initials(booking.customer_name)}</div>
          <div>
            <span>CLIENTE</span>
            <strong>{booking.customer_name}</strong>
            <p>{booking.phone ? formatPhone(booking.phone) : 'Telefone não informado'}</p>
          </div>
          {booking.phone && <a className="icon-button whatsapp" href={whatsappUrl(booking.phone)} target="_blank" rel="noreferrer" aria-label="Conversar no WhatsApp" title="Conversar no WhatsApp"><Icon name="whatsapp" size={19}/></a>}
        </div>
        <dl>
          <div><dt>Pessoas</dt><dd>{booking.people}</dd></div>
          <div><dt>Valor</dt><dd>{brl(booking.price)}</dd></div>
          <div><dt>Origem</dt><dd>{booking.source === 'site' ? 'Página da arena' : 'Painel'}</dd></div>
          <div><dt>Recebida</dt><dd>{formatRelative(booking.created_at)}</dd></div>
          {booking.notes && <div><dt>Observação</dt><dd>{booking.notes}</dd></div>}
        </dl>
        {error && <p className="form-message error drawer-error" role="alert">{error}</p>}
        <div className="drawer-actions">
          {booking.status === 'pendente' && (
            <>
              <button className="confirm-button" disabled={busy} onClick={() => act(() => confirmAndNotify(booking))}>
                <Icon name="whatsapp"/> {busy ? 'Confirmando…' : 'Confirmar reserva'}
              </button>
              {booking.phone && <p className="drawer-hint">Abre o WhatsApp de {booking.customer_name.split(' ')[0]} com a mensagem de confirmação pronta.</p>}
            </>
          )}
          {booking.status === 'confirmada' && booking.phone && (
            <a className="secondary" href={whatsappUrl(booking.phone, confirmationMessage({ arena, booking, court }))} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={17}/> Reenviar confirmação
            </a>
          )}
          {active && <button className="secondary" disabled={busy} onClick={() => openBookingForm({ booking })}><Icon name="edit" size={17}/> Editar reserva</button>}
          {booking.status === 'pendente' && <button className="danger-button" disabled={busy} onClick={() => setDialog('recusada')}><Icon name="close" size={17}/> Recusar solicitação</button>}
          {booking.status === 'confirmada' && <button className="danger-button" disabled={busy} onClick={() => setDialog('cancelada')}><Icon name="trash" size={17}/> Cancelar reserva</button>}
          {!active && new Date(booking.ends_at) > new Date() && <button className="secondary" disabled={busy} onClick={() => changeStatus('pendente')}>Reabrir como pendente</button>}
        </div>
      </Drawer>
      {dialog && (
        <ConfirmDialog
          title={DIALOGS[dialog].title}
          description={DIALOGS[dialog].description}
          confirmLabel={DIALOGS[dialog].label}
          busy={busy}
          close={() => setDialog(null)}
          confirm={() => changeStatus(dialog)}
        />
      )}
    </>
  )
}

function suggestedPrice(court, start, end) {
  if (!court || !start || !end) return 0
  const minutes = timeToMinutes(end) - timeToMinutes(start)
  return minutes > 0 ? Math.round(court.hourly_price * minutes / 60 * 100) / 100 : 0
}

// `initial`: { booking } para editar, ou { dateKey, time, courtId } para criar a partir da agenda.
export function BookingForm({ initial, close }) {
  const { arena, courts, courtById, upsertBooking, openBooking, notify } = usePainel()
  const timeZone = arena.timezone
  const editing = initial.booking
  const selectable = courts.filter(court => court.active || court.id === editing?.court_id)

  const [form, setForm] = useState(() => {
    if (editing) {
      return {
        customer_name: editing.customer_name,
        phone: editing.phone ? formatPhone(editing.phone) : '',
        court_id: editing.court_id,
        people: editing.people,
        date: localDateKey(editing.starts_at, timeZone),
        start: localTime(editing.starts_at, timeZone),
        end: localTime(editing.ends_at, timeZone) === '00:00' ? '24:00' : localTime(editing.ends_at, timeZone),
        price: editing.price,
        status: editing.status,
        notes: editing.notes || '',
      }
    }
    const court = courtById[initial.courtId] || selectable[0]
    const start = initial.time || '18:00'
    const end = minutesToTime(Math.min(timeToMinutes(start) + 60, 24 * 60))
    return {
      customer_name: '', phone: '', court_id: court?.id || '', people: 2,
      date: initial.dateKey || todayKey(timeZone), start, end,
      price: suggestedPrice(court, start, end), status: 'confirmada', notes: '',
    }
  })
  const [priceTouched, setPriceTouched] = useState(Boolean(editing))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const court = courtById[form.court_id]

  const change = event => {
    const { name, value } = event.target
    const next = { ...form, [name]: name === 'phone' ? formatPhone(value) : value }
    if (name === 'price') setPriceTouched(true)
    else if (!priceTouched && ['court_id', 'start', 'end'].includes(name)) next.price = suggestedPrice(courtById[next.court_id], next.start, next.end)
    setForm(next)
  }

  const submit = async event => {
    event.preventDefault()
    setError('')
    if (!court) return setError('Cadastre uma quadra antes de criar reservas.')
    if (timeToMinutes(form.end) <= timeToMinutes(form.start)) return setError('O horário de fim deve ser depois do início.')
    if (form.phone && !isValidPhone(form.phone)) return setError('Telefone inválido. Use DDD + número.')
    if (Number(form.people) > court.capacity) return setError(`${court.name} comporta até ${court.capacity} pessoas.`)

    setBusy(true)
    try {
      const saved = await api.saveBooking({
        ...(editing ? { id: editing.id } : { arena_id: arena.id, source: 'painel' }),
        customer_name: form.customer_name.trim().replace(/\s+/g, ' '),
        phone: form.phone ? phoneDigits(form.phone) : null,
        court_id: form.court_id,
        people: Number(form.people),
        starts_at: zonedToUtc(form.date, form.start, timeZone).toISOString(),
        ends_at: zonedToUtc(form.date, form.end, timeZone).toISOString(),
        price: Number(form.price) || 0,
        status: form.status,
        notes: form.notes.trim() || null,
      })
      upsertBooking(saved)
      notify(editing ? 'Reserva atualizada.' : 'Reserva criada.')
      close()
      openBooking(saved)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal close={close} label={editing ? 'Editar reserva' : 'Nova reserva'}>
      <div className="modal-head">
        <div><span className="kicker">{editing ? 'EDITAR RESERVA' : 'NOVA RESERVA'}</span><h2>{editing ? editing.customer_name : 'Lançar reserva'}</h2></div>
        <CloseButton onClick={close}/>
      </div>
      <form onSubmit={submit}>
        <label className="wide">Nome do cliente<input autoFocus required minLength={2} maxLength={80} name="customer_name" value={form.customer_name} onChange={change} placeholder="Ex.: Lucas Ferreira"/></label>
        <label>Telefone (WhatsApp)<input name="phone" inputMode="tel" value={form.phone} onChange={change} placeholder="(11) 99999-9999"/></label>
        <label>Pessoas<input type="number" min="1" max={court?.capacity || 100} required name="people" value={form.people} onChange={change}/></label>
        <label>Quadra
          <select name="court_id" value={form.court_id} onChange={change} required>
            {selectable.map(item => <option key={item.id} value={item.id}>{item.name}{item.active ? '' : ' (inativa)'}</option>)}
          </select>
        </label>
        <label>Data<input type="date" required name="date" value={form.date} onChange={change}/></label>
        <div className="time-pair">
          <label>Início<input type="time" required name="start" value={form.start} onChange={change}/></label>
          <label>Fim<input type="time" required name="end" value={form.end === '24:00' ? '23:59' : form.end} onChange={change}/></label>
        </div>
        <label>Valor (R$)<input type="number" min="0" step="0.01" required name="price" value={form.price} onChange={change}/></label>
        <label>Status
          <select name="status" value={form.status} onChange={change}>
            <option value="confirmada">Confirmada</option>
            <option value="pendente">Pendente</option>
          </select>
        </label>
        <label className="wide">Observação<input name="notes" maxLength={500} value={form.notes} onChange={change} placeholder="Opcional"/></label>
        {error && <p className="form-message error wide" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={close}>Cancelar</button>
          <button type="submit" className="primary" disabled={busy}><Icon name="check"/> {busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar reserva'}</button>
        </div>
      </form>
    </Modal>
  )
}
