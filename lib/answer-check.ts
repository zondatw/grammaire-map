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
  // Normalize apostrophe variants typed by mobile keyboards to a straight apostrophe.
  // Covers: ' (U+2019 right single quote), ' (U+2018 left single quote),
  // ʼ (U+02BC modifier letter), ` (U+0060 backtick), ′ (U+2032 prime).
  const normalizeApostrophes = (s: string) =>
    s.replace(/[\u2018\u2019\u02BC\u0060\u2032]/g, "'")

  const normalize = (s: string) => normalizeApostrophes(s.trim().toLowerCase())
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
