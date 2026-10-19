// Formatação e datas. Todas as datas "locais" usam o fuso da arena, nunca o do navegador.
// `dateKey` é sempre uma string 'AAAA-MM-DD'.

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const brl = value => brlFormatter.format(Number(value) || 0)

export const STATUS_LABELS = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  recusada: 'Recusada',
  cancelada: 'Cancelada',
}

export const ACTIVE_STATUSES = ['pendente', 'confirmada']

const partsCache = new Map()
function zonedParts(date, timeZone) {
  if (!partsCache.has(timeZone)) {
    partsCache.set(timeZone, new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }))
  }
  return Object.fromEntries(partsCache.get(timeZone).formatToParts(date).map(part => [part.type, part.value]))
}

function offsetMs(date, timeZone) {
  const p = zonedParts(date, timeZone)
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return asUtc - (date.getTime() - date.getMilliseconds())
}

export function localDateKey(value, timeZone = DEFAULT_TIMEZONE) {
  const p = zonedParts(new Date(value), timeZone)
  return `${p.year}-${p.month}-${p.day}`
}

export function localTime(value, timeZone = DEFAULT_TIMEZONE) {
  const p = zonedParts(new Date(value), timeZone)
  return `${p.hour}:${p.minute}`
}

export function localMinutes(value, timeZone = DEFAULT_TIMEZONE) {
  const p = zonedParts(new Date(value), timeZone)
  return Number(p.hour) * 60 + Number(p.minute)
}

// Converte data + hora no fuso da arena para um instante (Date em UTC).
export function zonedToUtc(dateKey, time, timeZone = DEFAULT_TIMEZONE) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const first = guess - offsetMs(new Date(guess), timeZone)
  return new Date(guess - offsetMs(new Date(first), timeZone))
}

export const todayKey = (timeZone = DEFAULT_TIMEZONE) => localDateKey(new Date(), timeZone)

const keyToUtcDate = dateKey => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function addDays(dateKey, days) {
  const date = keyToUtcDate(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export const weekdayOf = dateKey => keyToUtcDate(dateKey).getUTCDay()

// Segunda-feira da semana de `dateKey`.
export const startOfWeek = dateKey => addDays(dateKey, -((weekdayOf(dateKey) + 6) % 7))

export function formatDateKey(dateKey, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(keyToUtcDate(dateKey))
}

export const timeToMinutes = time => {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export const minutesToTime = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export function formatRelative(value, now = new Date()) {
  const minutes = Math.round((now - new Date(value)) / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.round(hours / 24)
  return `há ${days} dia${days > 1 ? 's' : ''}`
}

export const phoneDigits = value => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits
}

export const isValidPhone = value => /^[1-9][0-9]9?[0-9]{8}$/.test(phoneDigits(value))

export function formatPhone(value) {
  const digits = phoneDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  const local = digits.slice(2)
  const split = local.length > 8 ? 5 : 4
  return `(${digits.slice(0, 2)}) ${local.slice(0, split)}${local.length > split ? `-${local.slice(split)}` : ''}`
}

export const initials = name => String(name || '')
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map(part => part[0].toUpperCase())
  .slice(0, 2)
  .join('')

export const TEMPLATE_VARIABLES = ['nome', 'arena', 'quadra', 'data', 'horario', 'pessoas', 'valor']

export const fillTemplate = (template, values) =>
  String(template || '').replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match))

export function confirmationMessage({ arena, booking, court }) {
  const timeZone = arena.timezone || DEFAULT_TIMEZONE
  const dateKey = localDateKey(booking.starts_at, timeZone)
  return fillTemplate(arena.confirmation_template, {
    nome: booking.customer_name.split(' ')[0],
    arena: arena.name,
    quadra: court?.name || 'Quadra',
    data: formatDateKey(dateKey, { weekday: 'long', day: '2-digit', month: '2-digit' }),
    horario: `${localTime(booking.starts_at, timeZone)} às ${localTime(booking.ends_at, timeZone)}`,
    pessoas: booking.people,
    valor: brl(booking.price).replace(/ /g, ' '),
  })
}

// Usa api.whatsapp.com direto: o redirecionamento do wa.me corrompe emojis da mensagem.
export const whatsappUrl = (phone, text = '') =>
  `https://api.whatsapp.com/send?phone=55${phoneDigits(phone)}${text ? `&text=${encodeURIComponent(text)}` : ''}`
