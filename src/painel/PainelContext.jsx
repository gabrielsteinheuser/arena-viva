import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { addDays, confirmationMessage, todayKey, whatsappUrl, zonedToUtc } from '../lib/format.js'

const PainelContext = createContext(null)
export const usePainel = () => useContext(PainelContext)

// Janela de reservas carregada no painel (o histórico mais antigo fica no banco).
const PAST_DAYS = 90
const FUTURE_DAYS = 180

const sortByStart = list => [...list].sort((a, b) => a.starts_at.localeCompare(b.starts_at))

export function PainelProvider({ arena, setArena, arenas, children }) {
  const [courts, setCourts] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [bookingForm, setBookingForm] = useState(null)
  const noticeTimer = useRef(null)

  const timeZone = arena.timezone

  const notify = useCallback((message, action) => {
    setNotice({ message, action })
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), action ? 9000 : 3200)
  }, [])
  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const reloadCourts = useCallback(async () => setCourts(await api.listCourts(arena.id)), [arena.id])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const today = todayKey(timeZone)
      const from = zonedToUtc(addDays(today, -PAST_DAYS), '00:00', timeZone).toISOString()
      const to = zonedToUtc(addDays(today, FUTURE_DAYS), '00:00', timeZone).toISOString()
      const [courtList, bookingList] = await Promise.all([api.listCourts(arena.id), api.listBookings(arena.id, from, to)])
      setCourts(courtList)
      setBookings(bookingList)
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [arena.id, timeZone])

  useEffect(() => { load() }, [load])

  const upsertBooking = useCallback(booking => {
    setBookings(list => sortByStart([...list.filter(item => item.id !== booking.id), booking]))
    setSelectedBooking(current => (current?.id === booking.id ? booking : current))
  }, [])

  // Novas solicitações da LP chegam em tempo real.
  useEffect(() => {
    const channel = supabase
      .channel(`bookings-${arena.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `arena_id=eq.${arena.id}` }, payload => {
        if (payload.eventType === 'DELETE') {
          setBookings(list => list.filter(item => item.id !== payload.old.id))
          return
        }
        upsertBooking(payload.new)
        if (payload.eventType === 'INSERT' && payload.new.source === 'site') {
          notify(`Nova solicitação de ${payload.new.customer_name}.`)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [arena.id, notify, upsertBooking])

  const courtById = useMemo(() => Object.fromEntries(courts.map(court => [court.id, court])), [courts])
  const pending = useMemo(() => bookings.filter(item => item.status === 'pendente' && new Date(item.ends_at) > new Date()), [bookings])

  const setStatus = useCallback(async (booking, status, message) => {
    const saved = await api.setBookingStatus(booking.id, status)
    upsertBooking(saved)
    if (message) notify(message)
    return saved
  }, [notify, upsertBooking])

  // Confirma a reserva e abre o WhatsApp do solicitante com a mensagem do template.
  // A aba é aberta antes da chamada ao banco para não ser barrada pelo bloqueador de pop-ups.
  const confirmAndNotify = useCallback(async booking => {
    const url = booking.phone
      ? whatsappUrl(booking.phone, confirmationMessage({ arena, booking, court: courtById[booking.court_id] }))
      : null
    const tab = url ? window.open('', '_blank') : null
    try {
      const saved = await setStatus(booking, 'confirmada')
      if (tab) {
        tab.opener = null
        tab.location.href = url
        notify('Reserva confirmada. Envie a mensagem no WhatsApp.')
      } else if (url) {
        notify('Reserva confirmada.', { href: url, label: 'Abrir WhatsApp' })
      } else {
        notify('Reserva confirmada. Sem telefone cadastrado para avisar o cliente.')
      }
      return saved
    } catch (error) {
      tab?.close()
      throw error
    }
  }, [arena, courtById, notify, setStatus])

  const value = {
    arena, setArena, arenas, courts, courtById, reloadCourts, setCourts,
    bookings, pending, loading, loadError, reload: load, upsertBooking,
    notice, notify, setStatus, confirmAndNotify,
    selectedBooking, openBooking: setSelectedBooking,
    bookingForm, openBookingForm: setBookingForm,
  }

  return <PainelContext.Provider value={value}>{children}</PainelContext.Provider>
}
