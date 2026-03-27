export interface Rule {
  id: string
  title: string
  order: number
  body: string
}

export interface Drill {
  type: 'multiple-choice' | 'fill-in'
  prompt: string
  answer: string
  choices?: string[]
  hint?: string
}

export interface GraphNode {
  id: string
  label: string
  order?: number
}

export interface GraphEdge {
  source: string
  target: string
}

export interface GraphConfig {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type MasteryLevel = 0 | 1 | 2

export type MasteryState = Record<string, MasteryLevel>
