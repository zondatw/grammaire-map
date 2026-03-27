'use client'

import { useRef, useEffect } from 'react'
import type { GraphConfig, MasteryState } from '@/lib/types'

interface Props {
  graph: GraphConfig
  masteryState: MasteryState
  todayRuleId: string | null
}

// Node style by mastery level
function nodeStyle(level: 0 | 1 | 2 | undefined, isToday: boolean) {
  const base = {
    'background-color': '#f5f5f5',
    'border-color': '#ccc',
    'border-width': 1,
    color: '#999',
  }
  if (level === 1) {
    return { ...base, 'background-color': '#d1d5db', 'border-color': '#9ca3af', color: '#374151', 'border-width': 1 }
  }
  if (level === 2) {
    return { ...base, 'background-color': '#374151', 'border-color': '#111827', color: '#fff', 'border-width': 2 }
  }
  if (isToday) {
    return { ...base, 'border-color': '#000', 'border-width': 3, color: '#111' }
  }
  return base
}

export default function GrammarMap({ graph, masteryState, todayRuleId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<import('cytoscape').Core | null>(null)

  // Init Cytoscape once
  useEffect(() => {
    if (!containerRef.current) return

    let cy: import('cytoscape').Core

    import('cytoscape').then((mod) => {
      const cytoscape = mod.default

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
              'background-color': '#f5f5f5',
              'border-color': '#ccc',
              'border-width': 1,
              color: '#999',
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': '#e5e7eb',
              'target-arrow-color': '#e5e7eb',
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
      applyStyles(cy, masteryState, todayRuleId)
    })

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reactively update styles when mastery changes
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    applyStyles(cy, masteryState, todayRuleId)
  }, [masteryState, todayRuleId])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    />
  )
}

function applyStyles(
  cy: import('cytoscape').Core,
  masteryState: MasteryState,
  todayRuleId: string | null
) {
  cy.batch(() => {
    cy.nodes().forEach((node) => {
      const id = node.id()
      const level = (masteryState[id] ?? 0) as 0 | 1 | 2
      const isToday = id === todayRuleId
      const style = nodeStyle(level, isToday)
      node.style(style)
    })
  })
}
