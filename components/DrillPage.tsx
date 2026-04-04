'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Language, LanguageData, MasteryState } from '@/lib/types'
import { SUPPORTED_LANGUAGES } from '@/lib/types'
import { getMasteryState, saveMasteryState, advanceMastery, getStartDate, getLanguage, saveLanguage } from '@/lib/state'
import { getTodayRuleId } from '@/lib/curriculum'
import DrillCard from './DrillCard'
import ThemeToggle from './ThemeToggle'

const GrammarMap = dynamic(() => import('./GrammarMap'), { ssr: false })

interface Props {
  allLanguages: Record<string, LanguageData>
}

const MASTERY_ICONS: Record<number, string> = { 0: '○', 1: '◑', 2: '●' }

export default function DrillPage({ allLanguages }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [lang, setLang] = useState<Language>('fr')
  const [masteryState, setMasteryState] = useState<MasteryState | null>(null)
  const [todayRuleId, setTodayRuleId] = useState<string | null>(null)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [drillsDone, setDrillsDone] = useState(false)

  // Hydrate from localStorage after mount
  useEffect(() => {
    const paramLang = searchParams.get('lang') as Language | null
    const savedLang = getLanguage()
    const activeLang: Language = (paramLang === 'fr' || paramLang === 'es' || paramLang === 'it') ? paramLang : savedLang

    if (activeLang !== savedLang) saveLanguage(activeLang)
    setLang(activeLang)

    const data = allLanguages[activeLang]
    if (!data) return

    const state = getMasteryState(activeLang)
    const startDate = getStartDate(activeLang)
    const todayId = getTodayRuleId(data.orderedIds, startDate)

    const paramId = searchParams.get('rule')
    const resolvedId = (paramId && data.orderedIds.includes(paramId)) ? paramId : todayId

    let next = state
    if (resolvedId) {
      next = advanceMastery(state, resolvedId, 'seen')
      saveMasteryState(next, activeLang)
    }

    setMasteryState(next)
    setTodayRuleId(todayId)
    setSelectedRuleId(resolvedId)
  }, [allLanguages, searchParams])

  const data = allLanguages[lang]
  const activeRule = selectedRuleId && data
    ? (data.rules.find((r) => r.id === selectedRuleId) ?? data.rules[0])
    : data?.rules[0]

  const drills = activeRule && data ? (data.drills[activeRule.id] ?? []) : []
  const isToday = selectedRuleId === todayRuleId

  const handleLangChange = useCallback((newLang: Language) => {
    saveLanguage(newLang)
    setLang(newLang)
    setDrillsDone(false)

    const newData = allLanguages[newLang]
    if (!newData) return
    const state = getMasteryState(newLang)
    const startDate = getStartDate(newLang)
    const todayId = getTodayRuleId(newData.orderedIds, startDate)

    const next = todayId ? advanceMastery(state, todayId, 'seen') : state
    if (todayId) saveMasteryState(next, newLang)

    setMasteryState(next)
    setTodayRuleId(todayId)
    setSelectedRuleId(todayId)
    router.replace(`/drill?lang=${newLang}`, { scroll: false })
  }, [allLanguages, router])

  const handleRuleChange = useCallback((newId: string) => {
    setMasteryState((prev) => {
      const current = prev ?? {}
      const next = advanceMastery(current, newId, 'seen')
      saveMasteryState(next, lang)
      return next
    })
    setSelectedRuleId(newId)
    setDrillsDone(false)
    router.replace(`/drill?rule=${encodeURIComponent(newId)}&lang=${lang}`, { scroll: false })
  }, [router, lang])

  const handleDrillsComplete = useCallback(() => {
    if (!activeRule) return
    setMasteryState((prev) => {
      const current = prev ?? {}
      const next = advanceMastery(current, activeRule.id, 'drills_complete')
      saveMasteryState(next, lang)
      return next
    })
    setDrillsDone(true)
  }, [activeRule, lang])

  // Loading skeleton
  if (masteryState === null || !data) {
    return (
      <div className="app-layout">
        <div className="panel-left"><div className="skeleton-rule" /></div>
        <div className="panel-right"><div className="skeleton-map" /></div>
      </div>
    )
  }

  if (!activeRule) return <p>No rule found.</p>

  return (
    <div className="app-layout">
      <div className="panel-left">
        <header className="rule-header">
          <Link href={`/?lang=${lang}`} className="btn-back" aria-label="Back to map">←</Link>
          {isToday ? (
            <span className="badge-new">TODAY</span>
          ) : (
            <span className="badge-review">FREE STUDY</span>
          )}
          <h1 className="rule-title" style={{ flex: 1 }}>{activeRule.title}</h1>
          <ThemeToggle />
        </header>

        {/* Language + rule pickers */}
        <div className="rule-selector-wrap">
          <div className="lang-switcher lang-switcher-inline">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`lang-btn${lang === l.code ? ' active' : ''}`}
                onClick={() => handleLangChange(l.code)}
                title={l.label}
              >
                {l.flag}
              </button>
            ))}
          </div>
          <label htmlFor="rule-select" className="rule-selector-label">Study:</label>
          <select
            id="rule-select"
            className="rule-selector"
            value={selectedRuleId ?? ''}
            onChange={(e) => handleRuleChange(e.target.value)}
          >
            {data.rules.map((r) => {
              const level = (masteryState[r.id] ?? 0) as number
              const icon = MASTERY_ICONS[level] ?? '○'
              return (
                <option key={r.id} value={r.id}>
                  {icon} {r.title}{r.id === todayRuleId ? ' (today)' : ''}
                </option>
              )
            })}
          </select>
        </div>

        <article
          className="rule-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(activeRule.body) }}
        />

        {!drillsDone ? (
          <section className="drills-section">
            <h2 className="drills-heading">Practice</h2>
            <DrillCard drills={drills} onComplete={handleDrillsComplete} />
          </section>
        ) : (
          <div className="drills-complete-banner">
            <p>{isToday ? 'Rule mastered! Check your map →' : 'Section complete! Keep exploring ↓'}</p>
            {isToday ? (
              <Link href={`/?lang=${lang}`} className="btn-view-map">View Grammar Map</Link>
            ) : (
              <button
                className="btn-view-map"
                onClick={() => {
                  const nextRule = data.rules.find(
                    (r) => r.id !== activeRule.id && (masteryState[r.id] ?? 0) < 2
                  )
                  if (nextRule) handleRuleChange(nextRule.id)
                  else router.push(`/?lang=${lang}`)
                }}
              >
                Next Section →
              </button>
            )}
          </div>
        )}
      </div>

      <div className="panel-right">
        <div className="map-container">
          <GrammarMap
            graph={data.graph}
            masteryState={masteryState}
            todayRuleId={todayRuleId}
            onNodeClick={(id) => handleRuleChange(id)}
          />
        </div>
      </div>
    </div>
  )
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')

  html = html.replace(/((?:<li>[^\n]*<\/li>\n?)+)/g, (block) => `<ul>${block}</ul>`)

  html = html.replace(/^\|(.+)\|$/gm, (line) => {
    const cells = line.slice(1, -1).split('|').map((c) => `<td>${c.trim()}</td>`).join('')
    return `<tr>${cells}</tr>`
  })
  html = html.replace(/(<tr>.*<\/tr>\n?)+/gs, (block) => {
    const cleaned = block.replace(/<tr>(<td>[-:| ]+<\/td>)+<\/tr>\n?/g, '')
    return `<table>${cleaned}</table>`
  })

  html = html.replace(/^(?!<[a-zA-Z/])(.*\S.*)$/gm, '<p>$1</p>')

  return html
}
