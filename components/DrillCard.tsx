'use client'

import { useState } from 'react'
import type { Drill } from '@/lib/types'
import { checkMultipleChoice, checkFillIn } from '@/lib/answer-check'

interface Props {
  drills: Drill[]
  onComplete: () => void
}

interface DrillResult {
  correct: boolean
  accentMismatch?: boolean
  properSpelling?: string
}

export default function DrillCard({ drills, onComplete }: Props) {
  const [completedCount, setCompletedCount] = useState(0)
  const [currentInput, setCurrentInput] = useState('')
  const [result, setResult] = useState<DrillResult | null>(null)

  const currentIndex = completedCount
  const currentDrill = drills[currentIndex]
  const allDone = completedCount >= drills.length

  function handleMultipleChoice(choice: string) {
    if (result?.correct) return // already answered
    const correct = checkMultipleChoice(choice, currentDrill.answer)
    setResult({ correct })
    if (correct) {
      setTimeout(() => advance(), 600)
    }
  }

  function handleFillInSubmit() {
    if (result?.correct) return
    const { correct, accentMismatch, properSpelling } = checkFillIn(
      currentInput,
      currentDrill.answer
    )
    setResult({ correct, accentMismatch, properSpelling })
    if (correct) {
      setTimeout(() => advance(), accentMismatch ? 1200 : 600)
    }
  }

  function advance() {
    setCompletedCount((n) => n + 1)
    setCurrentInput('')
    setResult(null)
  }

  if (drills.length === 0) {
    return (
      <div className="drill-card">
        <p className="drill-empty">No drills for this rule.</p>
        <button className="btn-continue" onClick={onComplete}>
          Continue →
        </button>
      </div>
    )
  }

  return (
    <div className="drill-card">
      {/* Progress bar */}
      <div className="drill-progress">
        <div
          className="drill-progress-fill"
          style={{ width: `${(completedCount / drills.length) * 100}%` }}
        />
      </div>
      <p className="drill-progress-label">
        {completedCount} / {drills.length} complete
      </p>

      {allDone ? (
        <div className="drill-done">
          <p>All drills complete!</p>
          <button className="btn-continue" onClick={onComplete}>
            Continue →
          </button>
        </div>
      ) : (
        <div className="drill-question">
          <p className="drill-prompt">{currentDrill.prompt}</p>

          {currentDrill.type === 'multiple-choice' && currentDrill.choices && (
            <div className="drill-choices">
              {currentDrill.choices.map((choice) => (
                <button
                  key={choice}
                  className={`choice-btn ${
                    result
                      ? choice === currentDrill.answer
                        ? 'correct'
                        : result.correct === false && choice === currentInput
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => {
                    setCurrentInput(choice)
                    handleMultipleChoice(choice)
                  }}
                  disabled={result?.correct === true}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}

          {currentDrill.type === 'fill-in' && (
            <div className="drill-fill-in">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFillInSubmit()}
                placeholder="Type your answer…"
                className={result ? (result.correct ? 'input-correct' : 'input-incorrect') : ''}
                disabled={result?.correct === true}
                autoFocus
              />
              <button
                className="btn-check"
                onClick={handleFillInSubmit}
                disabled={!currentInput.trim() || result?.correct === true}
              >
                Check
              </button>
            </div>
          )}

          {result && (
            <div className={`drill-feedback ${result.correct ? 'feedback-correct' : 'feedback-incorrect'}`}>
              {result.correct ? (
                result.accentMismatch ? (
                  <span>Correct! Proper spelling: <strong>{result.properSpelling}</strong></span>
                ) : (
                  <span>Correct!</span>
                )
              ) : (
                <span>
                  Not quite. {currentDrill.hint ? `Hint: ${currentDrill.hint}` : 'Try again.'}
                </span>
              )}
            </div>
          )}

          {result && !result.correct && (
            <button className="btn-retry" onClick={() => { setResult(null); setCurrentInput('') }}>
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
