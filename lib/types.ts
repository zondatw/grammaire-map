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

export type Language = 'fr' | 'es' | 'it'

export interface LanguageData {
  orderedIds: string[]
  rules: Rule[]
  drills: Record<string, Drill[]>
  graph: GraphConfig
}

export const SUPPORTED_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
]
