import { describe, it, expect } from 'vitest'
import { nombreEnLettres } from '@/lib/generate-document'

describe('nombreEnLettres', () => {
  // Cas de base
  it('0 → zéro', () => expect(nombreEnLettres(0)).toBe('zéro'))
  it('1 → un', () => expect(nombreEnLettres(1)).toBe('un'))
  it('10 → dix', () => expect(nombreEnLettres(10)).toBe('dix'))
  it('11 → onze', () => expect(nombreEnLettres(11)).toBe('onze'))
  it('20 → vingt', () => expect(nombreEnLettres(20)).toBe('vingt'))
  it('21 → vingt-et-un', () => expect(nombreEnLettres(21)).toBe('vingt-et-un'))
  it('30 → trente', () => expect(nombreEnLettres(30)).toBe('trente'))
  it('45 → quarante-cinq', () => expect(nombreEnLettres(45)).toBe('quarante-cinq'))

  // Soixante-dix
  it('70 → soixante-dix', () => expect(nombreEnLettres(70)).toBe('soixante-dix'))
  it('71 → soixante-onze', () => expect(nombreEnLettres(71)).toBe('soixante-onze'))

  // Quatre-vingt
  it('80 → quatre-vingts', () => expect(nombreEnLettres(80)).toBe('quatre-vingts'))
  it('81 → quatre-vingt-un', () => expect(nombreEnLettres(81)).toBe('quatre-vingt-un'))
  it('90 → quatre-vingt-dix', () => expect(nombreEnLettres(90)).toBe('quatre-vingt-dix'))
  it('91 → quatre-vingt-onze', () => expect(nombreEnLettres(91)).toBe('quatre-vingt-onze'))

  // Centaines
  it('100 → cent', () => expect(nombreEnLettres(100)).toBe('cent'))
  it('200 → deux-cents', () => expect(nombreEnLettres(200)).toBe('deux-cents'))
  it('201 → deux-cent-un', () => expect(nombreEnLettres(201)).toBe('deux-cent-un'))

  // Milliers
  it('1000 → mille', () => expect(nombreEnLettres(1000)).toBe('mille'))
  it('2000 → deux-mille', () => expect(nombreEnLettres(2000)).toBe('deux-mille'))
  it('1100 → mille-cent', () => expect(nombreEnLettres(1100)).toBe('mille-cent'))

  // Cas réels BTH
  it('45 jours (délai BTH)', () => expect(nombreEnLettres(45)).toBe('quarante-cinq'))
  it('90 jours (délai BTH)', () => expect(nombreEnLettres(90)).toBe('quatre-vingt-dix'))
  it('30 jours (validité offre)', () => expect(nombreEnLettres(30)).toBe('trente'))
})
