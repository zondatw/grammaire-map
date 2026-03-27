/**
 * Strict string equality for multiple-choice answers.
 */
export function checkMultipleChoice(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer === correctAnswer
}

/**
 * Accent-lenient fill-in check.
 * - Case-insensitive
 * - Whitespace-trimmed
 * - Strips accents for comparison (accept é as e, etc.)
 * Returns { correct: boolean; accentMismatch: boolean; properSpelling: string }
 */
export function checkFillIn(
  userAnswer: string,
  correctAnswer: string
): { correct: boolean; accentMismatch: boolean; properSpelling: string } {
  const normalize = (s: string) => s.trim().toLowerCase()
  const stripAccents = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const userNorm = normalize(userAnswer)
  const correctNorm = normalize(correctAnswer)

  if (userNorm === correctNorm) {
    return { correct: true, accentMismatch: false, properSpelling: correctAnswer }
  }

  // Check accent-stripped match
  if (stripAccents(userNorm) === stripAccents(correctNorm)) {
    return { correct: true, accentMismatch: true, properSpelling: correctAnswer }
  }

  return { correct: false, accentMismatch: false, properSpelling: correctAnswer }
}
