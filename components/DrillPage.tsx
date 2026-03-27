'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { Rule, Drill, GraphConfig, MasteryState } from '@/lib/types'
import { getMasteryState, saveMasteryState, advanceMastery, getStartDate } from '@/lib/state'
import { getTodayRuleId } from '@/lib/curriculum'
import DrillCard from './DrillCard'

const GrammarMap = dynamic(() => import('./GrammarMap'), { ssr: false })

interface Props {
  orderedIds: string[]
  allRules: Rule[]
  allDrills: Record<string, Drill[]>
  graph: GraphConfig
}

export default function DrillPage({ orderedIds, allRules, allDrills, graph }: Props) {
  const [masteryState, setMasteryState] = useState<MasteryState | null>(null)
  const [todayRuleId, setTodayRuleId] = useState<string | null>(null)
  const [drillsDone, setDrillsDone] = useState(false)

  // Hydrate from localStorage after mount
  useEffect(() => {
    const state = getMasteryState()
    const startDate = getStartDate()
    const ruleId = getTodayRuleId(orderedIds, startDate)

    let next = state
    if (ruleId) {
      // Mark today's rule as seen on load
      next = advanceMastery(state, ruleId, 'seen')
      saveMasteryState(next)
    }

    setMasteryState(next)
    setTodayRuleId(ruleId)
  }, [orderedIds])

  const todayRule = todayRuleId
    ? (allRules.find((r) => r.id === todayRuleId) ?? allRules[0])
    : allRules[0]

  const drills = todayRule ? (allDrills[todayRule.id] ?? []) : []

  const handleDrillsComplete = useCallback(() => {
    if (!todayRule) return
    setMasteryState((prev) => {
      const current = prev ?? {}
      const next = advanceMastery(current, todayRule.id, 'drills_complete')
      saveMasteryState(next)
      return next
    })
    setDrillsDone(true)
  }, [todayRule])

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

  if (!todayRule) return <p>No rule found.</p>

  return (
    <div className="app-layout">
      {/* Left panel: rule card + drills */}
      <div className="panel-left">
        <header className="rule-header">
          {todayRuleId === todayRule.id && (
            <span className="badge-new">TODAY</span>
          )}
          <h1 className="rule-title">{todayRule.title}</h1>
        </header>

        <article
          className="rule-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(todayRule.body) }}
        />

        {!drillsDone ? (
          <section className="drills-section">
            <h2 className="drills-heading">Practice</h2>
            <DrillCard drills={drills} onComplete={handleDrillsComplete} />
          </section>
        ) : (
          <div className="drills-complete-banner">
            <p>Rule mastered! Check your map →</p>
            <a href="/" className="btn-view-map">View Grammar Map</a>
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

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)\n?(?!<li>)/g, (_, last) => last)
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, (block) => `<ul>${block}</ul>`)

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
