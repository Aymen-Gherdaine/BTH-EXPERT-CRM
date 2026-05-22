import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateNumeroOffre } from '@/lib/utils'

describe('generateNumeroOffre', () => {
  afterEach(() => vi.useRealTimers())

  it('commence par T', () => expect(generateNumeroOffre()).toMatch(/^T/))

  it('a exactement 9 caractères', () => expect(generateNumeroOffre()).toHaveLength(9))

  it('respecte le format T[0-9]{8}', () => expect(generateNumeroOffre()).toMatch(/^T\d{8}$/))

  it('retourne T30042026 pour le 30 avril 2026', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-30T12:00:00'))
    expect(generateNumeroOffre()).toBe('T30042026')
  })
})
