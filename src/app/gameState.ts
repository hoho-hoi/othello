/**
 * Game State Management
 *
 * Handles game initialization, state transitions, and persistence.
 */

import {
  loadGameFromDeviceLocal,
  saveGameToDeviceLocal,
  MAX_RECORD_JSON_SIZE,
} from '../storage/deviceLocalStorage'
import {
  createInitialBoard,
  recomputeBoardFromMovesValidated,
  isGameFinished,
  applyMove,
  canPass,
} from '../domain/rules'
import {
  serializeRecordFormat,
  parseRecordFormat,
  type RecordFormat,
} from '../storage/recordFormat'
import type { Board, GameState, Move, PieceColor } from '../domain/types'

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
  | {
      readonly type: 'IMPORT_CONFIRM'
      readonly previousGameState: GameState
      readonly previousMoves: readonly Move[]
      readonly pendingImport: ImportPreview
    }
  | {
      readonly type: 'IMPORTING'
      readonly previousGameState: GameState
      readonly previousMoves: readonly Move[]
      readonly pendingImport: ImportPreview
    }

/**
 * Determine next turn color after applying a sequence of moves.
 */
function deriveNextTurnColor(moves: readonly Move[]): PieceColor {
  if (moves.length === 0) {
    return 'BLACK'
  }
  const lastMove = moves[moves.length - 1]
  return lastMove.color === 'BLACK' ? 'WHITE' : 'BLACK'
}

/**
 * Determine previous turn color (last move owner or WHITE before any move).
 */
function derivePreviousTurnColor(moves: readonly Move[]): PieceColor {
  if (moves.length === 0) {
    return 'WHITE'
  }
  return moves[moves.length - 1].color
}

/**
 * Build GameState from a recomputed board and the original moves.
 */
function createGameStateFromBoard(
  board: Board,
  moves: readonly Move[]
): GameState {
  const nextTurnColor = deriveNextTurnColor(moves)
  const previousTurnColor = derivePreviousTurnColor(moves)
  const isFinished = isGameFinished(board, nextTurnColor, previousTurnColor)
  return {
    board,
    nextTurnColor,
    isFinished,
  }
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
    const gameState = createGameStateFromBoard(initialBoard, [])
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

  const gameState = createGameStateFromBoard(recomputeResult.board, moves)

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
 * Result type for passing turn
 */
export type PassTurnResult =
  | {
      readonly success: true
      readonly newGameState: GameState
      readonly newMoves: readonly Move[]
    }
  | { readonly success: false; readonly error: string }

/**
 * Pass turn when no legal moves available (R1, R2, R3, R4)
 *
 * R1: STATE_PLAYING 中、手番側に合法手が無い場合にパスが発生する
 * R2: パスは棋譜に 1 手として追加される（isPass=true, row/col=null, moveNumber 連番）
 * R3: パス後は手番が切り替わり、UI（Next turn / RecordSidebar）が更新される
 * R4: 両者が連続してパス等の条件で対局終了となる場合、isFinished=true になる
 */
export async function passTurn(
  gameState: GameState,
  moves: readonly Move[]
): Promise<PassTurnResult> {
  // Check if game is already finished
  if (gameState.isFinished) {
    return { success: false, error: 'Game is already finished' }
  }

  // R1: Check if pass is allowed (no legal moves available)
  if (!canPass(gameState.board, gameState.nextTurnColor)) {
    return {
      success: false,
      error: 'Cannot pass: legal moves are available',
    }
  }

  // R2: Create pass move record
  const passMove: Move = {
    moveNumber: moves.length + 1,
    color: gameState.nextTurnColor,
    row: null,
    col: null,
    isPass: true,
  }

  const newMoves: readonly Move[] = [...moves, passMove]

  // R3: Switch turn color
  const nextTurnColor: PieceColor =
    gameState.nextTurnColor === 'BLACK' ? 'WHITE' : 'BLACK'

  // R4: Check if game is finished (both players must pass consecutively)
  const previousTurnColor = gameState.nextTurnColor
  const isFinished = isGameFinished(
    gameState.board,
    nextTurnColor,
    previousTurnColor
  )

  const newGameState: GameState = {
    board: gameState.board, // Board doesn't change on pass
    nextTurnColor,
    isFinished,
  }

  // Save to DeviceLocal storage
  const saveResult = saveGameToDeviceLocal(newMoves)
  if (!saveResult.success) {
    return {
      success: false,
      error: `Pass applied but save failed: ${saveResult.error}`,
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
  const gameState = createGameStateFromBoard(initialBoard, [])

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

export interface ImportPreview {
  readonly moves: readonly Move[]
  readonly previewGameState: GameState
  readonly recordSizeBytes: number
}

export type PrepareImportResult =
  | { readonly success: true; readonly preview: ImportPreview }
  | { readonly success: false; readonly error: string }

function buildImportPreviewFromText(recordText: string): PrepareImportResult {
  if (recordText.length > MAX_RECORD_JSON_SIZE) {
    return {
      success: false,
      error: `Record size exceeds limit: ${recordText.length} bytes > ${MAX_RECORD_JSON_SIZE} bytes`,
    }
  }

  const parseResult = parseRecordFormat(recordText)
  if (!parseResult.success) {
    return {
      success: false,
      error: `Record validation failed: ${parseResult.error}`,
    }
  }

  if (!parseResult.record) {
    return {
      success: false,
      error: 'Record parsing produced no data',
    }
  }

  const moves = parseResult.record.moves
  const recomputeResult = recomputeBoardFromMovesValidated(moves)
  if (!recomputeResult.success) {
    return {
      success: false,
      error: `Rule validation failed: ${recomputeResult.error}`,
    }
  }

  const previewGameState = createGameStateFromBoard(
    recomputeResult.board,
    moves
  )

  return {
    success: true,
    preview: {
      moves,
      previewGameState,
      recordSizeBytes: recordText.length,
    },
  }
}

/**
 * Prepare import record (clipboard) by performing staged validation.
 *
 * 1. JSON parse + schema validation (via parseRecordFormat)
 * 2. Rule consistency check (recomputeBoardFromMovesValidated)
 * 3. Build GameState for preview
 */
export async function prepareImportRecordFromClipboard(): Promise<PrepareImportResult> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.clipboard ||
    typeof navigator.clipboard.readText !== 'function'
  ) {
    return {
      success: false,
      error: 'Clipboard API is unavailable',
    }
  }

  try {
    const clipboardText = await navigator.clipboard.readText()
    return buildImportPreviewFromText(clipboardText)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? 'Unknown error')
    return {
      success: false,
      error: `Clipboard read error: ${message}`,
    }
  }
}

async function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text()
  }

  if (typeof file.arrayBuffer === 'function') {
    const buffer = await file.arrayBuffer()
    const decoder = new TextDecoder()
    return decoder.decode(buffer)
  }

  throw new Error('File API does not support text() or arrayBuffer()')
}

/**
 * Prepare import record (file upload) using the same staged validation steps
 * as clipboard import.
 *
 * @param file - User-selected JSON file that encodes the record format.
 */
export async function prepareImportRecordFromFile(
  file: File
): Promise<PrepareImportResult> {
  if (file.size > MAX_RECORD_JSON_SIZE) {
    return {
      success: false,
      error: `Record size exceeds limit: ${file.size} bytes > ${MAX_RECORD_JSON_SIZE} bytes`,
    }
  }

  try {
    const fileText = await readFileAsText(file)
    return buildImportPreviewFromText(fileText)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? 'Unknown error')
    return {
      success: false,
      error: `File read error: ${message}`,
    }
  }
}

export type ImportRecordResult =
  | {
      readonly success: true
      readonly gameState: GameState
      readonly moves: readonly Move[]
    }
  | { readonly success: false; readonly error: string }

/**
 * Persist imported moves (OP_IMPORT_RECORD_FROM_CLIPBOARD).
 */
export async function importRecord(
  moves: readonly Move[],
  previewGameState: GameState
): Promise<ImportRecordResult> {
  const saveResult = saveGameToDeviceLocal(moves)
  if (!saveResult.success) {
    return {
      success: false,
      error: `Failed to save imported record: ${saveResult.error}`,
    }
  }

  return {
    success: true,
    gameState: previewGameState,
    moves,
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
