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

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
        expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
      })
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

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
        expect(
          screen.getByText(/failed to create object url/i)
        ).toBeInTheDocument()
      })
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
        name: /import/i,
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
        name: /import/i,
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
        name: /import/i,
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
        name: /import/i,
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
        name: /import/i,
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
})
