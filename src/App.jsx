import { useEffect, useMemo, useState } from 'react'

const initialBookings = [
  { id: 1, time: '07:00', end: '08:00', court: 'Quadra 01', sport: 'Beach tennis', client: 'Marina Duarte', status: 'confirmada', price: 90, phone: '(11) 98824-1620' },
  { id: 2, time: '08:30', end: '09:30', court: 'Quadra 02', sport: 'Futevôlei', client: 'Rafa Oliveira', status: 'confirmada', price: 100, phone: '(11) 99412-8301' },
  { id: 3, time: '10:00', end: '11:00', court: 'Quadra 01', sport: 'Beach tennis', client: 'Clara Menezes', status: 'pendente', price: 90, phone: '(11) 97652-4470' },
  { id: 4, time: '14:00', end: '15:30', court: 'Quadra 03', sport: 'Vôlei de praia', client: 'Equipe Águia', status: 'confirmada', price: 145, phone: '(11) 96543-9098' },
  { id: 5, time: '17:00', end: '18:00', court: 'Quadra 02', sport: 'Beach tennis', client: 'Pedro Nunes', status: 'confirmada', price: 110, phone: '(11) 99014-2335' },
  { id: 6, time: '18:30', end: '19:30', court: 'Quadra 01', sport: 'Beach tennis', client: 'Bianca Alves', status: 'pendente', price: 110, phone: '(11) 98177-6224' },
  { id: 7, time: '20:00', end: '21:30', court: 'Quadra 03', sport: 'Futevôlei', client: 'Turma do Caio', status: 'confirmada', price: 165, phone: '(11) 97220-1855' },
]

const initialCourts = [
  { id: 1, name: 'Quadra 01', type: 'Areia premium', price: 90, active: true, color: '#0d8f91' },
  { id: 2, name: 'Quadra 02', type: 'Areia premium', price: 100, active: true, color: '#ed725e' },
  { id: 3, name: 'Quadra 03', type: 'Areia compacta', price: 110, active: true, color: '#e8ae3c' },
]

const week = [
  { day: 'SEG', date: '19' }, { day: 'TER', date: '20' }, { day: 'QUA', date: '21' },
  { day: 'QUI', date: '22' }, { day: 'SEX', date: '23' }, { day: 'SÁB', date: '24' }, { day: 'DOM', date: '25' },
]

const navItems = [
  ['dashboard', 'Visão geral', 'grid'],
  ['agenda', 'Agenda', 'calendar'],
  ['reservas', 'Reservas', 'ticket'],
  ['clientes', 'Clientes', 'users'],
]

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue]
}

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></>,
    ticket: <><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z"/><path d="M13 8v2m0 4v2"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6M16 5a3 3 0 0 1 0 6m1 4c3 .3 4 2 4 5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    wind: <><path d="M3 8h11a3 3 0 1 0-3-3M3 12h16M3 16h10a3 3 0 1 1-3 3"/></>,
    wave: <><path d="M3 8c3-3 6 3 9 0s6 3 9 0M3 13c3-3 6 3 9 0s6 3 9 0M3 18c3-3 6 3 9 0s6 3 9 0"/></>,
    wallet: <><path d="M4 6h15v13H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13"/><path d="M15 10h6v5h-6a2 2 0 0 1 0-5Z"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Sidebar({ view, changeView, open, pendingCount, profileOpen }) {
  return <aside className={`sidebar ${open ? 'is-open' : ''}`}>
    <button className="brand" onClick={() => changeView('dashboard')}>
      <div className="brand-mark"><span>AV</span><i></i></div>
      <div><strong>ARENA VIVA</strong><small>GESTÃO ESPORTIVA</small></div>
    </button>
    <nav aria-label="Menu principal">
      <p className="nav-label">OPERAÇÃO</p>
      {navItems.map(([id, label, icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => changeView(id)}><Icon name={icon}/><span>{label}</span>{id === 'reservas' && pendingCount > 0 && <em>{pendingCount}</em>}</button>)}
      <p className="nav-label lower">ADMINISTRAÇÃO</p>
      <button className={view === 'configuracoes' ? 'active' : ''} onClick={() => changeView('configuracoes')}><Icon name="settings"/><span>Espaços e preços</span></button>
    </nav>
    <div className="sidebar-bottom">
      <button className="profile" onClick={profileOpen}><div className="avatar">GA</div><div><strong>Gabriel</strong><span>Administrador</span></div><Icon name="arrow" size={17}/></button>
      <div className="court-status"><span></span><div><strong>ARENA ABERTA</strong><small>Fecha hoje às 23h</small></div></div>
    </div>
  </aside>
}

function Notifications({ bookings, close, openBooking }) {
  const pending = bookings.filter(item => item.status === 'pendente')
  return <div className="notifications" role="dialog" aria-label="Notificações">
    <div className="notifications-head"><div><span>ATUALIZAÇÕES</span><strong>Central de avisos</strong></div><button onClick={close} aria-label="Fechar notificações"><Icon name="close" size={18}/></button></div>
    {pending.length ? pending.map(item => <button className="notification-item" key={item.id} onClick={() => openBooking(item)}><i></i><div><strong>Confirmação pendente</strong><span>{item.client} · {item.time} · {item.court}</span></div><Icon name="arrow" size={16}/></button>) : <div className="notifications-empty"><Icon name="check"/><strong>Tudo em dia</strong><span>Não existem confirmações pendentes.</span></div>}
  </div>
}

function Header({ title, onNew, toggleMenu, notificationsOpen, setNotificationsOpen, pendingCount, bookings, openBooking }) {
  return <header className="topbar">
    <button className="menu-btn" onClick={toggleMenu} aria-label="Abrir menu"><Icon name="menu"/></button>
    <div className="page-title"><span>PAINEL DE CONTROLE</span><h1>{title}</h1></div>
    <div className="top-actions">
      <div className="notification-wrap"><button className={`icon-button ${notificationsOpen ? 'selected' : ''}`} onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notificações"><Icon name="bell"/>{pendingCount > 0 && <i>{pendingCount}</i>}</button>{notificationsOpen && <Notifications bookings={bookings} close={() => setNotificationsOpen(false)} openBooking={openBooking}/>}</div>
      <button className="primary" onClick={() => onNew()}><Icon name="plus"/> Nova reserva</button>
    </div>
  </header>
}

function Metric({ icon, label, value, note, accent, trend }) {
  return <article className={`metric metric-${accent}`}><div className="metric-icon"><Icon name={icon} size={19}/></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><p>{note}</p></div>{trend && <small>{trend}</small>}</article>
}

function ArenaPulse({ nextBooking, setView }) {
  return <section className="arena-pulse">
    <div className="pulse-art" aria-hidden="true"><span className="sun-disc"></span><i className="wave-line one"></i><i className="wave-line two"></i><b>VIVA</b></div>
    <div className="pulse-copy"><span className="light-kicker">PRÓXIMO JOGO</span><h2>{nextBooking?.time || '--:--'} <small>— {nextBooking?.end || '--:--'}</small></h2><p>{nextBooking ? `${nextBooking.client} chega em breve para ${nextBooking.sport.toLowerCase()} na ${nextBooking.court.toLowerCase()}.` : 'Sem reservas programadas para agora.'}</p><button onClick={() => setView('agenda')}>Abrir agenda <Icon name="arrow" size={16}/></button></div>
    <div className="pulse-tag"><span>AGORA</span><strong>3</strong><small>quadras ativas</small></div>
  </section>
}

function TodayList({ bookings, setView, openBooking }) {
  return <section className="panel schedule-panel">
    <div className="section-head"><div><span className="kicker">OPERAÇÃO DE HOJE</span><h2>Próximas reservas</h2></div><button className="text-button" onClick={() => setView('reservas')}>Ver todas <Icon name="arrow" size={17}/></button></div>
    <div className="booking-list">
      {bookings.slice(0, 5).map(booking => <button className="booking-row" key={booking.id} onClick={() => openBooking(booking)}>
        <div className="time"><strong>{booking.time}</strong><span>{booking.end}</span></div>
        <div className={`timeline-dot ${booking.status}`}></div>
        <div className="booking-info"><strong>{booking.client}</strong><span>{booking.sport} · {booking.court}</span></div>
        <span className={`status ${booking.status}`}>{booking.status}</span>
        <strong className="price">{brl.format(booking.price)}</strong>
        <Icon name="arrow" size={18}/>
      </button>)}
    </div>
  </section>
}

function Conditions() {
  return <section className="conditions">
    <div className="condition-main"><div><span>CONDIÇÕES DA ARENA</span><strong>28°</strong><p>Céu aberto · sensação de 30°</p></div><Icon name="sun" size={50}/></div>
    <div className="condition-details"><div><Icon name="wind"/><span><b>12 km/h</b>Vento leste</span></div><div><Icon name="wave"/><span><b>Areia seca</b>Condição ideal</span></div></div>
  </section>
}

function WeekRevenue() {
  const values = [38, 52, 47, 68, 92, 78, 61]
  return <section className="panel mini-chart-panel"><div className="mini-chart-head"><div><span className="kicker">RECEITA DA SEMANA</span><h2>R$ 4.860</h2></div><span className="positive"><Icon name="trend" size={15}/> 18%</span></div><div className="spark-bars">{values.map((value, index) => <div key={week[index].day}><span style={{ height: `${value}%` }}></span><small>{week[index].day}</small></div>)}</div></section>
}

function Dashboard({ bookings, setView, openBooking }) {
  const revenue = bookings.reduce((sum, booking) => sum + booking.price, 0)
  const confirmed = bookings.filter(item => item.status === 'confirmada').length
  return <>
    <div className="date-strip"><div><span>SEGUNDA-FEIRA</span><strong>19 DE OUTUBRO</strong></div><p><span className="live-dot"></span> Operação ao vivo</p></div>
    <ArenaPulse nextBooking={bookings[0]} setView={setView}/>
    <section className="metrics-grid">
      <Metric icon="calendar" label="RESERVAS HOJE" value={bookings.length} note={`${confirmed} já confirmadas`} accent="ocean" trend="+2" />
      <Metric icon="wallet" label="RECEITA PREVISTA" value={brl.format(revenue)} note="Ticket médio do dia" accent="coral" trend="+12%" />
      <Metric icon="clock" label="HORÁRIOS LIVRES" value="11" note="Próximo às 11h" accent="sun" />
      <Metric icon="trend" label="OCUPAÇÃO" value="74%" note="Meta mensal: 78%" accent="navy" trend="+6%" />
    </section>
    <div className="dashboard-grid"><TodayList bookings={bookings} setView={setView} openBooking={openBooking}/><div className="widget-stack"><Conditions/><WeekRevenue/></div></div>
  </>
}

function Agenda({ bookings, onNew, openBooking }) {
  const [activeDay, setActiveDay] = useState(0)
  const times = ['07:00','08:30','10:00','11:30','14:00','15:30','17:00','18:30','20:00']
  return <section className="panel calendar-panel">
    <div className="section-head agenda-head"><div><span className="kicker">SEMANA ATUAL</span><h2>19 a 25 de outubro</h2></div><div className="legend"><span><i className="confirmed"></i>Confirmado</span><span><i className="pending"></i>Pendente</span></div></div>
    <div className="mobile-days">{week.map((day, index) => <button className={activeDay === index ? 'active' : ''} key={day.day} onClick={() => setActiveDay(index)}><span>{day.day}</span><strong>{day.date}</strong></button>)}</div>
    <div className="week-grid">
      <div className="week-corner">HORÁRIO</div>{week.map((day, index) => <button className={`day-head ${index === activeDay ? 'today' : ''}`} key={day.day} onClick={() => setActiveDay(index)}><small>{day.day}</small><strong>{day.date}</strong></button>)}
      {times.map((time, rowIndex) => <div className="week-row" key={time}>
        <div className="hour">{time}</div>{week.map((day, columnIndex) => {
          const booking = columnIndex === 0 ? bookings.find(item => item.time === time) : (columnIndex === 1 && rowIndex === 5 ? { id: 'extra', client: 'João Lima', court: 'Quadra 02', status: 'confirmada', time, end: '16:30', sport: 'Futevôlei', price: 100, phone: '(11) 90000-0000' } : null)
          return <button className={`slot ${booking ? `booked ${booking.status}` : ''} ${columnIndex !== activeDay ? 'mobile-hidden' : ''}`} key={day.day} onClick={() => booking ? openBooking(booking) : onNew(time)}>{booking ? <><strong>{booking.client}</strong><span>{booking.court}</span></> : <><span className="slot-add">+</span><small>Disponível</small></>}</button>
        })}
      </div>)}
    </div>
  </section>
}

function Reservations({ bookings, openBooking }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('todas')
  const filtered = bookings.filter(booking => {
    const matchesQuery = `${booking.client} ${booking.court} ${booking.sport}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (filter === 'todas' || booking.status === filter)
  })
  return <section className="panel table-panel">
    <div className="section-head table-head"><div><span className="kicker">AGENDA COMPLETA</span><h2>Reservas de hoje</h2></div><label className="search"><Icon name="search" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente ou quadra" /></label></div>
    <div className="filter-row"><div>{['todas','confirmada','pendente'].map(item => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item === 'todas' ? 'Todas' : item}</button>)}</div><span>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span></div>
    <div className="table-wrap"><table><thead><tr><th>HORÁRIO</th><th>CLIENTE</th><th>ESPAÇO</th><th>ATIVIDADE</th><th>STATUS</th><th>VALOR</th><th></th></tr></thead><tbody>{filtered.map(booking => <tr key={booking.id} onClick={() => openBooking(booking)}><td><strong>{booking.time}</strong> — {booking.end}</td><td><strong>{booking.client}</strong><small>{booking.phone}</small></td><td>{booking.court}</td><td>{booking.sport}</td><td><span className={`status ${booking.status}`}>{booking.status}</span></td><td><strong>{brl.format(booking.price)}</strong></td><td><Icon name="arrow" size={17}/></td></tr>)}</tbody></table>{!filtered.length && <div className="empty"><Icon name="search"/><strong>Nenhuma reserva encontrada</strong><span>Tente mudar os filtros da busca.</span></div>}</div>
  </section>
}

function Clients({ bookings, openClient }) {
  const [query, setQuery] = useState('')
  const clients = useMemo(() => {
    const grouped = new Map()
    bookings.forEach(booking => {
      const existing = grouped.get(booking.client)
      if (existing) { existing.total += 1; existing.spent += booking.price }
      else grouped.set(booking.client, { ...booking, total: 1, spent: booking.price })
    })
    return Array.from(grouped.values()).filter(client => client.client.toLowerCase().includes(query.toLowerCase()))
  }, [bookings, query])
  return <section className="panel clients-panel"><div className="section-head table-head"><div><span className="kicker">RELACIONAMENTO</span><h2>Base de clientes</h2></div><label className="search"><Icon name="search" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente" /></label></div><div className="client-grid">{clients.map((client, index) => <button key={client.client} onClick={() => openClient(client)}><div className={`client-avatar color-${index % 4}`}>{client.client.split(' ').map(name => name[0]).slice(0,2).join('')}</div><div><strong>{client.client}</strong><span>{client.phone}</span></div><div className="client-stats"><strong>{client.total}</strong><span>reserva{client.total > 1 ? 's' : ''}</span></div><div className="client-value"><strong>{brl.format(client.spent)}</strong><span>em reservas</span></div><Icon name="arrow" size={17}/></button>)}</div></section>
}

function Settings({ courts, setCourts, notify }) {
  const updateCourt = (id, field, value) => setCourts(courts.map(court => court.id === id ? { ...court, [field]: value } : court))
  return <div className="settings-layout">
    <section className="panel settings-panel"><div className="section-head"><div><span className="kicker">ESTRUTURA DA ARENA</span><h2>Espaços e preços</h2></div><span className="count">{courts.filter(item => item.active).length} ativos</span></div><div className="court-list">{courts.map(court => <article key={court.id}><span className="court-color" style={{ background: court.color }}></span><div className="court-name"><strong>{court.name}</strong><span>{court.type}</span></div><label>PREÇO BASE<div className="price-input"><span>R$</span><input type="number" min="0" value={court.price} onChange={event => updateCourt(court.id, 'price', Number(event.target.value))}/></div></label><label className="switch-label"><span>{court.active ? 'Ativa' : 'Inativa'}</span><button className={`switch ${court.active ? 'on' : ''}`} onClick={() => updateCourt(court.id, 'active', !court.active)} aria-label={`${court.active ? 'Desativar' : 'Ativar'} ${court.name}`}><i></i></button></label></article>)}</div><div className="settings-actions"><button className="secondary" onClick={() => setCourts(initialCourts)}>Restaurar padrão</button><button className="primary" onClick={() => notify('Configurações salvas com sucesso.')}>Salvar alterações</button></div></section>
    <aside className="settings-help"><span className="help-number">01</span><h3>Precificação inteligente</h3><p>Os valores configurados aqui são usados automaticamente ao criar novas reservas para cada quadra.</p><div><Icon name="sun"/><span><strong>Dica de operação</strong>Use preços especiais para horários de pico.</span></div></aside>
  </div>
}

function BookingForm({ close, save, booking, initialTime, courts }) {
  const defaultCourt = courts.find(item => item.active) || courts[0]
  const [form, setForm] = useState(booking || { client: '', phone: '', court: defaultCourt?.name || 'Quadra 01', sport: 'Beach tennis', time: initialTime || '12:00', end: '13:00', price: defaultCourt?.price || 90, status: 'confirmada' })
  const change = event => {
    const { name, value } = event.target
    const updated = { ...form, [name]: name === 'price' ? Number(value) : value }
    if (name === 'court') updated.price = courts.find(item => item.name === value)?.price || form.price
    setForm(updated)
  }
  const submit = event => { event.preventDefault(); if (form.client.trim()) save(form) }
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && close()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
    <div className="modal-head"><div><span className="kicker">{booking ? 'EDITAR AGENDAMENTO' : 'NOVO AGENDAMENTO'}</span><h2 id="booking-title">{booking ? 'Dados da reserva' : 'Criar reserva'}</h2></div><button onClick={close} aria-label="Fechar"><Icon name="close"/></button></div>
    <form onSubmit={submit}><label className="wide">Nome do cliente<input autoFocus required name="client" value={form.client} onChange={change} placeholder="Ex.: Lucas Ferreira" /></label><label>Telefone<input name="phone" value={form.phone} onChange={change} placeholder="(11) 99999-9999" /></label><label>Quadra<select name="court" value={form.court} onChange={change}>{courts.filter(item => item.active).map(court => <option key={court.id}>{court.name}</option>)}</select></label><label>Atividade<select name="sport" value={form.sport} onChange={change}><option>Beach tennis</option><option>Futevôlei</option><option>Vôlei de praia</option></select></label><div className="time-pair"><label>Início<input type="time" name="time" value={form.time} onChange={change}/></label><label>Fim<input type="time" name="end" value={form.end} onChange={change}/></label></div><label>Valor (R$)<input type="number" min="0" name="price" value={form.price} onChange={change}/></label><label>Status<select name="status" value={form.status} onChange={change}><option value="confirmada">Confirmada</option><option value="pendente">Pendente</option></select></label><div className="form-actions"><button type="button" className="secondary" onClick={close}>Cancelar</button><button type="submit" className="primary"><Icon name="check"/> {booking ? 'Salvar alterações' : 'Confirmar reserva'}</button></div></form>
  </div></div>
}

function BookingDetails({ booking, close, edit, confirm, remove }) {
  return <div className="drawer-backdrop" onMouseDown={event => event.target === event.currentTarget && close()}><aside className="detail-drawer"><div className="drawer-head"><span className={`status ${booking.status}`}>{booking.status}</span><button onClick={close} aria-label="Fechar"><Icon name="close"/></button></div><div className="drawer-hero"><span>RESERVA #{String(booking.id).slice(-4)}</span><h2>{booking.time} <small>até {booking.end}</small></h2><p>{booking.court}</p></div><div className="drawer-person"><div className="client-avatar">{booking.client.split(' ').map(name => name[0]).slice(0,2).join('')}</div><div><span>CLIENTE</span><strong>{booking.client}</strong><p>{booking.phone || 'Telefone não informado'}</p></div></div><dl><div><dt>Atividade</dt><dd>{booking.sport}</dd></div><div><dt>Valor</dt><dd>{brl.format(booking.price)}</dd></div><div><dt>Pagamento</dt><dd>{booking.status === 'confirmada' ? 'Confirmado' : 'Aguardando'}</dd></div></dl><div className="drawer-actions">{booking.status === 'pendente' && <button className="confirm-button" onClick={confirm}><Icon name="check"/> Confirmar agora</button>}<button className="secondary" onClick={edit}><Icon name="edit" size={17}/> Editar reserva</button><button className="danger-button" onClick={remove}><Icon name="trash" size={17}/> Cancelar reserva</button></div></aside></div>
}

function ClientDetails({ client, close }) {
  return <div className="drawer-backdrop" onMouseDown={event => event.target === event.currentTarget && close()}><aside className="detail-drawer client-drawer"><div className="drawer-head"><span className="kicker">PERFIL DO CLIENTE</span><button onClick={close} aria-label="Fechar"><Icon name="close"/></button></div><div className="client-profile"><div className="client-avatar large">{client.client.split(' ').map(name => name[0]).slice(0,2).join('')}</div><h2>{client.client}</h2><p>{client.phone}</p></div><div className="client-kpis"><div><strong>{client.total}</strong><span>reservas</span></div><div><strong>{brl.format(client.spent)}</strong><span>valor total</span></div></div><div className="client-history"><span>ÚLTIMA ATIVIDADE</span><article><Icon name="calendar"/><div><strong>{client.sport}</strong><p>{client.court} · {client.time} às {client.end}</p></div></article></div></aside></div>
}

function ProfileDialog({ close, notify }) {
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && close()}><div className="profile-dialog"><button className="profile-close" onClick={close}><Icon name="close"/></button><div className="avatar large">GA</div><span>ADMINISTRADOR</span><h2>Gabriel</h2><p>Conta demonstrativa da Arena Viva</p><button className="secondary" onClick={() => { notify('Perfil da demonstração está ativo.'); close() }}>Ver status da conta</button></div></div>
}

function ConfirmDialog({ title, description, confirmLabel, close, confirm }) {
  return <div className="modal-backdrop"><div className="confirm-dialog"><div className="warning-icon"><Icon name="trash"/></div><h2>{title}</h2><p>{description}</p><div><button className="secondary" onClick={close}>Voltar</button><button className="danger-solid" onClick={confirm}>{confirmLabel}</button></div></div></div>
}

function App() {
  const [view, setView] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notice, setNotice] = useState('')
  const [bookings, setBookings] = useStoredState('arena-viva-bookings-v2', initialBookings)
  const [courts, setCourts] = useStoredState('arena-viva-courts-v2', initialCourts)
  const pendingCount = bookings.filter(item => item.status === 'pendente').length
  const titles = { dashboard: 'Visão geral', agenda: 'Agenda semanal', reservas: 'Reservas', clientes: 'Clientes', configuracoes: 'Espaços e preços' }
  const notify = message => { setNotice(message); window.clearTimeout(window.arenaNotice); window.arenaNotice = window.setTimeout(() => setNotice(''), 3200) }
  const changeView = next => { setView(next); setMenuOpen(false); setNotificationsOpen(false) }
  const openNew = time => setBookingForm({ mode: 'new', time: typeof time === 'string' ? time : '' })
  const openBooking = booking => { setSelectedBooking(booking); setNotificationsOpen(false) }
  const saveBooking = form => {
    if (bookingForm.mode === 'edit') setBookings(bookings.map(item => item.id === form.id ? form : item))
    else setBookings([...bookings, { ...form, id: Date.now() }].sort((a, b) => a.time.localeCompare(b.time)))
    setBookingForm(null)
    notify(bookingForm.mode === 'edit' ? 'Reserva atualizada com sucesso.' : 'Reserva criada com sucesso.')
  }
  const confirmBooking = () => { setBookings(bookings.map(item => item.id === selectedBooking.id ? { ...item, status: 'confirmada' } : item)); setSelectedBooking(null); notify('Reserva confirmada com sucesso.') }
  const deleteBooking = () => { setBookings(bookings.filter(item => item.id !== selectedBooking.id)); setConfirmDelete(false); setSelectedBooking(null); notify('Reserva cancelada.') }
  return <div className="app-shell">
    <Sidebar view={view} changeView={changeView} open={menuOpen} pendingCount={pendingCount} profileOpen={() => setProfileOpen(true)}/>
    {menuOpen && <div className="nav-backdrop" onClick={() => setMenuOpen(false)}/>} 
    <main><Header title={titles[view]} onNew={openNew} toggleMenu={() => setMenuOpen(true)} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} pendingCount={pendingCount} bookings={bookings} openBooking={openBooking}/><div className="content">
      {view === 'dashboard' && <Dashboard bookings={bookings} setView={changeView} openBooking={openBooking}/>} 
      {view === 'agenda' && <Agenda bookings={bookings} onNew={openNew} openBooking={openBooking}/>} 
      {view === 'reservas' && <Reservations bookings={bookings} openBooking={openBooking}/>} 
      {view === 'clientes' && <Clients bookings={bookings} openClient={setSelectedClient}/>} 
      {view === 'configuracoes' && <Settings courts={courts} setCourts={setCourts} notify={notify}/>} 
    </div></main>
    {bookingForm && <BookingForm booking={bookingForm.mode === 'edit' ? bookingForm.booking : null} initialTime={bookingForm.time} courts={courts} close={() => setBookingForm(null)} save={saveBooking}/>} 
    {selectedBooking && !confirmDelete && <BookingDetails booking={selectedBooking} close={() => setSelectedBooking(null)} confirm={confirmBooking} edit={() => { setBookingForm({ mode: 'edit', booking: selectedBooking }); setSelectedBooking(null) }} remove={() => setConfirmDelete(true)}/>} 
    {confirmDelete && <ConfirmDialog title="Cancelar esta reserva?" description="A reserva será removida da agenda local. Esta ação não pode ser desfeita." confirmLabel="Sim, cancelar" close={() => setConfirmDelete(false)} confirm={deleteBooking}/>} 
    {selectedClient && <ClientDetails client={selectedClient} close={() => setSelectedClient(null)}/>} 
    {profileOpen && <ProfileDialog close={() => setProfileOpen(false)} notify={notify}/>} 
    {notice && <div className="toast"><Icon name="check" size={18}/>{notice}</div>}
  </div>
}

export default App
