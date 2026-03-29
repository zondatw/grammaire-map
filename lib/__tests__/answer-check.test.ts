import { describe, it, expect } from 'vitest'
import { checkMultipleChoice, checkFillIn } from '../answer-check'

describe('checkMultipleChoice', () => {
  it('correct when answers match exactly', () => {
    expect(checkMultipleChoice('le', 'le')).toBe(true)
  })

  it('incorrect when answers differ', () => {
    expect(checkMultipleChoice('la', 'le')).toBe(false)
  })

  it('case-sensitive — no match on different case', () => {
    expect(checkMultipleChoice('Le', 'le')).toBe(false)
  })
})

describe('checkFillIn', () => {
  it('correct on exact match', () => {
    const result = checkFillIn('La', 'La')
    expect(result.correct).toBe(true)
    expect(result.accentMismatch).toBe(false)
  })

  it('correct on case-insensitive match', () => {
    const result = checkFillIn('la', 'La')
    expect(result.correct).toBe(true)
  })

  it('correct after trimming whitespace', () => {
    const result = checkFillIn('  La  ', 'La')
    expect(result.correct).toBe(true)
  })

  it('correct but accentMismatch flagged when accent stripped (e vs é)', () => {
    // Engineering review decision: accent-lenient — accept, but show hint
    const result = checkFillIn('e', 'é')
    expect(result.correct).toBe(true)
    expect(result.accentMismatch).toBe(true)
    expect(result.properSpelling).toBe('é')
  })

  it('correct when accents match', () => {
    const result = checkFillIn('é', 'é')
    expect(result.correct).toBe(true)
    expect(result.accentMismatch).toBe(false)
  })

  it('correct but flagged accentMismatch when accent stripped', () => {
    const result = checkFillIn('ecole', 'école')
    expect(result.correct).toBe(true)
    expect(result.accentMismatch).toBe(true)
    expect(result.properSpelling).toBe('école')
  })

  it('incorrect for empty submission', () => {
    const result = checkFillIn('', 'La')
    expect(result.correct).toBe(false)
  })

  it('accepts mobile right single quote (U+2019) as apostrophe', () => {
    const result = checkFillIn('l\u2019ami', "l'ami")
    expect(result.correct).toBe(true)
    expect(result.accentMismatch).toBe(false)
  })

  it('accepts mobile left single quote (U+2018) as apostrophe', () => {
    const result = checkFillIn('l\u2018ami', "l'ami")
    expect(result.correct).toBe(true)
  })

  it('accepts modifier letter apostrophe (U+02BC) as apostrophe', () => {
    const result = checkFillIn('l\u02BCami', "l'ami")
    expect(result.correct).toBe(true)
  })

  it('apostrophe normalization also applies to correct answer side', () => {
    const result = checkFillIn("l'ami", 'l\u2019ami')
    expect(result.correct).toBe(true)
  })
})
