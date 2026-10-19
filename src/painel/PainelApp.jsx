import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, Route, Routes, useLocation } from 'react-router'
import Icon from '../components/Icon.jsx'
import SetupNotice from '../components/SetupNotice.jsx'
import * as api from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { initials } from '../lib/format.js'
import { PainelProvider, usePainel } from './PainelContext.jsx'
import { BookingDrawer, BookingForm } from './Bookings.jsx'
import Dashboard from './Dashboard.jsx'
import Requests from './Requests.jsx'
import Agenda from './Agenda.jsx'
import Reservations from './Reservations.jsx'
import Clients from './Clients.jsx'
import Settings from './Settings.jsx'

const NAV = [
  { to: '/painel', label: 'Visão geral', icon: 'grid', end: true },
  { to: '/painel/solicitacoes', label: 'Solicitações', icon: 'inbox', badge: true },
  { to: '/painel/agenda', label: 'Agenda', icon: 'calendar' },
  { to: '/painel/reservas', label: 'Reservas', icon: 'ticket' },
  { to: '/painel/clientes', label: 'Clientes', icon: 'users' },
]

const TITLES = {
  '/painel': 'Visão geral',
  '/painel/solicitacoes': 'Solicitações',
  '/painel/agenda': 'Agenda',
  '/painel/reservas': 'Reservas',
  '/painel/clientes': 'Clientes',
  '/painel/configuracoes': 'Arena e quadras',
}

const ARENA_KEY = 'arena-viva-painel-arena'

export default function PainelApp() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabase) return <SetupNotice/>
  if (session === undefined) return <FullScreenMessage title="Carregando…"/>
  if (!session) return <Login/>
  return <ArenaGate key={session.user.id} user={session.user}/>
}

function FullScreenMessage({ title, children }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <BrandMark/>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  )
}

function BrandMark() {
  return (
    <div className="auth-brand">
      <div className="brand-mark"><span>AV</span><i></i></div>
      <div><strong>ARENA VIVA</strong><small>GESTÃO ESPORTIVA</small></div>
    </div>
  )
}

function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const { data, error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/painel` } })
    setBusy(false)
    if (error) setMessage({ type: 'error', text: api.errorMessage(error) })
    else if (mode === 'signup' && !data.session) setMessage({ type: 'ok', text: 'Conta criada. Confirme pelo link enviado ao seu e-mail.' })
  }

  return (
    <FullScreenMessage title={mode === 'login' ? 'Entrar no painel' : 'Criar conta'}>
      <form className="auth-form" onSubmit={submit}>
        <label>E-mail<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} autoFocus/></label>
        <label>Senha<input type="password" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)}/></label>
        {message && <p className={`form-message ${message.type}`} role="alert">{message.text}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        <button type="button" className="text-button center" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null) }}>
          {mode === 'login' ? 'Ainda não tem conta? Criar conta' : 'Já tenho conta. Entrar'}
        </button>
      </form>
    </FullScreenMessage>
  )
}

function ArenaGate({ user }) {
  const [arenas, setArenas] = useState(null)
  const [arenaId, setArenaId] = useState(() => {
    try { return localStorage.getItem(ARENA_KEY) } catch { return null }
  })
  const [error, setError] = useState('')

  const load = () => api.getMyArenas().then(setArenas).catch(err => setError(err.message))
  useEffect(() => { load() }, [])

  const selectArena = id => {
    setArenaId(id)
    try { localStorage.setItem(ARENA_KEY, id) } catch { /* preferência opcional */ }
  }

  if (error) return <FullScreenMessage title="Não foi possível carregar"><p className="auth-text">{error}</p><button className="primary" onClick={() => { setError(''); load() }}>Tentar novamente</button></FullScreenMessage>
  if (!arenas) return <FullScreenMessage title="Carregando…"/>
  if (!arenas.length) return <Onboarding user={user} onCreated={async id => { await load(); selectArena(id) }}/>

  const arena = arenas.find(item => item.id === arenaId) || arenas[0]
  const setArena = updated => setArenas(list => list.map(item => (item.id === updated.id ? { ...item, ...updated } : item)))

  return (
    <PainelProvider key={arena.id} arena={arena} setArena={setArena} arenas={arenas}>
      <Routes>
        <Route element={<Shell user={user} selectArena={selectArena}/>}>
          <Route index element={<Dashboard/>}/>
          <Route path="solicitacoes" element={<Requests/>}/>
          <Route path="agenda" element={<Agenda/>}/>
          <Route path="reservas" element={<Reservations/>}/>
          <Route path="clientes" element={<Clients/>}/>
          <Route path="configuracoes" element={<Settings/>}/>
          <Route path="*" element={<Dashboard/>}/>
        </Route>
      </Routes>
    </PainelProvider>
  )
}

const slugify = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

function Onboarding({ user, onCreated }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onCreated(await api.createArena(slug, name))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <FullScreenMessage title="Cadastre sua arena">
      <p className="auth-text">Logado como {user.email}. Depois você adiciona as quadras, horários e preços.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>Nome da arena<input required value={name} autoFocus onChange={event => { setName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)) }} placeholder="Ex.: Arena Sol"/></label>
        <label>Endereço da página
          <div className="slug-input"><span>{window.location.host}/</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} value={slug} onChange={event => { setSlugTouched(true); setSlug(slugify(event.target.value)) }}/></div>
        </label>
        {error && <p className="form-message error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Criando…' : 'Criar arena'}</button>
        <button type="button" className="text-button center" onClick={() => supabase.auth.signOut()}>Sair</button>
      </form>
    </FullScreenMessage>
  )
}

function Shell({ user, selectArena }) {
  const { arena, arenas, pending, notice, loading, loadError, reload, selectedBooking, bookingForm, openBooking, openBookingForm } = usePainel()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const location = useLocation()
  const title = TITLES[location.pathname.replace(/\/$/, '')] || 'Painel'

  useEffect(() => { setMenuOpen(false); setNotificationsOpen(false) }, [location.pathname])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <Link className="brand" to="/painel">
          <div className="brand-mark"><span>{initials(arena.name) || 'AV'}</span><i></i></div>
          <div><strong>{arena.name.toUpperCase()}</strong><small>GESTÃO ESPORTIVA</small></div>
        </Link>
        <nav aria-label="Menu principal">
          <p className="nav-label">OPERAÇÃO</p>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <Icon name={item.icon}/><span>{item.label}</span>
              {item.badge && pending.length > 0 && <em>{pending.length}</em>}
            </NavLink>
          ))}
          <p className="nav-label lower">ADMINISTRAÇÃO</p>
          <NavLink to="/painel/configuracoes"><Icon name="settings"/><span>Arena e quadras</span></NavLink>
          <a href={`/${arena.slug}`} target="_blank" rel="noreferrer"><Icon name="link"/><span>Ver página pública</span></a>
        </nav>
        <div className="sidebar-bottom">
          {arenas.length > 1 && (
            <label className="arena-switch">
              <span>ARENA</span>
              <select value={arena.id} onChange={event => selectArena(event.target.value)}>
                {arenas.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          <div className="profile">
            <div className="avatar">{initials(user.email)}</div>
            <div><strong>{user.email}</strong><span>{arena.role === 'owner' ? 'Proprietário' : 'Equipe'}</span></div>
            <button onClick={() => supabase.auth.signOut()} aria-label="Sair" title="Sair"><Icon name="logout" size={17}/></button>
          </div>
        </div>
      </aside>
      {menuOpen && <div className="nav-backdrop" onClick={() => setMenuOpen(false)}/>}

      <main>
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Icon name="menu"/></button>
          <div className="page-title"><span>PAINEL DE CONTROLE</span><h1>{title}</h1></div>
          <div className="top-actions">
            <div className="notification-wrap">
              <button className={`icon-button ${notificationsOpen ? 'selected' : ''}`} onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Solicitações pendentes" aria-expanded={notificationsOpen}>
                <Icon name="bell"/>{pending.length > 0 && <i>{pending.length}</i>}
              </button>
              {notificationsOpen && <Notifications close={() => setNotificationsOpen(false)}/>}
            </div>
            <button className="primary" onClick={() => openBookingForm({})}><Icon name="plus"/> Nova reserva</button>
          </div>
        </header>
        <div className="content">
          {loadError
            ? <div className="panel empty"><strong>Não foi possível carregar os dados</strong><span>{loadError}</span><button className="secondary" onClick={reload}>Tentar novamente</button></div>
            : loading ? <div className="panel empty"><span>Carregando…</span></div> : <Outlet/>}
        </div>
      </main>

      {bookingForm && <BookingForm initial={bookingForm} close={() => openBookingForm(null)}/>}
      {selectedBooking && !bookingForm && <BookingDrawer booking={selectedBooking} close={() => openBooking(null)}/>}
      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={18}/>{notice.message}
          {notice.action && <a href={notice.action.href} target="_blank" rel="noreferrer">{notice.action.label}</a>}
        </div>
      )}
    </div>
  )
}

function Notifications({ close }) {
  const { pending, courtById, openBooking, arena } = usePainel()
  return (
    <div className="notifications" role="dialog" aria-label="Solicitações pendentes">
      <div className="notifications-head">
        <div><span>SOLICITAÇÕES</span><strong>Aguardando resposta</strong></div>
        <button onClick={close} aria-label="Fechar"><Icon name="close" size={18}/></button>
      </div>
      {pending.length ? pending.slice(0, 6).map(item => (
        <button className="notification-item" key={item.id} onClick={() => { openBooking(item); close() }}>
          <i></i>
          <div><strong>{item.customer_name}</strong><span>{courtById[item.court_id]?.name} · {new Date(item.starts_at).toLocaleString('pt-BR', { timeZone: arena.timezone, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
          <Icon name="arrow" size={16}/>
        </button>
      )) : (
        <div className="notifications-empty"><Icon name="check"/><strong>Tudo em dia</strong><span>Nenhuma solicitação aguardando.</span></div>
      )}
      {pending.length > 6 && <Link className="notifications-more" to="/painel/solicitacoes" onClick={close}>Ver todas ({pending.length})</Link>}
    </div>
  )
}
