import { describe, it, expect } from 'vitest'
import { calcTotaux } from '@/lib/utils'

describe('calcTotaux', () => {
  it('lignes vides → tous zéros', () => {
    expect(calcTotaux([])).toEqual({ total_ht: 0, tva: 0, total_ttc: 0 })
  })

  it('1 ligne simple — 100 000 DZD', () => {
    const result = calcTotaux([{ quantite: 1, prix_unitaire: 100000 }])
    expect(result.total_ht).toBe(100000)
    expect(result.tva).toBe(19000)
    expect(result.total_ttc).toBe(119000)
  })

  it('cas réel AT PHARMA Phase II — 3 lignes mixtes', () => {
    const lignes = [
      { quantite: 1, prix_unitaire: 600000 },
      { quantite: 1, prix_unitaire: 400000 },
      { quantite: 2, prix_unitaire: 50000 },
    ]
    const result = calcTotaux(lignes)
    expect(result.total_ht).toBe(1100000)
    expect(result.tva).toBe(209000)
    expect(result.total_ttc).toBe(1309000)
  })
})
