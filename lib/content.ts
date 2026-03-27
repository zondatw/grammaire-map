import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Rule, Drill, GraphConfig } from './types'

const contentDir = path.join(process.cwd(), 'content')

export function getCurriculum(): string[] {
  const raw = fs.readFileSync(path.join(contentDir, 'curriculum.json'), 'utf-8')
  return JSON.parse(raw) as string[]
}

export function getRule(id: string): Rule {
  const filePath = path.join(contentDir, 'rules', `${id}.md`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  return {
    id: data.id as string,
    title: data.title as string,
    order: data.order as number,
    body: content.trim(),
  }
}

export function getDrills(id: string): Drill[] {
  const filePath = path.join(contentDir, 'drills', `${id}.json`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as Drill[]
}

export function getGraphConfig(): GraphConfig {
  const filePath = path.join(contentDir, 'graph.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as GraphConfig
}

export function getAllRules(): Rule[] {
  const curriculum = getCurriculum()
  return curriculum.map((id) => getRule(id))
}
