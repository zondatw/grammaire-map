import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Rule, Drill, GraphConfig, Language, LanguageData } from './types'

const contentDir = path.join(process.cwd(), 'content')

function langDir(lang: Language): string {
  return path.join(contentDir, lang)
}

export function getCurriculum(lang: Language = 'fr'): string[] {
  const raw = fs.readFileSync(path.join(langDir(lang), 'curriculum.json'), 'utf-8')
  return JSON.parse(raw) as string[]
}

export function getRule(id: string, lang: Language = 'fr'): Rule {
  const filePath = path.join(langDir(lang), 'rules', `${id}.md`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  return {
    id: data.id as string,
    title: data.title as string,
    order: data.order as number,
    body: content.trim(),
  }
}

export function getDrills(id: string, lang: Language = 'fr'): Drill[] {
  const filePath = path.join(langDir(lang), 'drills', `${id}.json`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as Drill[]
}

export function getGraphConfig(lang: Language = 'fr'): GraphConfig {
  const filePath = path.join(langDir(lang), 'graph.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as GraphConfig
}

export function getLanguageData(lang: Language): LanguageData {
  const orderedIds = getCurriculum(lang)
  const rules: Rule[] = orderedIds.map((id) => getRule(id, lang))
  const drills: Record<string, Drill[]> = Object.fromEntries(
    orderedIds.map((id) => [id, getDrills(id, lang)])
  )
  const graph = getGraphConfig(lang)
  return { orderedIds, rules, drills, graph }
}
