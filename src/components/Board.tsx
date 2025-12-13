/**
 * Board Component
 *
 * R1: 8x8の盤面UIを表示し、セルタップで着手を試みる
 */

import type { GameState } from '../domain/types'

interface BoardProps {
  readonly gameState: GameState
  readonly onCellClick: (row: number, col: number) => void
}

/**
 * Board component - renders 8x8 Othello board
 */
export function Board({ gameState, onCellClick }: BoardProps): JSX.Element {
  return (
    <div className="board" data-testid="board">
      {gameState.board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => {
            const cellState =
              cell === 'BLACK' ? 'BLACK' : cell === 'WHITE' ? 'WHITE' : 'empty'
            const ariaLabel = `Row ${rowIndex} Col ${colIndex} ${cellState}`
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                className="board-cell"
                onClick={() => onCellClick(rowIndex, colIndex)}
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
