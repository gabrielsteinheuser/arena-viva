import { supabase } from './supabase.js'

// Converte erros do Supabase/Postgres em mensagens para o usuário.
export function errorMessage(error) {
  if (!error) return ''
  if (error.code === 'P0001') return error.message
  if (error.code === '23P01') return 'Já existe uma reserva ativa nessa quadra e horário.'
  if (error.code === '23505') return 'Já existe um registro com esse nome.'
  if (error.code === '23503') return 'Não é possível excluir: existem reservas ligadas a este item.'
  if (error.code === '23514') return 'Verifique os dados informados.'
  if (error.message?.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (error.message?.includes('Failed to fetch')) return 'Sem conexão com o servidor. Tente novamente.'
  return error.message || 'Algo deu errado. Tente novamente.'
}

async function run(query) {
  const { data, error } = await query
  if (error) throw Object.assign(new Error(errorMessage(error)), { cause: error })
  return data
}

const byPosition = (a, b) => a.position - b.position || a.name.localeCompare(b.name)

// --------------------------------------------------------------- LP pública

export async function getPublicArena(slug) {
  const arena = await run(supabase.from('arenas').select('*, courts(*, hours:court_hours(*))').eq('slug', slug).maybeSingle())
  if (arena) arena.courts = arena.courts.filter(court => court.active).sort(byPosition)
  return arena
}

export const getAvailableSlots = (courtId, dateKey) =>
  run(supabase.rpc('available_slots', { p_court: courtId, p_date: dateKey }))

export const requestBooking = ({ courtId, startsAt, name, phone, people }) =>
  run(supabase.rpc('request_booking', { p_court: courtId, p_starts_at: startsAt, p_name: name, p_phone: phone, p_people: people }))

// --------------------------------------------------------------- painel

export const getMyArenas = async () =>
  (await run(supabase.from('arena_members').select('role, arena:arenas(*)'))).map(row => ({ ...row.arena, role: row.role }))

export const createArena = (slug, name) => run(supabase.rpc('create_arena', { p_slug: slug, p_name: name }))

export const updateArena = (id, fields) => run(supabase.from('arenas').update(fields).eq('id', id).select().single())

export const listCourts = async arenaId =>
  (await run(supabase.from('courts').select('*, hours:court_hours(*)').eq('arena_id', arenaId))).sort(byPosition)

export function saveCourt({ hours, ...court }) {
  return court.id
    ? run(supabase.from('courts').update(court).eq('id', court.id).select().single())
    : run(supabase.from('courts').insert(court).select().single())
}

export const deleteCourt = id => run(supabase.from('courts').delete().eq('id', id))

// Substitui os horários de funcionamento da quadra.
export async function saveCourtHours(court, hours) {
  await run(supabase.from('court_hours').delete().eq('court_id', court.id))
  if (hours.length) {
    await run(supabase.from('court_hours').insert(hours.map(row => ({ ...row, arena_id: court.arena_id, court_id: court.id }))))
  }
}

export const listBookings = (arenaId, fromIso, toIso) =>
  run(supabase.from('bookings').select('*').eq('arena_id', arenaId).gte('starts_at', fromIso).lt('starts_at', toIso).order('starts_at'))

export function saveBooking(booking) {
  const { id, created_at, updated_at, ...fields } = booking
  return id
    ? run(supabase.from('bookings').update(fields).eq('id', id).select().single())
    : run(supabase.from('bookings').insert(fields).select().single())
}

export const setBookingStatus = (id, status) =>
  run(supabase.from('bookings').update({ status }).eq('id', id).select().single())
