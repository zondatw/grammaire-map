export type Theme = 'light' | 'dark' | 'system'

const KEY = 'grammaireMap_theme'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem(KEY) as Theme) ?? 'system'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(KEY, theme)
}
