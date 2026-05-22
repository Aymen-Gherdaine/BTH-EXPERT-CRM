import { describe, it, expect } from 'vitest'
import { sanitizeAiText } from '@/lib/sanitize-ai-text'

describe('sanitizeAiText', () => {
  it('chaîne vide → ""', () => expect(sanitizeAiText('')).toBe(''))
  it('null → ""', () => expect(sanitizeAiText(null)).toBe(''))
  it('undefined → ""', () => expect(sanitizeAiText(undefined)).toBe(''))
  it('trim des espaces', () => expect(sanitizeAiText('  texte  ')).toBe('texte'))
  it('remplace { par (', () => expect(sanitizeAiText('le projet {Fill & Finish}')).toBe('le projet (Fill & Finish)'))
  it('remplace variable seule', () => expect(sanitizeAiText('{variable}')).toBe('(variable)'))
  it('normalise 3 sauts de ligne → 2', () => expect(sanitizeAiText('ligne1\n\n\nligne2')).toBe('ligne1\n\nligne2'))
  it('normalise 5 sauts de ligne → 2', () => expect(sanitizeAiText('ligne1\n\n\n\n\nligne2')).toBe('ligne1\n\nligne2'))
  it('texte normal inchangé', () => expect(sanitizeAiText('texte normal sans problème')).toBe('texte normal sans problème'))
  it('remplace plusieurs variables', () => expect(sanitizeAiText('{a} et {b}')).toBe('(a) et (b)'))
})
