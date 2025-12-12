/**
 * Game State Management
 *
 * Handles game initialization, state transitions, and persistence.
 */

import {
  loadGameFromDeviceLocal,
  saveGameToDeviceLocal,
} from '../storage/deviceLocalStorage'
import {
  createInitialBoard,
  recomputeBoardFromMovesValidated,
  isGameFinished,
  applyMove,
} from '../domain/rules'
import {
  serializeRecordFormat,
  type RecordFormat,
} from '../storage/recordFormat'
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
  | {
      readonly type: 'NEW_GAME_CONFIRM'
      readonly previousState: 'PLAYING' | 'RESULT'
      readonly previousGameState: GameState
      readonly previousMoves: readonly Move[]
    }
  | {
      readonly type: 'EXPORTING'
      readonly originState: 'PLAYING' | 'RESULT'
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

  // Recompute board state from moves with rule consistency validation
  // R2: movesを真実源にし、派生情報は再計算
  // Rule consistency check: validate legal moves, pass validity, turn consistency
  const recomputeResult = recomputeBoardFromMovesValidated(moves)
  if (!recomputeResult.success) {
    return {
      success: false,
      error: `Invalid game record: ${recomputeResult.error}`,
    }
  }
  const board = recomputeResult.board

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

/**
 * Result type for placing a stone
 */
export type PlaceStoneResult =
  | {
      readonly success: true
      readonly newGameState: GameState
      readonly newMoves: readonly Move[]
    }
  | { readonly success: false; readonly error: string }

/**
 * Place stone on board (OP_PLACE_STONE)
 *
 * R2: 合法手のみ着手を反映し、石の反転と手番更新が行われる
 * R3: 不正手は着手せず、エラーを返す（クラッシュしない）
 * R5: 着手後にDeviceLocalへ保存される
 */
export async function placeStone(
  gameState: GameState,
  moves: readonly Move[],
  row: number,
  col: number
): Promise<PlaceStoneResult> {
  // Check if game is already finished
  if (gameState.isFinished) {
    return { success: false, error: 'Game is already finished' }
  }

  // Apply move using domain rules
  const applyResult = applyMove(
    gameState.board,
    gameState.nextTurnColor,
    row,
    col
  )

  if (!applyResult.success) {
    // R3: Invalid move - return error without crashing
    return { success: false, error: applyResult.error }
  }

  // R2: Create new move record
  const newMove: Move = {
    moveNumber: moves.length + 1,
    color: gameState.nextTurnColor,
    row: row as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
    col: col as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
    isPass: false,
  }

  const newMoves: readonly Move[] = [...moves, newMove]

  // Check if game is finished after this move
  const previousTurnColor = gameState.nextTurnColor
  const isFinished = isGameFinished(
    applyResult.newState.board,
    applyResult.newState.nextTurnColor,
    previousTurnColor
  )

  const newGameState: GameState = {
    board: applyResult.newState.board,
    nextTurnColor: applyResult.newState.nextTurnColor,
    isFinished,
  }

  // R5: Save to DeviceLocal storage
  const saveResult = saveGameToDeviceLocal(newMoves)
  if (!saveResult.success) {
    // Even if save fails, we return success but log the error
    // This allows game to continue, but save error should be handled by UI
    return {
      success: false,
      error: `Move applied but save failed: ${saveResult.error}`,
    }
  }

  return {
    success: true,
    newGameState,
    newMoves,
  }
}

/**
 * Start new game (OP_START_NEW_GAME)
 *
 * R3: 新規ゲーム生成後、UIは STATE_PLAYING に遷移し、棋譜は空（moves=[]）相当から開始できる
 * R4: DeviceLocal 保存失敗時はクラッシュせず、ユーザに分かる形でエラーを提示する
 */
export async function startNewGame(): Promise<GameInitializationResult> {
  // Create new game with initial board
  const initialBoard = createInitialBoard()
  const gameState: GameState = {
    board: initialBoard,
    nextTurnColor: 'BLACK',
    isFinished: false,
  }

  // R4: Save to DeviceLocal storage
  const saveResult = saveGameToDeviceLocal([])
  if (!saveResult.success) {
    return {
      success: false,
      error: `Failed to save new game: ${saveResult.error}`,
    }
  }

  return {
    success: true,
    gameState,
    moves: [],
  }
}

/**
 * Export record result
 */
export type ExportRecordResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string }

/**
 * Export record to clipboard (OP_EXPORT_RECORD_TO_CLIPBOARD)
 *
 * R2: Export 先として Clipboard を提供する
 * R3: 出力形式は Record Format（moves-only / formatVersion=1）に準拠する
 * R5: 失敗時はクラッシュせず、ユーザに分かる形でエラーを提示する
 */
export async function exportRecordToClipboard(
  moves: readonly Move[]
): Promise<ExportRecordResult> {
  try {
    // R3: Create Record Format with formatVersion=1
    const record: RecordFormat = {
      formatVersion: 1,
      moves: moves,
    }

    // Serialize to JSON string
    const jsonString = serializeRecordFormat(record)

    // Write to clipboard
    await navigator.clipboard.writeText(jsonString)

    return { success: true }
  } catch (error) {
    // R5: Handle errors gracefully
    const errorMessage =
      error instanceof Error
        ? error.message
        : error instanceof DOMException
          ? error.message
          : 'Unknown clipboard error'
    return {
      success: false,
      error: `Failed to export to clipboard: ${errorMessage}`,
    }
  }
}

/**
 * Export record to file (OP_EXPORT_RECORD_TO_FILE)
 *
 * R2: Export 先として File（download）を提供する
 * R3: 出力形式は Record Format（moves-only / formatVersion=1）に準拠する
 * R5: 失敗時はクラッシュせず、ユーザに分かる形でエラーを提示する
 */
export async function exportRecordToFile(
  moves: readonly Move[]
): Promise<ExportRecordResult> {
  try {
    // R3: Create Record Format with formatVersion=1
    const record: RecordFormat = {
      formatVersion: 1,
      moves: moves,
    }

    // Serialize to JSON string
    const jsonString = serializeRecordFormat(record)

    // Create Blob with JSON content
    const blob = new Blob([jsonString], { type: 'application/json' })

    // Create object URL
    const url = URL.createObjectURL(blob)

    // Create temporary link element
    const link = document.createElement('a')
    link.href = url
    link.download = 'othello-record.json'
    document.body.appendChild(link)

    // Trigger download
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    // R5: Handle errors gracefully
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown file export error'
    return {
      success: false,
      error: `Failed to export to file: ${errorMessage}`,
    }
  }
}
