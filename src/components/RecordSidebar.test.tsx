/**
 * Tests for RecordSidebar component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecordSidebar } from './RecordSidebar'
import type { Move } from '../domain/types'

describe('RecordSidebar', () => {
  it('should display moves list', () => {
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK',
        row: 2,
        col: 3,
        isPass: false,
      },
      {
        moveNumber: 2,
        color: 'WHITE',
        row: 4,
        col: 5,
        isPass: false,
      },
    ]

    render(<RecordSidebar moves={moves} />)

    // Should display move numbers
    expect(screen.getByText(/^1\./)).toBeInTheDocument()
    expect(screen.getByText(/^2\./)).toBeInTheDocument()
  })

  it('should display pass moves', () => {
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK',
        row: null,
        col: null,
        isPass: true,
      },
    ]

    render(<RecordSidebar moves={moves} />)

    // Should display pass indication
    expect(screen.getByText(/pass/i)).toBeInTheDocument()
  })

  it('should display empty state when no moves', () => {
    const moves: readonly Move[] = []

    render(<RecordSidebar moves={moves} />)

    // Should show some indication that there are no moves
    // The exact text depends on implementation
    expect(screen.getByText(/record/i)).toBeInTheDocument()
  })
})
