'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { GraphConfig, MasteryState } from '@/lib/types'
import { getMasteryState, getStartDate } from '@/lib/state'
import { getTodayRuleId } from '@/lib/curriculum'

const GrammarMap = dynamic(() => import('./GrammarMap'), { ssr: false })

interface Props {
  graph: GraphConfig
  orderedIds: string[]
}

export default function MapPage({ graph, orderedIds }: Props) {
  const [masteryState, setMasteryState] = useState<MasteryState | null>(null)
  const [todayRuleId, setTodayRuleId] = useState<string | null>(null)

  useEffect(() => {
    const state = getMasteryState()
    const startDate = getStartDate()
    const ruleId = getTodayRuleId(orderedIds, startDate)
    setMasteryState(state)
    setTodayRuleId(ruleId)
  }, [orderedIds])

  const masteredCount = masteryState
    ? Object.values(masteryState).filter((v) => v === 2).length
    : 0

  return (
    <div className="map-page">
      <header className="map-page-header">
        <div>
          <h1 className="map-page-title">GrammaireMap</h1>
          <p className="map-page-subtitle">Your French grammar knowledge</p>
        </div>
        <div className="map-page-stats">
          <span className="stat">{masteredCount} mastered</span>
          <a href="/drill" className="btn-drill">Today&apos;s Drill →</a>
        </div>
      </header>

      <div className="map-page-legend">
        <span className="legend-item legend-unseen">Unseen</span>
        <span className="legend-item legend-seen">Seen</span>
        <span className="legend-item legend-mastered">Mastered</span>
        <span className="legend-item legend-today">Today</span>
      </div>

      {masteryState !== null ? (
        <div className="map-page-canvas">
          <GrammarMap
            graph={graph}
            masteryState={masteryState}
            todayRuleId={todayRuleId}
          />
        </div>
      ) : (
        <div className="skeleton-map" />
      )}
    </div>
  )
}
