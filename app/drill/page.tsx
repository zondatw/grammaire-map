export const runtime = 'nodejs'

import { getCurriculum, getRule, getDrills, getGraphConfig } from '@/lib/content'
import type { Rule, Drill, GraphConfig } from '@/lib/types'
import DrillPage from '@/components/DrillPage'

export default async function DrillRoute() {
  const orderedIds = getCurriculum()
  const graph = getGraphConfig()

  // Load all rules + drills server-side; client picks today's based on startDate
  const allRules: Rule[] = orderedIds.map((id) => getRule(id))
  const allDrills: Record<string, Drill[]> = Object.fromEntries(
    orderedIds.map((id) => [id, getDrills(id)])
  )

  return (
    <DrillPage
      orderedIds={orderedIds}
      allRules={allRules}
      allDrills={allDrills}
      graph={graph}
    />
  )
}
