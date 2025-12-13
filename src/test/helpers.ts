/**
 * Test helper utilities for reducing code duplication
 */

import type { Position } from '../domain/types'
import { createInitialBoard } from '../domain/rules'

/**
 * Calculate cell index from row and column
 * @param row - Row index (0-7)
 * @param col - Column index (0-7)
 * @returns Cell index (0-63)
 */
export function getCellIndex(row: number, col: number): number {
  return row * 8 + col
}

/**
 * Calculate row and column from cell index
 * @param index - Cell index (0-63)
 * @returns Object with row and col properties
 */
export function getRowColFromIndex(index: number): {
  row: number
  col: number
} {
  return {
    row: Math.floor(index / 8),
    col: index % 8,
  }
}

/**
 * Create a Set of legal move keys for efficient lookup
 * @param legalMoves - Array of legal moves
 * @returns Set of move keys in format "row-col"
 */
export function createLegalMoveSet(
  legalMoves: readonly Position[]
): Set<string> {
  return new Set(legalMoves.map((move) => `${move.row}-${move.col}`))
}

/**
 * Find the first legal move cell index from board cells
 * @param cells - Array of board cell elements
 * @param legalMoves - Array of legal moves
 * @returns Cell index of first legal move, or -1 if not found
 */
export function findFirstLegalMoveCellIndex(
  cells: NodeListOf<Element> | Element[],
  legalMoves: readonly Position[]
): number {
  const legalMoveSet = createLegalMoveSet(legalMoves)
  for (let i = 0; i < cells.length; i++) {
    const { row, col } = getRowColFromIndex(i)
    const cellKey = `${row}-${col}`
    if (legalMoveSet.has(cellKey)) {
      return i
    }
  }
  return -1
}

/**
 * Find the first disabled (non-legal) cell index from board cells
 * @param cells - Array of board cell elements
 * @param legalMoves - Array of legal moves
 * @returns Cell index of first disabled cell, or -1 if not found
 */
export function findFirstDisabledCellIndex(
  cells: NodeListOf<Element> | Element[],
  legalMoves: readonly Position[]
): number {
  const legalMoveSet = createLegalMoveSet(legalMoves)
  for (let i = 0; i < cells.length; i++) {
    const { row, col } = getRowColFromIndex(i)
    const cellKey = `${row}-${col}`
    if (!legalMoveSet.has(cellKey)) {
      return i
    }
  }
  return -1
}

/**
 * Create a standard game state for testing
 * @param overrides - Optional overrides for game state properties
 * @returns GameState object
 */
export function createTestGameState(overrides?: {
  board?: ReturnType<typeof createInitialBoard>
  nextTurnColor?: 'BLACK' | 'WHITE'
  isFinished?: boolean
}): {
  board: ReturnType<typeof createInitialBoard>
  nextTurnColor: 'BLACK' | 'WHITE'
  isFinished: boolean
} {
  return {
    board: overrides?.board ?? createInitialBoard(),
    nextTurnColor: overrides?.nextTurnColor ?? 'BLACK',
    isFinished: overrides?.isFinished ?? false,
  }
}
