/**
 * Othello Rules Engine
 *
 * Pure domain logic for Othello game rules:
 * - Legal move detection
 * - Move application (piece placement + flipping)
 * - Pass detection
 * - Game end detection
 * - Board recomputation from moves
 */

import type {
  Board,
  PieceColor,
  Position,
  GameState,
  ApplyMoveResult,
  GameResult,
  Move,
  CellState,
} from './types'

/**
 * Direction vectors (8 directions)
 * Note: These are offsets, not board positions, so they can be negative
 */
interface Direction {
  readonly row: number
  readonly col: number
}

const DIRECTIONS: readonly Direction[] = [
  { row: -1, col: -1 }, // top-left
  { row: -1, col: 0 }, // top
  { row: -1, col: 1 }, // top-right
  { row: 0, col: -1 }, // left
  { row: 0, col: 1 }, // right
  { row: 1, col: -1 }, // bottom-left
  { row: 1, col: 0 }, // bottom
  { row: 1, col: 1 }, // bottom-right
] as const

/**
 * Create initial board state (standard Othello starting position)
 */
export function createInitialBoard(): Board {
  const board: CellState[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))
  // Center pieces
  board[3][3] = 'WHITE'
  board[3][4] = 'BLACK'
  board[4][3] = 'BLACK'
  board[4][4] = 'WHITE'
  return board as Board
}

/**
 * Check if position is within board bounds
 */
function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

/**
 * Get opponent color
 */
function getOpponentColor(color: PieceColor): PieceColor {
  return color === 'BLACK' ? 'WHITE' : 'BLACK'
}

/**
 * Check if a move in a direction can flip pieces
 * Returns positions of pieces that would be flipped, or empty array if invalid
 */
function checkDirection(
  board: Board,
  row: number,
  col: number,
  color: PieceColor,
  direction: Direction
): Position[] {
  const opponentColor = getOpponentColor(color)
  const flipped: Position[] = []
  let currentRow = row + direction.row
  let currentCol = col + direction.col

  // Must start with opponent piece
  if (
    !isValidPosition(currentRow, currentCol) ||
    board[currentRow][currentCol] !== opponentColor
  ) {
    return []
  }

  // Collect opponent pieces
  while (
    isValidPosition(currentRow, currentCol) &&
    board[currentRow][currentCol] === opponentColor
  ) {
    flipped.push({
      row: currentRow as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
      col: currentCol as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
    })
    currentRow += direction.row
    currentCol += direction.col
  }

  // Must end with own color
  if (
    isValidPosition(currentRow, currentCol) &&
    board[currentRow][currentCol] === color
  ) {
    return flipped
  }

  return []
}

/**
 * Check if a move is legal at given position
 */
function isLegalMove(
  board: Board,
  row: number,
  col: number,
  color: PieceColor
): boolean {
  // Cell must be empty
  if (!isValidPosition(row, col) || board[row][col] !== null) {
    return false
  }

  // Must flip at least one piece in at least one direction
  for (const direction of DIRECTIONS) {
    const flipped = checkDirection(board, row, col, color, direction)
    if (flipped.length > 0) {
      return true
    }
  }

  return false
}

/**
 * Get all legal moves for a player
 */
export function getLegalMoves(board: Board, color: PieceColor): Position[] {
  const legalMoves: Position[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isLegalMove(board, row, col, color)) {
        legalMoves.push({
          row: row as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
          col: col as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
        })
      }
    }
  }
  return legalMoves
}

/**
 * Apply a move to the board (place piece and flip opponent pieces)
 * Returns new board state or error
 */
export function applyMove(
  board: Board,
  color: PieceColor,
  row: number,
  col: number
): ApplyMoveResult {
  // Validate position
  if (!isValidPosition(row, col)) {
    return { success: false, error: 'Invalid position' }
  }

  // Check if move is legal
  if (!isLegalMove(board, row, col, color)) {
    return { success: false, error: 'Illegal move' }
  }

  // Create new board
  const newBoard: CellState[][] = board.map((rowArr) => [...rowArr])
  newBoard[row][col] = color

  // Flip pieces in all valid directions
  for (const direction of DIRECTIONS) {
    const flipped = checkDirection(board, row, col, color, direction)
    for (const pos of flipped) {
      newBoard[pos.row][pos.col] = color
    }
  }

  const nextTurnColor = getOpponentColor(color)
  const newState: GameState = {
    board: newBoard as Board,
    nextTurnColor,
    isFinished: false,
  }

  return { success: true, newState }
}

/**
 * Check if player can pass (no legal moves)
 */
export function canPass(board: Board, color: PieceColor): boolean {
  return getLegalMoves(board, color).length === 0
}

/**
 * Check if game is finished
 * Game ends when:
 * - Board is full, OR
 * - Both players must pass consecutively
 */
export function isGameFinished(
  board: Board,
  currentTurnColor: PieceColor,
  previousTurnColor: PieceColor
): boolean {
  // Check if board is full
  let isEmpty = false
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === null) {
        isEmpty = true
        break
      }
    }
    if (isEmpty) break
  }
  if (!isEmpty) {
    return true
  }

  // Check if both players must pass
  const currentCanMove = getLegalMoves(board, currentTurnColor).length > 0
  const previousCanMove = getLegalMoves(board, previousTurnColor).length > 0
  return !currentCanMove && !previousCanMove
}

/**
 * Compute game result (piece counts and winner)
 */
export function computeGameResult(board: Board): GameResult {
  let blackCount = 0
  let whiteCount = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col]
      if (cell === 'BLACK') {
        blackCount++
      } else if (cell === 'WHITE') {
        whiteCount++
      }
    }
  }

  let winner: PieceColor | null = null
  if (blackCount > whiteCount) {
    winner = 'BLACK'
  } else if (whiteCount > blackCount) {
    winner = 'WHITE'
  }

  return { blackCount, whiteCount, winner }
}

/**
 * Recompute board state from moves sequence
 * Starts from initial board and applies moves in order
 */
export function recomputeBoardFromMoves(moves: readonly Move[]): Board {
  let board = createInitialBoard()
  let currentTurnColor: PieceColor = 'BLACK'

  for (const move of moves) {
    if (move.isPass) {
      // Pass: just switch turn
      currentTurnColor = getOpponentColor(currentTurnColor)
    } else {
      // Normal move: apply it
      if (move.row !== null && move.col !== null) {
        const result = applyMove(board, move.color, move.row, move.col)
        if (result.success) {
          board = result.newState.board
          currentTurnColor = result.newState.nextTurnColor
        }
        // If move fails, we still continue (error handling at higher level)
      }
    }
  }

  return board
}
