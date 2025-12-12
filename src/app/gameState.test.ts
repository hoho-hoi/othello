/**
 * Tests for game state management and initialization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initializeGame } from './gameState'
import { createInitialBoard } from '../domain/rules'
import * as deviceLocalStorage from '../storage/deviceLocalStorage'

vi.mock('../storage/deviceLocalStorage')

describe('initializeGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create new game when no saved game exists', async () => {
    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: null,
    })

    const result = await initializeGame()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.gameState).toBeTruthy()
      expect(result.gameState.board).toEqual(createInitialBoard())
      expect(result.gameState.nextTurnColor).toBe('BLACK')
      expect(result.gameState.isFinished).toBe(false)
      expect(result.moves).toEqual([])
    }
  })

  it('should restore game from saved moves', async () => {
    // Use a single legal move to avoid turn consistency issues
    // Initial board: BLACK can play at (2,3), (3,2), (4,5), (5,4)
    const savedMoves = [
      {
        moveNumber: 1,
        color: 'BLACK' as const,
        row: 2 as const,
        col: 3 as const,
        isPass: false,
      },
    ]

    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: {
        formatVersion: 1,
        moves: savedMoves,
      },
    })

    const result = await initializeGame()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.gameState).toBeTruthy()
      expect(result.moves).toEqual(savedMoves)
      // Board should be recomputed from moves
      expect(result.gameState.board).toBeTruthy()
      // After BLACK's move, next turn should be WHITE
      expect(result.gameState.nextTurnColor).toBe('WHITE')
    }
  })

  it('should reject invalid moves during restoration', async () => {
    // Use an illegal move to test validation
    const invalidMoves = [
      {
        moveNumber: 1,
        color: 'BLACK' as const,
        row: 0 as const,
        col: 0 as const,
        isPass: false,
      },
    ]

    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: {
        formatVersion: 1,
        moves: invalidMoves,
      },
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid game record')
      expect(result.error).toContain('Move 1')
    }
  })

  it('should reject invalid pass moves during restoration', async () => {
    // Use a pass move when legal moves are available
    const invalidPassMoves = [
      {
        moveNumber: 1,
        color: 'BLACK' as const,
        row: null,
        col: null,
        isPass: true,
      },
    ]

    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: {
        formatVersion: 1,
        moves: invalidPassMoves,
      },
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid game record')
      expect(result.error).toContain('Pass move invalid')
    }
  })

  it('should reject turn inconsistency during restoration', async () => {
    // Use WHITE move when BLACK should move first
    const turnInconsistentMoves = [
      {
        moveNumber: 1,
        color: 'WHITE' as const,
        row: 2 as const,
        col: 3 as const,
        isPass: false,
      },
    ]

    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: {
        formatVersion: 1,
        moves: turnInconsistentMoves,
      },
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid game record')
      expect(result.error).toContain('Expected BLACK')
    }
  })

  it('should handle storage load errors', async () => {
    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: false,
      error: 'Storage read error',
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Storage')
    }
  })

  it('should handle invalid record format errors', async () => {
    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: false,
      error: 'Invalid record format: formatVersion must be 1',
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('format')
    }
  })
})
