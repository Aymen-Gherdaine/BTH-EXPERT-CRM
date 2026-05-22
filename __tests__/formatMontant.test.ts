import { describe, it, expect } from 'vitest'
import { formatMontant } from '@/lib/utils'

describe('formatMontant', () => {
  it('formate zéro', () => expect(formatMontant(0)).toBe('0,00'))
  it('formate 100', () => expect(formatMontant(100)).toBe('100,00'))
  it('formate 1000 avec séparateur milliers', () => expect(formatMontant(1000)).toBe('1 000,00'))
  it('formate 100000', () => expect(formatMontant(100000)).toBe('100 000,00'))
  it('formate 1100000', () => expect(formatMontant(1100000)).toBe('1 100 000,00'))
  it('formate 803250', () => expect(formatMontant(803250)).toBe('803 250,00'))
  it('formate décimal 0.5', () => expect(formatMontant(0.5)).toBe('0,50'))
  it('formate 1234.56', () => expect(formatMontant(1234.56)).toBe('1 234,56'))
  it('gère flottant 0.1 + 0.2', () => expect(formatMontant(0.1 + 0.2)).toBe('0,30'))
})
