/**
 * Compute how many full calendar days have elapsed since startDate (UTC).
 * startDate must be a YYYY-MM-DD string (as stored by getStartDate).
 * Compares against today's UTC date so the result is consistent regardless of timezone.
 * Returns 0 for invalid/future dates.
 */
export function daysSince(startDate: string | null): number {
  if (!startDate) return 0
  // Parse start as UTC midnight (the 'Z' suffix forces UTC interpretation)
  const startMs = Date.parse(startDate + 'T00:00:00Z')
  if (isNaN(startMs)) return 0
  // Today's UTC date as milliseconds since epoch (midnight UTC)
  const todayStr = new Date().toISOString().split('T')[0]
  const nowMs = Date.parse(todayStr + 'T00:00:00Z')
  const diff = Math.floor((nowMs - startMs) / 86_400_000)
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
