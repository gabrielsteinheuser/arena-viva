import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { CloseButton, Drawer } from '../components/Overlay.jsx'
import { brl, formatDateKey, formatPhone, initials, localDateKey, localTime, phoneDigits, whatsappUrl } from '../lib/format.js'
import { StatusBadge } from './Bookings.jsx'
import { usePainel } from './PainelContext.jsx'

// Clientes são identificados pelo telefone; reservas sem telefone agrupam pelo nome.
function groupClients(bookings) {
  const groups = new Map()
  bookings.forEach(item => {
    const key = item.phone || `nome:${item.customer_name.toLowerCase()}`
    if (!groups.has(key)) groups.set(key, { key, name: item.customer_name, phone: item.phone, bookings: [] })
    groups.get(key).bookings.push(item)
  })
  return [...groups.values()].map(client => {
    const confirmed = client.bookings.filter(item => item.status === 'confirmada')
    const latest = client.bookings.reduce((a, b) => (a.starts_at > b.starts_at ? a : b))
    return {
      ...client,
      name: latest.customer_name,
      confirmed: confirmed.length,
      spent: confirmed.reduce((sum, item) => sum + Number(item.price), 0),
      latest,
    }
  }).sort((a, b) => b.latest.starts_at.localeCompare(a.latest.starts_at))
}

export default function Clients() {
  const { bookings } = usePainel()
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const clients = useMemo(() => groupClients(bookings), [bookings])

  const text = query.trim().toLowerCase()
  const digits = phoneDigits(query)
  const filtered = clients.filter(client => !text || client.name.toLowerCase().includes(text) || (digits.length >= 3 && client.phone?.includes(digits)))
  const selected = clients.find(client => client.key === selectedKey)

  return (
    <section className="panel clients-panel">
      <div className="section-head table-head">
        <div><span className="kicker">RELACIONAMENTO</span><h2>Base de clientes</h2></div>
        <label className="search"><Icon name="search" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar nome ou telefone" aria-label="Buscar clientes"/></label>
      </div>
      <div className="client-grid">
        {filtered.map((client, index) => (
          <button key={client.key} onClick={() => setSelectedKey(client.key)}>
            <div className={`client-avatar color-${index % 4}`}>{initials(client.name)}</div>
            <div><strong>{client.name}</strong><span>{client.phone ? formatPhone(client.phone) : 'Sem telefone'}</span></div>
            <div className="client-stats"><strong>{client.confirmed}</strong><span>confirmada{client.confirmed === 1 ? '' : 's'}</span></div>
            <div className="client-value"><strong>{brl(client.spent)}</strong><span>em reservas</span></div>
            <Icon name="arrow" size={17}/>
          </button>
        ))}
      </div>
      {!filtered.length && <div className="empty"><Icon name="users"/><strong>Nenhum cliente encontrado</strong><span>Os clientes aparecem conforme as reservas chegam.</span></div>}
      {selected && <ClientDrawer client={selected} close={() => setSelectedKey(null)}/>}
    </section>
  )
}

function ClientDrawer({ client, close }) {
  const { arena, courtById, openBooking } = usePainel()
  const timeZone = arena.timezone
  const history = [...client.bookings].sort((a, b) => b.starts_at.localeCompare(a.starts_at))

  return (
    <Drawer close={close} label={`Cliente ${client.name}`} className="client-drawer">
      <div className="drawer-head"><span className="kicker">PERFIL DO CLIENTE</span><CloseButton onClick={close}/></div>
      <div className="client-profile">
        <div className="client-avatar large">{initials(client.name)}</div>
        <h2>{client.name}</h2>
        <p>{client.phone ? formatPhone(client.phone) : 'Sem telefone'}</p>
        {client.phone && <a className="secondary whatsapp-link" href={whatsappUrl(client.phone)} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={17}/> Conversar no WhatsApp</a>}
      </div>
      <div className="client-kpis">
        <div><strong>{client.confirmed}</strong><span>confirmadas</span></div>
        <div><strong>{brl(client.spent)}</strong><span>valor total</span></div>
      </div>
      <div className="client-history">
        <span>HISTÓRICO</span>
        {history.map(item => (
          <button key={item.id} className="history-item" onClick={() => { close(); openBooking(item) }}>
            <Icon name="calendar"/>
            <div>
              <strong>{formatDateKey(localDateKey(item.starts_at, timeZone), { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
              <p>{courtById[item.court_id]?.name} · {localTime(item.starts_at, timeZone)} às {localTime(item.ends_at, timeZone)}</p>
            </div>
            <StatusBadge status={item.status}/>
          </button>
        ))}
      </div>
    </Drawer>
  )
}
