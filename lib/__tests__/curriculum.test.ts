import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { daysSince, getTodayRuleId } from '../curriculum'

describe('daysSince', () => {
  it('returns 0 for null', () => {
    expect(daysSince(null)).toBe(0)
  })

  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(daysSince(today)).toBe(0)
  })

  it('returns 1 for yesterday', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
    expect(daysSince(yesterday)).toBe(1)
  })

  it('returns 0 for invalid date string', () => {
    expect(daysSince('not-a-date')).toBe(0)
  })

  it('returns 0 for a future date (clamp)', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
    expect(daysSince(tomorrow)).toBe(0)
  })
})

describe('getTodayRuleId', () => {
  it('returns the correct rule for day 0', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getTodayRuleId(['a', 'b', 'c'], today)).toBe('a')
  })

  it('wraps around on day equal to list length', () => {
    // 3 days ago → index 3 % 3 = 0
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString().split('T')[0]
    expect(getTodayRuleId(['a', 'b', 'c'], threeDaysAgo)).toBe('a')
  })

  it('returns correct index for day 1', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
    expect(getTodayRuleId(['a', 'b', 'c'], yesterday)).toBe('b')
  })

  it('returns null for empty list', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getTodayRuleId([], today)).toBeNull()
  })
})
