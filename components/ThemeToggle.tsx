'use client'

import { useState, useEffect } from 'react'
import type { Theme } from '@/lib/theme'
import { getStoredTheme, applyTheme } from '@/lib/theme'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: '☀' },
  { value: 'dark',  label: '☾' },
  { value: 'system', label: '⊙' },
]

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  function handleSelect(t: Theme) {
    setTheme(t)
    applyTheme(t)
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          className={`theme-toggle-btn${theme === value ? ' active' : ''}`}
          onClick={() => handleSelect(value)}
          title={value.charAt(0).toUpperCase() + value.slice(1)}
          aria-pressed={theme === value}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
