'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Language, LanguageData, MasteryState } from '@/lib/types'
import { SUPPORTED_LANGUAGES } from '@/lib/types'
import { getMasteryState, getStartDate, getLanguage, saveLanguage } from '@/lib/state'
import { getTodayRuleId } from '@/lib/curriculum'
import ThemeToggle from './ThemeToggle'

const GrammarMap = dynamic(() => import('./GrammarMap'), { ssr: false })

interface Props {
  allLanguages: Record<string, LanguageData>
}

export default function MapPage({ allLanguages }: Props) {
  const [lang, setLang] = useState<Language>('fr')
  const [masteryState, setMasteryState] = useState<MasteryState | null>(null)
  const [todayRuleId, setTodayRuleId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const savedLang = getLanguage()
    setLang(savedLang)
    const data = allLanguages[savedLang]
    if (!data) return
    const state = getMasteryState(savedLang)
    const startDate = getStartDate(savedLang)
    const ruleId = getTodayRuleId(data.orderedIds, startDate)
    setMasteryState(state)
    setTodayRuleId(ruleId)
  }, [allLanguages])

  const handleLangChange = useCallback((newLang: Language) => {
    saveLanguage(newLang)
    setLang(newLang)
    const data = allLanguages[newLang]
    if (!data) return
    const state = getMasteryState(newLang)
    const startDate = getStartDate(newLang)
    const ruleId = getTodayRuleId(data.orderedIds, startDate)
    setMasteryState(state)
    setTodayRuleId(ruleId)
  }, [allLanguages])

  const handleNodeClick = useCallback((id: string) => {
    router.push(`/drill?rule=${encodeURIComponent(id)}&lang=${lang}`)
  }, [router, lang])

  const data = allLanguages[lang]
  const masteredCount = masteryState
    ? Object.values(masteryState).filter((v) => v === 2).length
    : 0

  return (
    <div className="map-page">
      <header className="map-page-header">
        <div>
          <h1 className="map-page-title">GrammaireMap</h1>
          <p className="map-page-subtitle">Your language grammar knowledge</p>
        </div>
        <div className="map-page-stats">
          <div className="lang-switcher">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`lang-btn${lang === l.code ? ' active' : ''}`}
                onClick={() => handleLangChange(l.code)}
                title={l.label}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <span className="stat">{masteredCount} mastered</span>
          <ThemeToggle />
          <Link href={`/drill?lang=${lang}`} className="btn-drill">Today&apos;s Drill →</Link>
        </div>
      </header>

      <div className="map-page-legend">
        <span className="legend-item legend-unseen">Unseen</span>
        <span className="legend-item legend-seen">Seen</span>
        <span className="legend-item legend-mastered">Mastered</span>
        <span className="legend-item legend-today">Today</span>
        <span className="legend-item legend-hint">Click any node to study it</span>
      </div>

      {masteryState !== null && data ? (
        <div className="map-page-canvas">
          <GrammarMap
            graph={data.graph}
            masteryState={masteryState}
            todayRuleId={todayRuleId}
            onNodeClick={handleNodeClick}
          />
        </div>
      ) : (
        <div className="skeleton-map" />
      )}
    </div>
  )
}
