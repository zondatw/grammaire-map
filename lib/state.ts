import type { MasteryLevel, MasteryState } from './types'

const MASTERY_KEY = 'grammaireMap_v1'
const LEGACY_KEY = 'grammaireMap'
const START_DATE_KEY = 'startDate_v1'

export function getMasteryState(): MasteryState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(MASTERY_KEY)
    if (raw === null) {
      // Migrate: if legacy key exists, drop it and start clean
      if (localStorage.getItem(LEGACY_KEY) !== null) {
        localStorage.removeItem(LEGACY_KEY)
      }
      return {}
    }
    return JSON.parse(raw) as MasteryState
  } catch {
    return {}
  }
}

export function saveMasteryState(state: MasteryState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(MASTERY_KEY, JSON.stringify(state))
}

/**
 * Advance a rule's mastery level.
 * 'seen'           → sets to 1 (only if currently 0)
 * 'drills_complete' → sets to 2 (regardless of current level, as long as ≤ 2)
 */
export function advanceMastery(
  state: MasteryState,
  ruleId: string,
  event: 'seen' | 'drills_complete'
): MasteryState {
  const current: MasteryLevel = (state[ruleId] as MasteryLevel) ?? 0
  let next: MasteryLevel = current

  if (event === 'seen' && current === 0) {
    next = 1
  } else if (event === 'drills_complete' && current < 2) {
    next = 2
  } else if (event === 'drills_complete' && current === 2) {
    next = 2 // already at max for v1
  }

  if (next === current) return state
  return { ...state, [ruleId]: next }
}

export function getStartDate(): string {
  if (typeof window === 'undefined') return new Date().toISOString().split('T')[0]
  const stored = localStorage.getItem(START_DATE_KEY)
  if (stored && !isNaN(new Date(stored).getTime())) return stored
  const today = new Date().toISOString().split('T')[0]
  localStorage.setItem(START_DATE_KEY, today)
  return today
}
