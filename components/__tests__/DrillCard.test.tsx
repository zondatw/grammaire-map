import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import DrillCard from '../DrillCard'
import type { Drill } from '@/lib/types'

const mcDrill: Drill = {
  type: 'multiple-choice',
  prompt: 'Choose the definite article for "livre" (book)',
  answer: 'le',
  choices: ['le', 'la', 'les'],
}

const fillDrill: Drill = {
  type: 'fill-in',
  prompt: 'Type the French word for "school"',
  answer: 'école',
  hint: 'Starts with é',
}

const fillDrillNoHint: Drill = {
  type: 'fill-in',
  prompt: 'Type the French word for "book"',
  answer: 'livre',
}

describe('DrillCard — empty state', () => {
  it('shows empty message and Continue button when no drills', () => {
    const onComplete = vi.fn()
    render(<DrillCard drills={[]} onComplete={onComplete} />)
    expect(screen.getByText('No drills for this rule.')).toBeTruthy()
    fireEvent.click(screen.getByText('Continue →'))
    expect(onComplete).toHaveBeenCalledOnce()
  })
})

describe('DrillCard — multiple-choice', () => {
  it('renders prompt and all choices', () => {
    render(<DrillCard drills={[mcDrill]} onComplete={vi.fn()} />)
    expect(screen.getByText(mcDrill.prompt)).toBeTruthy()
    expect(screen.getByText('le')).toBeTruthy()
    expect(screen.getByText('la')).toBeTruthy()
    expect(screen.getByText('les')).toBeTruthy()
  })

  it('shows correct feedback on right answer', () => {
    vi.useFakeTimers()
    render(<DrillCard drills={[mcDrill]} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByText('le'))
    expect(screen.getByText('Correct!')).toBeTruthy()
    vi.useRealTimers()
  })

  it('shows incorrect feedback and hint on wrong answer', () => {
    render(<DrillCard drills={[mcDrill]} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByText('la'))
    expect(screen.getByText(/Not quite/)).toBeTruthy()
    expect(screen.getByText('Try again')).toBeTruthy()
  })

  it('disables choices after correct answer', () => {
    vi.useFakeTimers()
    render(<DrillCard drills={[mcDrill]} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByText('le'))
    const buttons = screen.getAllByRole('button')
    const choiceButtons = buttons.filter((b) =>
      ['le', 'la', 'les'].includes(b.textContent ?? '')
    )
    expect(choiceButtons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
    vi.useRealTimers()
  })

  it('retry clears result and re-enables choices', () => {
    render(<DrillCard drills={[mcDrill]} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByText('la'))
    fireEvent.click(screen.getByText('Try again'))
    expect(screen.queryByText(/Not quite/)).toBeNull()
  })

  it('advances to next drill after correct answer timeout', async () => {
    vi.useFakeTimers()
    const drills: Drill[] = [
      mcDrill,
      { ...mcDrill, prompt: 'Second drill', answer: 'la', choices: ['le', 'la', 'les'] },
    ]
    render(<DrillCard drills={drills} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByText('le'))
    await act(async () => { vi.advanceTimersByTime(600) })
    expect(screen.getByText('Second drill')).toBeTruthy()
    vi.useRealTimers()
  })

  it('calls onComplete after all drills finished', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<DrillCard drills={[mcDrill]} onComplete={onComplete} />)
    fireEvent.click(screen.getByText('le'))
    await act(async () => { vi.advanceTimersByTime(600) })
    // All drills done screen
    fireEvent.click(screen.getByText('Continue →'))
    expect(onComplete).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})

describe('DrillCard — fill-in', () => {
  it('renders prompt and input', () => {
    render(<DrillCard drills={[fillDrill]} onComplete={vi.fn()} />)
    expect(screen.getByText(fillDrill.prompt)).toBeTruthy()
    expect(screen.getByPlaceholderText('Type your answer…')).toBeTruthy()
  })

  it('Check button disabled when input is empty', () => {
    render(<DrillCard drills={[fillDrill]} onComplete={vi.fn()} />)
    const btn = screen.getByText('Check') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('shows correct feedback on exact match', () => {
    render(<DrillCard drills={[fillDrill]} onComplete={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Type your answer…'), {
      target: { value: 'école' },
    })
    fireEvent.click(screen.getByText('Check'))
    expect(screen.getByText('Correct!')).toBeTruthy()
  })

  it('shows accent mismatch nudge for accent-free correct answer', () => {
    render(<DrillCard drills={[fillDrill]} onComplete={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Type your answer…'), {
      target: { value: 'ecole' },
    })
    fireEvent.click(screen.getByText('Check'))
    expect(screen.getByText(/Proper spelling/)).toBeTruthy()
    expect(screen.getByText('école')).toBeTruthy()
  })

  it('shows hint on incorrect answer', () => {
    render(<DrillCard drills={[fillDrill]} onComplete={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Type your answer…'), {
      target: { value: 'maison' },
    })
    fireEvent.click(screen.getByText('Check'))
    expect(screen.getByText(/Hint: Starts with é/)).toBeTruthy()
  })

  it('shows "Try again" button when no hint', () => {
    render(<DrillCard drills={[fillDrillNoHint]} onComplete={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Type your answer…'), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByText('Check'))
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  it('submits on Enter key', () => {
    render(<DrillCard drills={[fillDrill]} onComplete={vi.fn()} />)
    const input = screen.getByPlaceholderText('Type your answer…')
    fireEvent.change(input, { target: { value: 'école' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Correct!')).toBeTruthy()
  })
})

describe('DrillCard — progress', () => {
  it('shows 0 / N on load', () => {
    render(<DrillCard drills={[mcDrill]} onComplete={vi.fn()} />)
    expect(screen.getByText('0 / 1 complete')).toBeTruthy()
  })

  it('increments progress after advancing', async () => {
    vi.useFakeTimers()
    const drills: Drill[] = [
      mcDrill,
      { ...mcDrill, prompt: 'Drill 2', answer: 'la', choices: ['le', 'la', 'les'] },
    ]
    render(<DrillCard drills={drills} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByText('le'))
    await act(async () => { vi.advanceTimersByTime(600) })
    expect(screen.getByText('1 / 2 complete')).toBeTruthy()
    vi.useRealTimers()
  })
})
