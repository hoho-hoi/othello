/**
 * Board Component
 *
 * R1: 8x8の盤面UIを表示し、セルタップで着手を試みる
 * Issue #25: Legal moves hint (highlight and disable non-legal cells)
 * Issue #34: Performance optimization - memoize legalMoveSet creation
 */

import { useMemo } from 'react'
import type { GameState, Position } from '../domain/types'

interface BoardProps {
  readonly gameState: GameState
  readonly onCellClick: (row: number, col: number) => void
  /**
   * Legal moves for the current turn.
   * - `undefined`: Legacy behavior (all cells are clickable)
   * - `[]`: No legal moves (all cells are disabled)
   * - `Position[]`: Only legal move cells are clickable
   */
  readonly legalMoves?: readonly Position[]
}

/**
 * Board component - renders 8x8 Othello board
 */
export function Board({
  gameState,
  onCellClick,
  legalMoves,
}: BoardProps): JSX.Element {
  // If legalMoves is undefined, use legacy behavior (all cells clickable)
  const isLegacyMode = legalMoves === undefined

  // Create a Set for O(1) lookup of legal moves
  // Memoize to avoid recreating Set on every render (performance optimization)
  const legalMoveSet = useMemo(() => {
    if (isLegacyMode) {
      return new Set<string>()
    }
    return new Set(
      legalMoves.map((move: Position) => `${move.row}-${move.col}`)
    )
  }, [isLegacyMode, legalMoves])

  return (
    <div className="board" data-testid="board">
      {gameState.board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => {
            const cellState =
              cell === 'BLACK' ? 'BLACK' : cell === 'WHITE' ? 'WHITE' : 'empty'
            const ariaLabel = `Row ${rowIndex} Col ${colIndex} ${cellState}`
            const cellKey = `${rowIndex}-${colIndex}`
            const isLegalMove = legalMoveSet.has(cellKey)
            // Disable non-legal cells when legalMoves is provided (even if empty)
            const isDisabled = !isLegacyMode && !isLegalMove

            // Build className: base class + legal move highlight if applicable
            const className = isLegalMove
              ? 'board-cell board-cell-legal'
              : 'board-cell'

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={className}
                onClick={() => {
                  if (!isDisabled) {
                    onCellClick(rowIndex, colIndex)
                  }
                }}
                disabled={isDisabled}
                aria-label={ariaLabel}
              >
                {cell === 'BLACK' ? '●' : cell === 'WHITE' ? '○' : ''}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
