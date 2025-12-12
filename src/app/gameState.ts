/**
 * Game State Management
 *
 * Handles game initialization, state transitions, and persistence.
 */

import { loadGameFromDeviceLocal } from '../storage/deviceLocalStorage'
import {
  createInitialBoard,
  recomputeBoardFromMoves,
  isGameFinished,
} from '../domain/rules'
import type { GameState, Move, PieceColor } from '../domain/types'

/**
 * Application state
 */
export type AppState =
  | { readonly type: 'LOADING' }
  | {
      readonly type: 'PLAYING'
      readonly gameState: GameState
      readonly moves: readonly Move[]
    }
  | { readonly type: 'ERROR'; readonly error: string }
  | {
      readonly type: 'RESULT'
      readonly gameState: GameState
      readonly moves: readonly Move[]
    }

/**
 * Game initialization result
 */
export type GameInitializationResult =
  | {
      readonly success: true
      readonly gameState: GameState
      readonly moves: readonly Move[]
    }
  | { readonly success: false; readonly error: string }

/**
 * Initialize game from DeviceLocal storage or create new game
 *
 * R1: STATE_LOADINGの意図どおり、起動時に「復元 or 新規生成」が行われる
 */
export async function initializeGame(): Promise<GameInitializationResult> {
  // Load from DeviceLocal storage
  const loadResult = loadGameFromDeviceLocal()

  if (!loadResult.success) {
    return {
      success: false,
      error: `Failed to load game: ${loadResult.error}`,
    }
  }

  // If no saved game exists, create new game
  if (loadResult.record === null) {
    const initialBoard = createInitialBoard()
    const gameState: GameState = {
      board: initialBoard,
      nextTurnColor: 'BLACK',
      isFinished: false,
    }
    return {
      success: true,
      gameState,
      moves: [],
    }
  }

  // Restore game from saved moves
  const moves = loadResult.record.moves

  // Recompute board state from moves (R2: movesを真実源にし、派生情報は再計算)
  const board = recomputeBoardFromMoves(moves)

  // Determine next turn color
  // After applying all moves, next turn should be opposite of last move color
  let nextTurnColor: PieceColor = 'BLACK'
  if (moves.length > 0) {
    const lastMove = moves[moves.length - 1]
    nextTurnColor = lastMove.color === 'BLACK' ? 'WHITE' : 'BLACK'
  }

  // Check if game is finished
  // We need previous turn color to check finish condition
  const previousTurnColor: PieceColor =
    moves.length > 0 ? moves[moves.length - 1].color : 'WHITE' // If no moves, previous was WHITE (before BLACK starts)
  const isFinished = isGameFinished(board, nextTurnColor, previousTurnColor)

  const gameState: GameState = {
    board,
    nextTurnColor,
    isFinished,
  }

  return {
    success: true,
    gameState,
    moves,
  }
}
