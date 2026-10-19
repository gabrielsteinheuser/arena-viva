import { describe, expect, it } from 'vitest'
import {
  addDays, confirmationMessage, fillTemplate, formatPhone, isValidPhone, localDateKey, localTime,
  phoneDigits, startOfWeek, weekdayOf, whatsappUrl, zonedToUtc,
} from './format.js'

describe('datas no fuso da arena', () => {
  it('converte horário local de São Paulo para UTC', () => {
    expect(zonedToUtc('2026-10-24', '10:00', 'America/Sao_Paulo').toISOString()).toBe('2026-10-24T13:00:00.000Z')
    expect(zonedToUtc('2026-10-24', '10:00', 'America/Manaus').toISOString()).toBe('2026-10-24T14:00:00.000Z')
  })

  it('trata 24:00 como meia-noite do dia seguinte', () => {
    expect(zonedToUtc('2026-10-24', '24:00', 'America/Sao_Paulo').toISOString()).toBe('2026-10-25T03:00:00.000Z')
  })

  it('lê data e hora locais de um instante', () => {
    expect(localDateKey('2026-10-25T02:30:00Z', 'America/Sao_Paulo')).toBe('2026-10-24')
    expect(localTime('2026-10-25T02:30:00Z', 'America/Sao_Paulo')).toBe('23:30')
  })

  it('navega por dias e semanas', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(weekdayOf('2026-10-19')).toBe(1)
    expect(startOfWeek('2026-10-25')).toBe('2026-10-19')
    expect(startOfWeek('2026-10-19')).toBe('2026-10-19')
  })
})

describe('telefone', () => {
  it('normaliza e valida', () => {
    expect(phoneDigits('+55 (11) 98824-1620')).toBe('11988241620')
    expect(isValidPhone('(11) 98824-1620')).toBe(true)
    expect(isValidPhone('(11) 3333-4444')).toBe(true)
    expect(isValidPhone('1234')).toBe(false)
  })

  it('aplica máscara enquanto digita', () => {
    expect(formatPhone('11')).toBe('(11')
    expect(formatPhone('1198824')).toBe('(11) 9882-4')
    expect(formatPhone('11988241620')).toBe('(11) 98824-1620')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })
})

describe('mensagem de confirmação', () => {
  it('preenche variáveis conhecidas e mantém as desconhecidas', () => {
    expect(fillTemplate('Oi {nome}, {xyz}', { nome: 'Ana' })).toBe('Oi Ana, {xyz}')
  })

  it('monta a mensagem e o link do WhatsApp', () => {
    const text = confirmationMessage({
      arena: { name: 'Arena Viva', timezone: 'America/Sao_Paulo', confirmation_template: '{nome}|{arena}|{quadra}|{data}|{horario}|{pessoas}|{valor}' },
      booking: { customer_name: 'Marina Duarte', starts_at: '2026-10-24T13:00:00Z', ends_at: '2026-10-24T14:00:00Z', people: 4, price: 90 },
      court: { name: 'Quadra 01' },
    })
    expect(text).toBe('Marina|Arena Viva|Quadra 01|sábado, 24/10|10:00 às 11:00|4|R$ 90')
    expect(whatsappUrl('11988241620', 'Olá & até')).toBe('https://wa.me/5511988241620?text=Ol%C3%A1%20%26%20at%C3%A9')
  })
})
