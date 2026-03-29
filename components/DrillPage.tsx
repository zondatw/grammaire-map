'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Rule, Drill, GraphConfig, MasteryState } from '@/lib/types'
import { getMasteryState, saveMasteryState, advanceMastery, getStartDate } from '@/lib/state'
import { getTodayRuleId } from '@/lib/curriculum'
import DrillCard from './DrillCard'
import ThemeToggle from './ThemeToggle'

const GrammarMap = dynamic(() => import('./GrammarMap'), { ssr: false })

interface Props {
  orderedIds: string[]
  allRules: Rule[]
  allDrills: Record<string, Drill[]>
  graph: GraphConfig
}

const MASTERY_ICONS: Record<number, string> = { 0: '○', 1: '◑', 2: '●' }

export default function DrillPage({ orderedIds, allRules, allDrills, graph }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [masteryState, setMasteryState] = useState<MasteryState | null>(null)
  const [todayRuleId, setTodayRuleId] = useState<string | null>(null)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [drillsDone, setDrillsDone] = useState(false)

  // Hydrate from localStorage after mount
  useEffect(() => {
    const state = getMasteryState()
    const startDate = getStartDate()
    const todayId = getTodayRuleId(orderedIds, startDate)

    // Determine which rule to show: URL param → today's rule
    const paramId = searchParams.get('rule')
    const resolvedId = (paramId && orderedIds.includes(paramId)) ? paramId : todayId

    let next = state
    if (resolvedId) {
      next = advanceMastery(state, resolvedId, 'seen')
      saveMasteryState(next)
    }

    setMasteryState(next)
    setTodayRuleId(todayId)
    setSelectedRuleId(resolvedId)
  }, [orderedIds, searchParams])

  const activeRule = selectedRuleId
    ? (allRules.find((r) => r.id === selectedRuleId) ?? allRules[0])
    : allRules[0]

  const drills = activeRule ? (allDrills[activeRule.id] ?? []) : []

  const isToday = selectedRuleId === todayRuleId

  const handleRuleChange = useCallback((newId: string) => {
    setMasteryState((prev) => {
      const current = prev ?? {}
      const next = advanceMastery(current, newId, 'seen')
      saveMasteryState(next)
      return next
    })
    setSelectedRuleId(newId)
    setDrillsDone(false)
    router.replace(`/drill?rule=${encodeURIComponent(newId)}`, { scroll: false })
  }, [router])

  const handleDrillsComplete = useCallback(() => {
    if (!activeRule) return
    setMasteryState((prev) => {
      const current = prev ?? {}
      const next = advanceMastery(current, activeRule.id, 'drills_complete')
      saveMasteryState(next)
      return next
    })
    setDrillsDone(true)
  }, [activeRule])

  // Loading skeleton until localStorage hydrated
  if (masteryState === null) {
    return (
      <div className="app-layout">
        <div className="panel-left">
          <div className="skeleton-rule" />
        </div>
        <div className="panel-right">
          <div className="skeleton-map" />
        </div>
      </div>
    )
  }

  if (!activeRule) return <p>No rule found.</p>

  return (
    <div className="app-layout">
      {/* Left panel: rule card + drills */}
      <div className="panel-left">
        <header className="rule-header">
          <Link href="/" className="btn-back" aria-label="Back to map">←</Link>
          {isToday ? (
            <span className="badge-new">TODAY</span>
          ) : (
            <span className="badge-review">FREE STUDY</span>
          )}
          <h1 className="rule-title" style={{ flex: 1 }}>{activeRule.title}</h1>
          <ThemeToggle />
        </header>

        {/* Rule picker */}
        <div className="rule-selector-wrap">
          <label htmlFor="rule-select" className="rule-selector-label">Study:</label>
          <select
            id="rule-select"
            className="rule-selector"
            value={selectedRuleId ?? ''}
            onChange={(e) => handleRuleChange(e.target.value)}
          >
            {allRules.map((r) => {
              const level = (masteryState[r.id] ?? 0) as number
              const icon = MASTERY_ICONS[level] ?? '○'
              const isTodayOption = r.id === todayRuleId
              return (
                <option key={r.id} value={r.id}>
                  {icon} {r.title}{isTodayOption ? ' (today)' : ''}
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
              <Link href="/" className="btn-view-map">View Grammar Map</Link>
            ) : (
              <button
                className="btn-view-map"
                onClick={() => {
                  const nextRule = allRules.find(
                    (r) => r.id !== activeRule.id && (masteryState[r.id] ?? 0) < 2
                  )
                  if (nextRule) handleRuleChange(nextRule.id)
                  else router.push('/')
                }}
              >
                Next Section →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right panel: grammar map */}
      <div className="panel-right">
        <div className="map-container">
          <GrammarMap
            graph={graph}
            masteryState={masteryState}
            todayRuleId={todayRuleId}
            onNodeClick={(id) => handleRuleChange(id)}
          />
        </div>
      </div>
    </div>
  )
}

// Minimal markdown renderer for rule body content
function renderMarkdown(md: string): string {
  let html = md
    // Headings
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // List items
    .replace(/^- (.+)$/gm, '<li>$1</li>')

  // Wrap consecutive <li> lines in <ul> — no dotAll flag so . stays line-scoped
  html = html.replace(/((?:<li>[^\n]*<\/li>\n?)+)/g, (block) => `<ul>${block}</ul>`)

  // Table rows: | cell | cell |
  html = html.replace(/^\|(.+)\|$/gm, (line) => {
    const cells = line.slice(1, -1).split('|').map((c) => `<td>${c.trim()}</td>`).join('')
    return `<tr>${cells}</tr>`
  })
  // Wrap consecutive <tr> in <table>, remove separator rows
  html = html.replace(/(<tr>.*<\/tr>\n?)+/gs, (block) => {
    const cleaned = block.replace(/<tr>(<td>[-:| ]+<\/td>)+<\/tr>\n?/g, '')
    return `<table>${cleaned}</table>`
  })

  // Paragraphs for bare text lines
  html = html.replace(/^(?!<[a-zA-Z/])(.*\S.*)$/gm, '<p>$1</p>')

  return html
}
