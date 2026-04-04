import type { MasteryLevel, MasteryState, Language } from './types'

const MASTERY_KEY_FR = 'grammaireMap_v1'       // legacy key, kept for French
const MASTERY_KEY_ES = 'grammaireMap_v1_es'
const LEGACY_KEY = 'grammaireMap'
const START_DATE_KEY = 'startDate_v1'
const LANGUAGE_KEY = 'grammaireMap_lang'

function masteryKey(lang: Language): string {
  if (lang === 'fr') return MASTERY_KEY_FR
  return `grammaireMap_v1_${lang}`
}

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'fr'
  const stored = localStorage.getItem(LANGUAGE_KEY)
  if (stored === 'fr' || stored === 'es' || stored === 'it') return stored
  return 'fr'
}

export function saveLanguage(lang: Language): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANGUAGE_KEY, lang)
}

export function getMasteryState(lang: Language = 'fr'): MasteryState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(masteryKey(lang))
    if (raw === null) {
      if (lang === 'fr' && localStorage.getItem(LEGACY_KEY) !== null) {
        localStorage.removeItem(LEGACY_KEY)
      }
      return {}
    }
    return JSON.parse(raw) as MasteryState
  } catch {
    return {}
  }
}

export function saveMasteryState(state: MasteryState, lang: Language = 'fr'): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(masteryKey(lang), JSON.stringify(state))
}

/**
 * Advance a rule's mastery level.
 * 'seen'            → sets to 1 (only if currently 0)
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
  } else if (event === 'drills_complete' && current <= 2) {
    next = 2
  }

  if (next === current) return state
  return { ...state, [ruleId]: next }
}

export function getStartDate(lang: Language = 'fr'): string {
  if (typeof window === 'undefined') return new Date().toISOString().split('T')[0]
  const key = lang === 'fr' ? START_DATE_KEY : `${START_DATE_KEY}_${lang}`
  const stored = localStorage.getItem(key)
  if (stored && !isNaN(new Date(stored).getTime())) return stored
  const today = new Date().toISOString().split('T')[0]
  localStorage.setItem(key, today)
  return today
}
