import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateNumeroOffre } from '@/lib/utils'

describe('generateNumeroOffre', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('commence par T', () => expect(generateNumeroOffre()).toMatch(/^T/))

  // Format : T + date (jjmmaaaa) + "-" + suffixe anti-collision (4 chiffres)
  it('respecte le format T[0-9]{8}-[0-9]{4}', () =>
    expect(generateNumeroOffre()).toMatch(/^T\d{8}-\d{4}$/))

  it('a exactement 14 caractères', () =>
    expect(generateNumeroOffre()).toHaveLength(14))

  it('encode la date du jour — 30 avril 2026 → T30042026-xxxx', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-30T12:00:00'))
    vi.spyOn(Math, 'random').mockReturnValue(0) // suffixe déterministe = 1000
    expect(generateNumeroOffre()).toBe('T30042026-1000')
  })

  it('ajoute un suffixe aléatoire pour éviter les doublons (numero_offre est UNIQUE en base)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-30T12:00:00'))
    // Même jour, plusieurs générations → les numéros doivent différer
    const values = new Set(Array.from({ length: 50 }, () => generateNumeroOffre()))
    expect(values.size).toBeGreaterThan(1)
  })
})
