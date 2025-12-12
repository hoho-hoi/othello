import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('should display board and sidebar in playing state', async () => {
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

    // Should display board
    expect(screen.getByTestId('board')).toBeInTheDocument()
    // Should display sidebar
    expect(screen.getByTestId('record-sidebar')).toBeInTheDocument()
  })

  it('should handle cell click and place stone', async () => {
    const user = userEvent.setup()
    const initialBoard = createInitialBoard()
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: initialBoard,
        nextTurnColor: 'BLACK',
        isFinished: false,
      },
      moves: [],
    })

    // Mock placeStone to return success
    vi.mocked(gameState.placeStone).mockResolvedValue({
      success: true,
      newGameState: {
        board: initialBoard,
        nextTurnColor: 'WHITE',
        isFinished: false,
      },
      newMoves: [
        {
          moveNumber: 1,
          color: 'BLACK',
          row: 2,
          col: 3,
          isPass: false,
        },
      ],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Click on a cell (legal move position)
    // Get board cells specifically (not New Game button)
    const board = screen.getByTestId('board')
    const cells = board.querySelectorAll('button')
    await user.click(cells[0] as HTMLElement)

    // placeStone should be called
    expect(gameState.placeStone).toHaveBeenCalledTimes(1)
  })

  it('should handle invalid move without crashing', async () => {
    const user = userEvent.setup()
    const initialBoard = createInitialBoard()
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: initialBoard,
        nextTurnColor: 'BLACK',
        isFinished: false,
      },
      moves: [],
    })

    // Mock placeStone to return error (illegal move)
    vi.mocked(gameState.placeStone).mockResolvedValue({
      success: false,
      error: 'Illegal move',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Click on a cell (illegal move position)
    // Get board cells specifically (not New Game button)
    const board = screen.getByTestId('board')
    const cells = board.querySelectorAll('button')
    await user.click(cells[0] as HTMLElement)

    // placeStone should be called, but app should not crash
    expect(gameState.placeStone).toHaveBeenCalledTimes(1)
    // App should still be in playing state
    expect(screen.getByTestId('board')).toBeInTheDocument()
  })

  it('should show new game confirmation dialog when New Game button is clicked from PLAYING state', async () => {
    const user = userEvent.setup()
    const initialBoard = createInitialBoard()
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: initialBoard,
        nextTurnColor: 'BLACK',
        isFinished: false,
      },
      moves: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Click New Game button
    const newGameButton = screen.getByRole('button', { name: /new game/i })
    await user.click(newGameButton)

    // Should show confirmation dialog
    expect(screen.getByText(/start new game/i)).toBeInTheDocument()
    expect(
      screen.getByText(/current game will be abandoned/i)
    ).toBeInTheDocument()
  })

  it('should show new game confirmation dialog when New Game button is clicked from RESULT state', async () => {
    const user = userEvent.setup()
    const initialBoard = createInitialBoard()
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: initialBoard,
        nextTurnColor: 'BLACK',
        isFinished: true,
      },
      moves: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Click New Game button
    const newGameButton = screen.getByRole('button', { name: /new game/i })
    await user.click(newGameButton)

    // Should show confirmation dialog
    expect(screen.getByText(/start new game/i)).toBeInTheDocument()
  })

  it('should start new game when Confirm is clicked in confirmation dialog', async () => {
    const user = userEvent.setup()
    const initialBoard = createInitialBoard()
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: initialBoard,
        nextTurnColor: 'BLACK',
        isFinished: false,
      },
      moves: [],
    })

    // Mock startNewGame
    vi.mocked(gameState.startNewGame).mockResolvedValue({
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

    // Click New Game button
    const newGameButton = screen.getByRole('button', { name: /new game/i })
    await user.click(newGameButton)

    // Click Confirm button
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    // Should call startNewGame
    expect(gameState.startNewGame).toHaveBeenCalledTimes(1)
  })

  it('should return to previous state when Cancel is clicked in confirmation dialog', async () => {
    const user = userEvent.setup()
    const initialBoard = createInitialBoard()
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: initialBoard,
        nextTurnColor: 'BLACK',
        isFinished: false,
      },
      moves: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Click New Game button
    const newGameButton = screen.getByRole('button', { name: /new game/i })
    await user.click(newGameButton)

    // Click Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Should return to PLAYING state
    expect(screen.getByTestId('board')).toBeInTheDocument()
    expect(screen.queryByText(/start new game/i)).not.toBeInTheDocument()
  })

  it('should show error when new game save fails', async () => {
    const user = userEvent.setup()
    const initialBoard = createInitialBoard()
    vi.mocked(gameState.initializeGame).mockResolvedValue({
      success: true,
      gameState: {
        board: initialBoard,
        nextTurnColor: 'BLACK',
        isFinished: false,
      },
      moves: [],
    })

    // Mock startNewGame to return error
    vi.mocked(gameState.startNewGame).mockResolvedValue({
      success: false,
      error: 'Storage quota exceeded',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Click New Game button
    const newGameButton = screen.getByRole('button', { name: /new game/i })
    await user.click(newGameButton)

    // Click Confirm button
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
      expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument()
    })
  })
})
