import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import * as gameState from './app/gameState'
import * as rules from './domain/rules'
import { createInitialBoard } from './domain/rules'

vi.mock('./app/gameState')
vi.mock('./domain/rules', async () => {
  const actual = await vi.importActual('./domain/rules')
  return {
    ...actual,
    canPass: vi.fn(),
  }
})

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

  it('should display status message when invalid move is attempted (R1)', async () => {
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
      error: 'Illegal move: no pieces can be flipped',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Click on a cell (illegal move position)
    const board = screen.getByTestId('board')
    const cells = board.querySelectorAll('button')
    await user.click(cells[0] as HTMLElement)

    // Should display error message in status message
    await waitFor(() => {
      expect(
        screen.getByText(/Illegal move: no pieces can be flipped/i)
      ).toBeInTheDocument()
    })

    // App should still be in playing state
    expect(screen.getByTestId('board')).toBeInTheDocument()
  })

  it('should display status message when DeviceLocal save fails after move (R2)', async () => {
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

    // Mock placeStone to return error due to save failure
    vi.mocked(gameState.placeStone).mockResolvedValue({
      success: false,
      error: 'Move applied but save failed: Storage quota exceeded',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Click on a cell (legal move position)
    const board = screen.getByTestId('board')
    const cells = board.querySelectorAll('button')
    await user.click(cells[0] as HTMLElement)

    // Should display error message in status message
    await waitFor(() => {
      expect(
        screen.getByText(
          /Move applied but save failed: Storage quota exceeded/i
        )
      ).toBeInTheDocument()
    })

    // App should still be in playing state (state should not be corrupted)
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

    // Should show error message in status message (R3: unified error display)
    await waitFor(() => {
      expect(screen.getByText(/Storage quota exceeded/i)).toBeInTheDocument()
    })

    // Should stay in NEW_GAME_CONFIRM state or return to previous state
    // (not ERROR state - R3: unified error display)
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  describe('Export functionality', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should show export dialog when Export button is clicked from PLAYING state', async () => {
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

      // Click Export button
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Should show export dialog
      expect(screen.getByText(/export record/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /copy to clipboard/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /download as file/i })
      ).toBeInTheDocument()
    })

    it('should show export dialog when Export button is clicked from RESULT state', async () => {
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

      // Click Export button
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Should show export dialog
      expect(screen.getByText(/export record/i)).toBeInTheDocument()
    })

    it('should export to clipboard successfully and return to PLAYING state', async () => {
      const user = userEvent.setup()
      const initialBoard = createInitialBoard()
      const moves = [
        {
          moveNumber: 1,
          color: 'BLACK' as const,
          row: 2 as const,
          col: 3 as const,
          isPass: false,
        },
      ]
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
          isFinished: false,
        },
        moves: moves,
      })

      // Mock exportRecordToClipboard
      vi.mocked(gameState.exportRecordToClipboard).mockResolvedValue({
        success: true,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Click Export button
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Click Copy to Clipboard button
      const clipboardButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      })
      await user.click(clipboardButton)

      // Should call exportRecordToClipboard
      expect(gameState.exportRecordToClipboard).toHaveBeenCalledTimes(1)
      expect(gameState.exportRecordToClipboard).toHaveBeenCalledWith(moves)

      // Should return to PLAYING state
      await waitFor(() => {
        expect(screen.queryByText(/export record/i)).not.toBeInTheDocument()
        expect(screen.getByTestId('board')).toBeInTheDocument()
      })
    })

    it('should export to file successfully from PLAYING state and return to PLAYING state', async () => {
      const user = userEvent.setup()
      const initialBoard = createInitialBoard()
      const moves = [
        {
          moveNumber: 1,
          color: 'BLACK' as const,
          row: 2 as const,
          col: 3 as const,
          isPass: false,
        },
      ]
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
          isFinished: false,
        },
        moves: moves,
      })

      // Mock exportRecordToFile - must be set before render
      vi.mocked(gameState.exportRecordToFile).mockResolvedValue({
        success: true,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Verify we're in PLAYING state
      expect(screen.getByTestId('board')).toBeInTheDocument()

      // Click Export button
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Verify export dialog is shown
      await waitFor(() => {
        expect(screen.getByText(/export record/i)).toBeInTheDocument()
      })

      // Click Download as File button
      const fileButton = screen.getByRole('button', {
        name: /download as file/i,
      })
      await user.click(fileButton)

      // Should call exportRecordToFile
      await waitFor(() => {
        expect(gameState.exportRecordToFile).toHaveBeenCalledTimes(1)
        expect(gameState.exportRecordToFile).toHaveBeenCalledWith(moves)
      })

      // Should return to PLAYING state
      await waitFor(
        () => {
          expect(screen.queryByText(/export record/i)).not.toBeInTheDocument()
          expect(screen.getByTestId('board')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it('should show error when clipboard export fails', async () => {
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

      // Mock exportRecordToClipboard to return error
      vi.mocked(gameState.exportRecordToClipboard).mockResolvedValue({
        success: false,
        error: 'Permission denied',
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Click Export button
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Click Copy to Clipboard button
      const clipboardButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      })
      await user.click(clipboardButton)

      // Should show error message in status message (R3: unified error display)
      await waitFor(() => {
        expect(screen.getByText(/Permission denied/i)).toBeInTheDocument()
      })

      // Should return to PLAYING state (not ERROR state)
      expect(screen.getByTestId('board')).toBeInTheDocument()
    })

    it('should show error when file export fails', async () => {
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

      // Mock exportRecordToFile to return error
      vi.mocked(gameState.exportRecordToFile).mockResolvedValue({
        success: false,
        error: 'Failed to create object URL',
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Click Export button
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Click Download as File button
      const fileButton = screen.getByRole('button', {
        name: /download as file/i,
      })
      await user.click(fileButton)

      // Should show error message in status message (R3: unified error display)
      await waitFor(() => {
        expect(
          screen.getByText(/Failed to create object URL/i)
        ).toBeInTheDocument()
      })

      // Should return to PLAYING state (not ERROR state)
      expect(screen.getByTestId('board')).toBeInTheDocument()
    })

    it('should return to previous state when Cancel is clicked in export dialog', async () => {
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

      // Click Export button
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Click Cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should return to PLAYING state
      expect(screen.getByTestId('board')).toBeInTheDocument()
      expect(screen.queryByText(/export record/i)).not.toBeInTheDocument()
    })

    it('should export to clipboard successfully from RESULT state and return to RESULT state', async () => {
      const user = userEvent.setup()
      const initialBoard = createInitialBoard()
      const moves = [
        {
          moveNumber: 1,
          color: 'BLACK' as const,
          row: 2 as const,
          col: 3 as const,
          isPass: false,
        },
      ]
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
          isFinished: false,
        },
        moves: moves,
      })

      // Mock placeStone to transition to RESULT state
      vi.mocked(gameState.placeStone).mockResolvedValue({
        success: true,
        newGameState: {
          board: initialBoard,
          nextTurnColor: 'WHITE',
          isFinished: true,
        },
        newMoves: [
          ...moves,
          {
            moveNumber: 2,
            color: 'WHITE' as const,
            row: 3 as const,
            col: 2 as const,
            isPass: false,
          },
        ],
      })

      // Mock exportRecordToClipboard
      vi.mocked(gameState.exportRecordToClipboard).mockResolvedValue({
        success: true,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Make a move to transition to RESULT state
      const board = screen.getByTestId('board')
      const cells = board.querySelectorAll('button')
      await user.click(cells[0] as HTMLElement)

      // Wait for RESULT state
      await waitFor(() => {
        expect(screen.getByText(/Game finished/i)).toBeInTheDocument()
      })

      // Click Export button from RESULT state
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Verify export dialog is shown
      await waitFor(() => {
        expect(screen.getByText(/export record/i)).toBeInTheDocument()
      })

      // Click Copy to Clipboard button
      const clipboardButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      })
      await user.click(clipboardButton)

      // Should call exportRecordToClipboard
      await waitFor(() => {
        expect(gameState.exportRecordToClipboard).toHaveBeenCalledTimes(1)
      })

      // Should return to RESULT state
      await waitFor(
        () => {
          expect(screen.queryByText(/export record/i)).not.toBeInTheDocument()
          expect(screen.getByText(/Game finished/i)).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it('should export to file successfully from RESULT state and return to RESULT state', async () => {
      const user = userEvent.setup()
      const initialBoard = createInitialBoard()
      const moves = [
        {
          moveNumber: 1,
          color: 'BLACK' as const,
          row: 2 as const,
          col: 3 as const,
          isPass: false,
        },
      ]
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
          isFinished: false,
        },
        moves: moves,
      })

      // Mock placeStone to transition to RESULT state
      vi.mocked(gameState.placeStone).mockResolvedValue({
        success: true,
        newGameState: {
          board: initialBoard,
          nextTurnColor: 'WHITE',
          isFinished: true,
        },
        newMoves: [
          ...moves,
          {
            moveNumber: 2,
            color: 'WHITE' as const,
            row: 3 as const,
            col: 2 as const,
            isPass: false,
          },
        ],
      })

      // Mock exportRecordToFile
      vi.mocked(gameState.exportRecordToFile).mockResolvedValue({
        success: true,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Make a move to transition to RESULT state
      const board = screen.getByTestId('board')
      const cells = board.querySelectorAll('button')
      await user.click(cells[0] as HTMLElement)

      // Wait for RESULT state
      await waitFor(() => {
        expect(screen.getByText(/Game finished/i)).toBeInTheDocument()
      })

      // Click Export button from RESULT state
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Verify export dialog is shown
      await waitFor(() => {
        expect(screen.getByText(/export record/i)).toBeInTheDocument()
      })

      // Click Download as File button
      const fileButton = screen.getByRole('button', {
        name: /download as file/i,
      })
      await user.click(fileButton)

      // Should call exportRecordToFile
      await waitFor(() => {
        expect(gameState.exportRecordToFile).toHaveBeenCalledTimes(1)
      })

      // Should return to RESULT state
      await waitFor(
        () => {
          expect(screen.queryByText(/export record/i)).not.toBeInTheDocument()
          expect(screen.getByText(/Game finished/i)).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('Import functionality', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    const setupPreview = () => {
      const previewMoves = [
        {
          moveNumber: 1,
          color: 'BLACK' as const,
          row: 2 as const,
          col: 3 as const,
          isPass: false,
        },
      ]
      const previewGameState = {
        board: createInitialBoard(),
        nextTurnColor: 'WHITE' as const,
        isFinished: false,
      }
      return { previewMoves, previewGameState }
    }

    it('triggers hidden file input when Import (File) button is clicked', async () => {
      const user = userEvent.setup()
      const previewGameState = {
        board: createInitialBoard(),
        nextTurnColor: 'BLACK' as const,
        isFinished: false,
      }
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: [],
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      const fileInput = screen.getByTestId(
        'import-file-input'
      ) as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, 'click')
      const fileButton = screen.getByRole('button', {
        name: /Import \(File\)/i,
      })
      await user.click(fileButton)

      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('shows import confirmation dialog when valid file is selected', async () => {
      const user = userEvent.setup()
      const { previewMoves, previewGameState } = setupPreview()
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: [],
      })

      vi.mocked(gameState.prepareImportRecordFromFile).mockResolvedValue({
        success: true,
        preview: {
          moves: previewMoves,
          previewGameState,
          recordSizeBytes: 256,
        },
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      const fileInput = screen.getByTestId(
        'import-file-input'
      ) as HTMLInputElement
      const file = new File(
        [
          JSON.stringify({
            formatVersion: 1,
            moves: previewMoves,
          }),
        ],
        'record.json',
        { type: 'application/json' }
      )

      await user.click(
        screen.getByRole('button', {
          name: /Import \(File\)/i,
        })
      )

      fireEvent.change(fileInput, {
        target: { files: [file] },
      })

      await waitFor(() => {
        expect(gameState.prepareImportRecordFromFile).toHaveBeenCalledTimes(1)
        expect(screen.getByText(/Import Record/i)).toBeInTheDocument()
      })
    })

    it('displays error when file preview fails', async () => {
      const user = userEvent.setup()
      const previewGameState = {
        board: createInitialBoard(),
        nextTurnColor: 'BLACK' as const,
        isFinished: false,
      }
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: [],
      })

      vi.mocked(gameState.prepareImportRecordFromFile).mockResolvedValue({
        success: false,
        error: 'File parsing failed',
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      const fileInput = screen.getByTestId(
        'import-file-input'
      ) as HTMLInputElement
      const file = new File(['{}'], 'invalid.json', {
        type: 'application/json',
      })

      await user.click(
        screen.getByRole('button', {
          name: /Import \(File\)/i,
        })
      )

      fireEvent.change(fileInput, {
        target: { files: [file] },
      })

      await waitFor(() => {
        expect(screen.getByText(/File parsing failed/i)).toBeInTheDocument()
        expect(screen.getByTestId('board')).toBeInTheDocument()
      })
    })

    it('shows import confirmation dialog when preview succeeds', async () => {
      const user = userEvent.setup()
      const { previewMoves, previewGameState } = setupPreview()
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: [],
      })

      vi.mocked(gameState.prepareImportRecordFromClipboard).mockResolvedValue({
        success: true,
        preview: {
          moves: previewMoves,
          previewGameState,
          recordSizeBytes: 128,
        },
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      const importButton = screen.getByRole('button', {
        name: /Import \(Clipboard\)/i,
      })
      await user.click(importButton)

      expect(gameState.prepareImportRecordFromClipboard).toHaveBeenCalledTimes(
        1
      )

      await waitFor(() => {
        expect(screen.getByText(/Import Record/i)).toBeInTheDocument()
        expect(screen.getByText(/Moves:/i)).toBeInTheDocument()
      })
    })

    it('cancels import confirmation and restores playing state', async () => {
      const user = userEvent.setup()
      const { previewMoves, previewGameState } = setupPreview()
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: [],
      })

      vi.mocked(gameState.prepareImportRecordFromClipboard).mockResolvedValue({
        success: true,
        preview: {
          moves: previewMoves,
          previewGameState,
          recordSizeBytes: 128,
        },
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      const importButton = screen.getByRole('button', {
        name: /Import \(Clipboard\)/i,
      })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/Import Record/i)).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(screen.getByTestId('board')).toBeInTheDocument()
      expect(screen.queryByText(/Import Record/i)).not.toBeInTheDocument()
    })

    it('displays error when preview fails and stays in playing state', async () => {
      const user = userEvent.setup()
      const previewGameState = {
        board: createInitialBoard(),
        nextTurnColor: 'BLACK' as const,
        isFinished: false,
      }
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: [],
      })

      vi.mocked(gameState.prepareImportRecordFromClipboard).mockResolvedValue({
        success: false,
        error: 'Invalid clipboard JSON',
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      const importButton = screen.getByRole('button', {
        name: /Import \(Clipboard\)/i,
      })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/Invalid clipboard JSON/i)).toBeInTheDocument()
      })
      expect(screen.getByTestId('board')).toBeInTheDocument()
    })

    it('imports record successfully when confirmed', async () => {
      const user = userEvent.setup()
      const { previewMoves, previewGameState } = setupPreview()
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: [],
      })

      vi.mocked(gameState.prepareImportRecordFromClipboard).mockResolvedValue({
        success: true,
        preview: {
          moves: previewMoves,
          previewGameState,
          recordSizeBytes: 128,
        },
      })

      vi.mocked(gameState.importRecord).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: previewMoves,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      const importButton = screen.getByRole('button', {
        name: /Import \(Clipboard\)/i,
      })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/Import Record/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(gameState.importRecord).toHaveBeenCalledTimes(1)
        expect(
          screen.getByText(/Record imported successfully/i)
        ).toBeInTheDocument()
        expect(screen.getByTestId('board')).toBeInTheDocument()
      })
    })

    it('shows error when import save fails and reverts to playing state', async () => {
      const user = userEvent.setup()
      const { previewMoves, previewGameState } = setupPreview()
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: previewGameState,
        moves: [],
      })

      vi.mocked(gameState.prepareImportRecordFromClipboard).mockResolvedValue({
        success: true,
        preview: {
          moves: previewMoves,
          previewGameState,
          recordSizeBytes: 128,
        },
      })

      vi.mocked(gameState.importRecord).mockResolvedValue({
        success: false,
        error: 'Storage quota exceeded',
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      const importButton = screen.getByRole('button', {
        name: /Import \(Clipboard\)/i,
      })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/Import Record/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/Storage quota exceeded/i)).toBeInTheDocument()
        expect(screen.getByTestId('board')).toBeInTheDocument()
      })
    })
  })

  describe('Pass handling (R1, R5)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should show status message when auto-pass occurs in PLAYING state (R5)', async () => {
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

      // Mock canPass to return true (no legal moves) for WHITE after BLACK's move
      vi.mocked(rules.canPass).mockImplementation((_board, color) => {
        // After BLACK moves, WHITE has no legal moves
        return color === 'WHITE'
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

      // Mock passTurn to return success (auto-pass for WHITE)
      vi.mocked(gameState.passTurn).mockResolvedValue({
        success: true,
        newGameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
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
          {
            moveNumber: 2,
            color: 'WHITE',
            row: null,
            col: null,
            isPass: true,
          },
        ],
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Click on a cell to place a stone
      const board = screen.getByTestId('board')
      const cells = board.querySelectorAll('button')
      await user.click(cells[0] as HTMLElement)

      // Wait for auto-pass to occur and status message to appear
      await waitFor(
        () => {
          expect(
            screen.getByText(/WHITE passed \(no legal moves\)/i)
          ).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Verify passTurn was called
      expect(gameState.passTurn).toHaveBeenCalledTimes(1)
    })

    it('should show status message when auto-pass occurs on state transition (R5)', async () => {
      const initialBoard = createInitialBoard()
      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: {
          board: initialBoard,
          nextTurnColor: 'WHITE',
          isFinished: false,
        },
        moves: [],
      })

      // Mock canPass to return true (no legal moves) for WHITE
      vi.mocked(rules.canPass).mockImplementation((_board, color) => {
        return color === 'WHITE'
      })

      // Mock passTurn to return success (auto-pass for WHITE)
      vi.mocked(gameState.passTurn).mockResolvedValue({
        success: true,
        newGameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
          isFinished: false,
        },
        newMoves: [
          {
            moveNumber: 1,
            color: 'WHITE',
            row: null,
            col: null,
            isPass: true,
          },
        ],
      })

      render(<App />)

      // Wait for auto-pass to occur and status message to appear
      await waitFor(
        () => {
          expect(
            screen.getByText(/WHITE passed \(no legal moves\)/i)
          ).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Verify passTurn was called
      expect(gameState.passTurn).toHaveBeenCalledTimes(1)
    })
  })

  describe('RESULT screen (Issue #19)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display black and white stone counts when game finishes (R1)', async () => {
      const initialBoard = createInitialBoard()
      // Create a finished game state with known stone counts
      const finishedBoard = createInitialBoard()
      // Set up board with known counts: 10 black, 6 white
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row < 4 || (row === 4 && col < 4)) {
            finishedBoard[row][col] = 'BLACK'
          } else if (row > 4 || (row === 4 && col >= 4)) {
            finishedBoard[row][col] = 'WHITE'
          }
        }
      }

      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
          isFinished: false,
        },
        moves: [],
      })

      // Mock placeStone to transition to RESULT state with finished board
      vi.mocked(gameState.placeStone).mockResolvedValue({
        success: true,
        newGameState: {
          board: finishedBoard,
          nextTurnColor: 'WHITE',
          isFinished: true,
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

      // Make a move to finish the game
      const board = screen.getByTestId('board')
      const cells = board.querySelectorAll('button')
      await userEvent.setup().click(cells[0] as HTMLElement)

      // Wait for RESULT state
      await waitFor(() => {
        expect(screen.getByText(/Game finished/i)).toBeInTheDocument()
      })

      // Should display stone counts
      // Note: We need to check for the actual counts computed by computeGameResult
      // Since we're using the real computeGameResult function, we need to check for the actual result
      const result = rules.computeGameResult(finishedBoard)
      expect(
        screen.getByText(new RegExp(`Black.*${result.blackCount}`, 'i'))
      ).toBeInTheDocument()
      expect(
        screen.getByText(new RegExp(`White.*${result.whiteCount}`, 'i'))
      ).toBeInTheDocument()
    })

    it('should display winner when game finishes (R2)', async () => {
      const user = userEvent.setup()
      const initialBoard = createInitialBoard()
      // Create a finished game state with BLACK winning
      const finishedBoard = createInitialBoard()
      // Set up board with BLACK winning (more black pieces)
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row < 5) {
            finishedBoard[row][col] = 'BLACK'
          } else {
            finishedBoard[row][col] = 'WHITE'
          }
        }
      }

      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
          isFinished: false,
        },
        moves: [],
      })

      // Mock placeStone to transition to RESULT state
      vi.mocked(gameState.placeStone).mockResolvedValue({
        success: true,
        newGameState: {
          board: finishedBoard,
          nextTurnColor: 'WHITE',
          isFinished: true,
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

      // Make a move to finish the game
      const board = screen.getByTestId('board')
      const cells = board.querySelectorAll('button')
      await user.click(cells[0] as HTMLElement)

      // Wait for RESULT state
      await waitFor(() => {
        expect(screen.getByText(/Game finished/i)).toBeInTheDocument()
      })

      // Should display winner
      const result = rules.computeGameResult(finishedBoard)
      if (result.winner === 'BLACK') {
        expect(screen.getByText(/Black.*wins/i)).toBeInTheDocument()
      } else if (result.winner === 'WHITE') {
        expect(screen.getByText(/White.*wins/i)).toBeInTheDocument()
      } else {
        expect(screen.getByText(/Draw/i)).toBeInTheDocument()
      }
    })

    it('should display RecordSidebar in RESULT state (R5)', async () => {
      const user = userEvent.setup()
      const initialBoard = createInitialBoard()
      const moves = [
        {
          moveNumber: 1,
          color: 'BLACK' as const,
          row: 2 as const,
          col: 3 as const,
          isPass: false,
        },
        {
          moveNumber: 2,
          color: 'WHITE' as const,
          row: 3 as const,
          col: 2 as const,
          isPass: false,
        },
      ]

      vi.mocked(gameState.initializeGame).mockResolvedValue({
        success: true,
        gameState: {
          board: initialBoard,
          nextTurnColor: 'BLACK',
          isFinished: false,
        },
        moves: [],
      })

      // Mock placeStone to transition to RESULT state
      vi.mocked(gameState.placeStone).mockResolvedValue({
        success: true,
        newGameState: {
          board: initialBoard,
          nextTurnColor: 'WHITE',
          isFinished: true,
        },
        newMoves: moves,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Make a move to finish the game
      const board = screen.getByTestId('board')
      const cells = board.querySelectorAll('button')
      await user.click(cells[0] as HTMLElement)

      // Wait for RESULT state
      await waitFor(() => {
        expect(screen.getByText(/Game finished/i)).toBeInTheDocument()
      })

      // Should display RecordSidebar
      expect(screen.getByTestId('record-sidebar')).toBeInTheDocument()
      // Should display moves
      expect(screen.getByText(/Record/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility (Issue #24)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('R1: statusMessage aria-live', () => {
      it('should have aria-live="polite" on status message element', async () => {
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
          error: 'Illegal move: no pieces can be flipped',
        })

        render(<App />)

        await waitFor(() => {
          expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
        })

        // Click on a cell to trigger status message
        const board = screen.getByTestId('board')
        const cells = board.querySelectorAll('button')
        await userEvent.setup().click(cells[0] as HTMLElement)

        // Wait for status message to appear
        await waitFor(() => {
          const statusMessage = screen.getByText(
            /Illegal move: no pieces can be flipped/i
          )
          expect(statusMessage).toBeInTheDocument()
          expect(statusMessage).toHaveAttribute('role', 'status')
          expect(statusMessage).toHaveAttribute('aria-live', 'polite')
        })
      })
    })

    describe('R4: Button accessibility labels', () => {
      it('should have accessible labels for New Game button', async () => {
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

        // New Game button should have accessible text or aria-label
        const newGameButton = screen.getByRole('button', { name: /new game/i })
        expect(newGameButton).toBeInTheDocument()
        // Button text should be clear
        expect(newGameButton.textContent).toMatch(/new game/i)
      })

      it('should have accessible labels for Export button', async () => {
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

        // Export button should have accessible text or aria-label
        const exportButton = screen.getByRole('button', { name: /export/i })
        expect(exportButton).toBeInTheDocument()
        // Button text should be clear
        expect(exportButton.textContent).toMatch(/export/i)
      })

      it('should have accessible labels for Import (Clipboard) button', async () => {
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

        // Import (Clipboard) button should have accessible text or aria-label
        const importButton = screen.getByRole('button', {
          name: /import.*clipboard/i,
        })
        expect(importButton).toBeInTheDocument()
        // Button text should be clear
        expect(importButton.textContent).toMatch(/import.*clipboard/i)
      })

      it('should have accessible labels for Import (File) button', async () => {
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

        // Import (File) button should have accessible text or aria-label
        const importButton = screen.getByRole('button', {
          name: /import.*file/i,
        })
        expect(importButton).toBeInTheDocument()
        // Button text should be clear
        expect(importButton.textContent).toMatch(/import.*file/i)
      })
    })
  })
})
