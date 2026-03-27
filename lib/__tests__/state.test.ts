import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getMasteryState, saveMasteryState, advanceMastery } from '../state'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })
Object.defineProperty(global, 'window', { value: global })

beforeEach(() => {
  localStorageMock.clear()
})

describe('getMasteryState', () => {
  it('returns {} when key is missing', () => {
    expect(getMasteryState()).toEqual({})
  })

  it('returns parsed state when valid JSON is present', () => {
    localStorageMock.setItem('grammaireMap_v1', JSON.stringify({ 'rule-a': 1 }))
    expect(getMasteryState()).toEqual({ 'rule-a': 1 })
  })

  it('returns {} on corrupt JSON', () => {
    localStorageMock.setItem('grammaireMap_v1', 'not-json{{{')
    expect(getMasteryState()).toEqual({})
  })

  it('clears legacy key if v1 key is missing', () => {
    localStorageMock.setItem('grammaireMap', JSON.stringify({ 'rule-a': 2 }))
    getMasteryState()
    expect(localStorageMock.getItem('grammaireMap')).toBeNull()
  })
})

describe('advanceMastery', () => {
  it('sets unseen rule to 1 on seen event', () => {
    const result = advanceMastery({}, 'rule-a', 'seen')
    expect(result['rule-a']).toBe(1)
  })

  it('sets level 1 to 2 on drills_complete', () => {
    const result = advanceMastery({ 'rule-a': 1 }, 'rule-a', 'drills_complete')
    expect(result['rule-a']).toBe(2)
  })

  it('stays at 2 on drills_complete when already 2', () => {
    const result = advanceMastery({ 'rule-a': 2 }, 'rule-a', 'drills_complete')
    expect(result['rule-a']).toBe(2)
  })

  it('jumps from 0 to 2 on drills_complete (skip seen)', () => {
    const result = advanceMastery({}, 'rule-a', 'drills_complete')
    expect(result['rule-a']).toBe(2)
  })

  it('creates new key at 1 for seen event on empty state', () => {
    const result = advanceMastery({}, 'new-rule', 'seen')
    expect(result['new-rule']).toBe(1)
  })

  it('does not mutate original state', () => {
    const original = { 'rule-a': 1 as const }
    advanceMastery(original, 'rule-a', 'drills_complete')
    expect(original['rule-a']).toBe(1)
  })
})
