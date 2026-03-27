/**
 * Compute how many full calendar days have elapsed since startDate.
 * Uses local calendar date. Returns 0 for invalid/future dates.
 */
export function daysSince(startDate: string | null): number {
  if (!startDate) return 0
  const start = new Date(startDate)
  if (isNaN(start.getTime())) return 0
  // Zero out time to compare calendar dates
  const startMidnight = new Date(start)
  startMidnight.setHours(0, 0, 0, 0)
  const nowMidnight = new Date()
  nowMidnight.setHours(0, 0, 0, 0)
  const diff = Math.floor((nowMidnight.getTime() - startMidnight.getTime()) / 86_400_000)
  return diff < 0 ? 0 : diff
}

/**
 * Returns today's rule ID from the ordered list.
 * Wraps around if day count exceeds list length.
 */
export function getTodayRuleId(orderedIds: string[], startDate: string | null): string | null {
  if (!orderedIds.length) return null
  const day = daysSince(startDate)
  return orderedIds[day % orderedIds.length]
}
