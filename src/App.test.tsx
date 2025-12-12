import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import * as gameState from './app/gameState'
import { createInitialBoard } from './domain/rules'

vi.mock('./app/gameState')

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: createInitialBoard(),
        nextTurnColor: 'BLACK',
        isFinished: false,
      },
      moves: [],
    })

    render(<App />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should transition to playing state after successful initialization', async () => {
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: createInitialBoard(),
        nextTurnColor: 'BLACK',
        isFinished: false,
      },
      moves: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('should transition to error state on initialization failure', async () => {
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: false,
      error: 'Storage read error',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Storage read error')).toBeInTheDocument()
    })
  })
})
