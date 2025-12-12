/**
 * Othello domain types
 *
 * Strict type definitions for board state, pieces, and game flow.
 */

/**
 * Piece color: BLACK or WHITE
 */
export type PieceColor = 'BLACK' | 'WHITE'

/**
 * Cell state: empty, black piece, or white piece
 */
export type CellState = PieceColor | null

/**
 * Board coordinates (0-based, 0..7)
 */
export type Row = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export type Col = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * Board position
 */
export interface Position {
  readonly row: Row
  readonly col: Col
}

/**
 * 8x8 board state (row-major order)
 * board[row][col] represents the cell at (row, col)
 */
export type Board = [
  [
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
  ],
  [
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
  ],
  [
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
  ],
  [
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
  ],
  [
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
  ],
  [
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
  ],
  [
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
  ],
  [
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
    CellState,
  ],
]

/**
 * Move representation
 * - Normal move: isPass=false, row/col are valid coordinates
 * - Pass move: isPass=true, row/col are null
 */
export interface Move {
  readonly moveNumber: number
  readonly color: PieceColor
  readonly row: Row | null
  readonly col: Col | null
  readonly isPass: boolean
}

/**
 * Game state
 */
export interface GameState {
  readonly board: Board
  readonly nextTurnColor: PieceColor
  readonly isFinished: boolean
}

/**
 * Result of applying a move
 */
export type ApplyMoveResult =
  | { readonly success: true; readonly newState: GameState }
  | { readonly success: false; readonly error: string }

/**
 * Game end result
 */
export interface GameResult {
  readonly blackCount: number
  readonly whiteCount: number
  readonly winner: PieceColor | null // null means draw
}
