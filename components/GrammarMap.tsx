'use client'

import { useRef, useEffect, useState } from 'react'
import type { GraphConfig, MasteryState } from '@/lib/types'

interface Props {
  graph: GraphConfig
  masteryState: MasteryState
  todayRuleId: string | null
}

// Node style by mastery level — reads from CSS custom properties so colors stay in sync with the design system
function nodeStyle(level: 0 | 1 | 2 | undefined, isToday: boolean, tokens: CSSTokens) {
  const base = {
    'background-color': tokens.nodeBg,
    'border-color': tokens.nodeBorder,
    'border-width': 1,
    color: tokens.nodeColor,
  }
  if (level === 1) {
    return { ...base, 'background-color': tokens.seenBg, 'border-color': tokens.seenBorder, color: tokens.seenColor }
  }
  if (level === 2) {
    return { ...base, 'background-color': tokens.masteredBg, 'border-color': tokens.masteredBorder, color: tokens.masteredColor, 'border-width': 2 }
  }
  if (isToday) {
    return { ...base, 'border-color': tokens.fg, 'border-width': 3, color: tokens.fg }
  }
  return base
}

interface CSSTokens {
  nodeBg: string; nodeBorder: string; nodeColor: string
  seenBg: string; seenBorder: string; seenColor: string
  masteredBg: string; masteredBorder: string; masteredColor: string
  edgeColor: string; fg: string
}

function readTokens(): CSSTokens {
  const s = getComputedStyle(document.documentElement)
  const v = (name: string) => s.getPropertyValue(name).trim()
  return {
    nodeBg: v('--map-node-bg'), nodeBorder: v('--map-node-border'), nodeColor: v('--map-node-color'),
    seenBg: v('--map-node-seen-bg'), seenBorder: v('--map-node-seen-border'), seenColor: v('--map-node-seen-color'),
    masteredBg: v('--map-node-mastered-bg'), masteredBorder: v('--map-node-mastered-border'), masteredColor: v('--map-node-mastered-color'),
    edgeColor: v('--map-edge-color'), fg: v('--fg'),
  }
}

export default function GrammarMap({ graph, masteryState, todayRuleId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<import('cytoscape').Core | null>(null)
  // Increment to trigger style re-apply when color scheme changes
  const [schemeVersion, setSchemeVersion] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSchemeVersion((n) => n + 1)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Init Cytoscape once
  useEffect(() => {
    if (!containerRef.current) return

    let cy: import('cytoscape').Core

    import('cytoscape').then((mod) => {
      const cytoscape = mod.default
      const tokens = readTokens()

      cy = cytoscape({
        container: containerRef.current,
        elements: [
          ...graph.nodes.map((n) => ({
            data: { id: n.id, label: n.label },
          })),
          ...graph.edges.map((e) => ({
            data: { source: e.source, target: e.target },
          })),
        ],
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              'text-wrap': 'wrap',
              'text-max-width': '80px',
              'font-size': '10px',
              'text-valign': 'center',
              'text-halign': 'center',
              width: '80px',
              height: '40px',
              shape: 'roundrectangle',
              'background-color': tokens.nodeBg,
              'border-color': tokens.nodeBorder,
              'border-width': 1,
              color: tokens.nodeColor,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': tokens.edgeColor,
              'target-arrow-color': tokens.edgeColor,
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
            },
          },
        ],
        layout: {
          name: 'breadthfirst',
          directed: true,
          padding: 20,
          spacingFactor: 1.2,
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
      })

      cyRef.current = cy

      // Apply initial mastery styles
      applyStyles(cy, masteryState, todayRuleId, tokens)
    })

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reactively update styles when mastery or color scheme changes
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    applyStyles(cy, masteryState, todayRuleId, readTokens())
  }, [masteryState, todayRuleId, schemeVersion])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Grammar knowledge map"
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    />
  )
}

function applyStyles(
  cy: import('cytoscape').Core,
  masteryState: MasteryState,
  todayRuleId: string | null,
  tokens: CSSTokens
) {
  cy.batch(() => {
    cy.nodes().forEach((node) => {
      const id = node.id()
      const level = (masteryState[id] ?? 0) as 0 | 1 | 2
      const isToday = id === todayRuleId
      const style = nodeStyle(level, isToday, tokens)
      node.style(style)
    })
    cy.edges().style({
      'line-color': tokens.edgeColor,
      'target-arrow-color': tokens.edgeColor,
    })
  })
}
