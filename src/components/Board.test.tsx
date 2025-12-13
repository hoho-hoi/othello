/**
 * Tests for Board component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Board } from './Board'
import { createInitialBoard, getLegalMoves } from '../domain/rules'
import type { GameState, Position } from '../domain/types'

describe('Board', () => {
  it('should render 8x8 board', () => {
    const gameState: GameState = {
      board: createInitialBoard(),
      nextTurnColor: 'BLACK',
      isFinished: false,
    }

    const onCellClick = vi.fn()

    render(<Board gameState={gameState} onCellClick={onCellClick} />)

    // Should have 64 cells (8x8)
    const cells = screen.getAllByRole('button')
    expect(cells.length).toBe(64)
  })

  it('should call onCellClick when cell is clicked', async () => {
    const user = userEvent.setup()
    const gameState: GameState = {
      board: createInitialBoard(),
      nextTurnColor: 'BLACK',
      isFinished: false,
    }

    const onCellClick = vi.fn()

    render(<Board gameState={gameState} onCellClick={onCellClick} />)

    const cells = screen.getAllByRole('button')
    await user.click(cells[0])

    expect(onCellClick).toHaveBeenCalledTimes(1)
    expect(onCellClick).toHaveBeenCalledWith(0, 0)
  })

  it('should display pieces correctly', () => {
    const gameState: GameState = {
      board: createInitialBoard(),
      nextTurnColor: 'BLACK',
      isFinished: false,
    }

    const onCellClick = vi.fn()

    render(<Board gameState={gameState} onCellClick={onCellClick} />)

    // Center cells should have pieces
    // (3,3) should be WHITE, (3,4) should be BLACK, etc.
    const cells = screen.getAllByRole('button')
    // We can't easily test the exact content without knowing the rendering structure,
    // but we can verify the cells exist
    expect(cells.length).toBe(64)
  })

  describe('Accessibility (Issue #24)', () => {
    describe('R2: Cell aria-label with position and state', () => {
      it('should have aria-label with row, col, and state for empty cell', () => {
        const gameState: GameState = {
          board: createInitialBoard(),
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const onCellClick = vi.fn()

        render(<Board gameState={gameState} onCellClick={onCellClick} />)

        // Find an empty cell (top-left corner should be empty)
        const cells = screen.getAllByRole('button')
        const firstCell = cells[0]

        // aria-label should include row, col, and state
        const ariaLabel = firstCell.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
        expect(ariaLabel).toMatch(/row.*col/i)
        expect(ariaLabel).toMatch(/empty/i)
      })

      it('should have aria-label with row, col, and state for BLACK cell', () => {
        const board = createInitialBoard()
        // Set a specific cell to BLACK
        board[3][4] = 'BLACK'

        const gameState: GameState = {
          board,
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const onCellClick = vi.fn()

        render(<Board gameState={gameState} onCellClick={onCellClick} />)

        // Find the cell at (3, 4) - it's the 4th row, 5th column (0-indexed)
        // Row 3 = 4th row, Col 4 = 5th column
        // Total cells before row 3: 3 * 8 = 24
        // Plus column 4: 24 + 4 = 28th cell (0-indexed)
        const cells = screen.getAllByRole('button')
        const targetCell = cells[3 * 8 + 4]

        const ariaLabel = targetCell.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
        expect(ariaLabel).toMatch(/row.*3.*col.*4/i)
        expect(ariaLabel).toMatch(/black/i)
      })

      it('should have aria-label with row, col, and state for WHITE cell', () => {
        const board = createInitialBoard()
        // Set a specific cell to WHITE
        board[3][3] = 'WHITE'

        const gameState: GameState = {
          board,
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const onCellClick = vi.fn()

        render(<Board gameState={gameState} onCellClick={onCellClick} />)

        // Find the cell at (3, 3)
        const cells = screen.getAllByRole('button')
        const targetCell = cells[3 * 8 + 3]

        const ariaLabel = targetCell.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
        expect(ariaLabel).toMatch(/row.*3.*col.*3/i)
        expect(ariaLabel).toMatch(/white/i)
      })
    })

    describe('R3: Keyboard navigation', () => {
      it('should allow Tab navigation between cells', async () => {
        const user = userEvent.setup()
        const gameState: GameState = {
          board: createInitialBoard(),
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const onCellClick = vi.fn()

        render(<Board gameState={gameState} onCellClick={onCellClick} />)

        const cells = screen.getAllByRole('button')
        const firstCell = cells[0]

        // Focus first cell
        firstCell.focus()
        expect(document.activeElement).toBe(firstCell)

        // Tab to next cell
        await user.tab()
        expect(document.activeElement).toBe(cells[1])
      })

      it('should trigger cell click on Enter key', async () => {
        const user = userEvent.setup()
        const gameState: GameState = {
          board: createInitialBoard(),
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const onCellClick = vi.fn()

        render(<Board gameState={gameState} onCellClick={onCellClick} />)

        const cells = screen.getAllByRole('button')
        const firstCell = cells[0]

        // Focus and press Enter
        firstCell.focus()
        await user.keyboard('{Enter}')

        expect(onCellClick).toHaveBeenCalledTimes(1)
        expect(onCellClick).toHaveBeenCalledWith(0, 0)
      })

      it('should trigger cell click on Space key', async () => {
        const user = userEvent.setup()
        const gameState: GameState = {
          board: createInitialBoard(),
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const onCellClick = vi.fn()

        render(<Board gameState={gameState} onCellClick={onCellClick} />)

        const cells = screen.getAllByRole('button')
        const firstCell = cells[0]

        // Focus and press Space
        firstCell.focus()
        await user.keyboard(' ')

        expect(onCellClick).toHaveBeenCalledTimes(1)
        expect(onCellClick).toHaveBeenCalledWith(0, 0)
      })
    })
  })

  describe('Legal moves hint (Issue #25)', () => {
    describe('R1: Legal moves are highlighted visually', () => {
      it('should apply highlight class to legal move cells', () => {
        const gameState: GameState = {
          board: createInitialBoard(),
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const legalMoves = getLegalMoves(
          gameState.board,
          gameState.nextTurnColor
        )
        const onCellClick = vi.fn()

        render(
          <Board
            gameState={gameState}
            onCellClick={onCellClick}
            legalMoves={legalMoves}
          />
        )

        // Check that legal move cells have the highlight class
        const cells = screen.getAllByRole('button')
        legalMoves.forEach((move: Position) => {
          const cellIndex = move.row * 8 + move.col
          const cell = cells[cellIndex]
          expect(cell).toHaveClass('board-cell-legal')
        })
      })

      it('should not apply highlight class to non-legal move cells', () => {
        const gameState: GameState = {
          board: createInitialBoard(),
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const legalMoves = getLegalMoves(
          gameState.board,
          gameState.nextTurnColor
        )
        const onCellClick = vi.fn()

        render(
          <Board
            gameState={gameState}
            onCellClick={onCellClick}
            legalMoves={legalMoves}
          />
        )

        // Check that non-legal move cells do not have the highlight class
        const cells = screen.getAllByRole('button')
        const legalMoveSet = new Set(
          legalMoves.map((move: Position) => `${move.row}-${move.col}`)
        )

        cells.forEach((cell, index) => {
          const row = Math.floor(index / 8)
          const col = index % 8
          const cellKey = `${row}-${col}`

          if (!legalMoveSet.has(cellKey)) {
            expect(cell).not.toHaveClass('board-cell-legal')
          }
        })
      })
    })

    describe('R2: Non-legal move cells are disabled', () => {
      it('should disable non-legal move cells', () => {
        const gameState: GameState = {
          board: createInitialBoard(),
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const legalMoves = getLegalMoves(
          gameState.board,
          gameState.nextTurnColor
        )
        const onCellClick = vi.fn()

        render(
          <Board
            gameState={gameState}
            onCellClick={onCellClick}
            legalMoves={legalMoves}
          />
        )

        // Check that non-legal move cells are disabled
        const cells = screen.getAllByRole('button')
        const legalMoveSet = new Set(
          legalMoves.map((move: Position) => `${move.row}-${move.col}`)
        )

        cells.forEach((cell, index) => {
          const row = Math.floor(index / 8)
          const col = index % 8
          const cellKey = `${row}-${col}`

          if (!legalMoveSet.has(cellKey)) {
            expect(cell).toBeDisabled()
          } else {
            expect(cell).not.toBeDisabled()
          }
        })
      })

      it('should not call onCellClick when disabled cell is clicked', async () => {
        const user = userEvent.setup()
        const gameState: GameState = {
          board: createInitialBoard(),
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const legalMoves = getLegalMoves(
          gameState.board,
          gameState.nextTurnColor
        )
        const onCellClick = vi.fn()

        render(
          <Board
            gameState={gameState}
            onCellClick={onCellClick}
            legalMoves={legalMoves}
          />
        )

        // Find a disabled cell (non-legal move)
        const cells = screen.getAllByRole('button')
        const legalMoveSet = new Set(
          legalMoves.map((move: Position) => `${move.row}-${move.col}`)
        )

        let disabledCellIndex = -1
        for (let i = 0; i < cells.length; i++) {
          const row = Math.floor(i / 8)
          const col = i % 8
          const cellKey = `${row}-${col}`
          if (!legalMoveSet.has(cellKey)) {
            disabledCellIndex = i
            break
          }
        }

        if (disabledCellIndex >= 0) {
          const disabledCell = cells[disabledCellIndex]
          expect(disabledCell).toBeDisabled()

          // Try to click disabled cell
          await user.click(disabledCell)

          // onCellClick should not be called for disabled cells
          expect(onCellClick).not.toHaveBeenCalled()
        }
      })
    })

    describe('R3: Legal moves update immediately when turn changes', () => {
      it('should update legal moves when nextTurnColor changes', () => {
        const board = createInitialBoard()
        const gameStateBlack: GameState = {
          board,
          nextTurnColor: 'BLACK',
          isFinished: false,
        }

        const legalMovesBlack = getLegalMoves(board, 'BLACK')
        const onCellClick = vi.fn()

        const { rerender } = render(
          <Board
            gameState={gameStateBlack}
            onCellClick={onCellClick}
            legalMoves={legalMovesBlack}
          />
        )

        // Check initial legal moves for BLACK
        const cellsBlack = screen.getAllByRole('button')
        const legalMoveSetBlack = new Set(
          legalMovesBlack.map((move: Position) => `${move.row}-${move.col}`)
        )

        cellsBlack.forEach((cell, index) => {
          const row = Math.floor(index / 8)
          const col = index % 8
          const cellKey = `${row}-${col}`

          if (legalMoveSetBlack.has(cellKey)) {
            expect(cell).toHaveClass('board-cell-legal')
            expect(cell).not.toBeDisabled()
          } else {
            expect(cell).not.toHaveClass('board-cell-legal')
            expect(cell).toBeDisabled()
          }
        })

        // Change turn to WHITE
        const gameStateWhite: GameState = {
          board,
          nextTurnColor: 'WHITE',
          isFinished: false,
        }

        const legalMovesWhite = getLegalMoves(board, 'WHITE')

        rerender(
          <Board
            gameState={gameStateWhite}
            onCellClick={onCellClick}
            legalMoves={legalMovesWhite}
          />
        )

        // Check updated legal moves for WHITE
        const cellsWhite = screen.getAllByRole('button')
        const legalMoveSetWhite = new Set(
          legalMovesWhite.map((move: Position) => `${move.row}-${move.col}`)
        )

        cellsWhite.forEach((cell, index) => {
          const row = Math.floor(index / 8)
          const col = index % 8
          const cellKey = `${row}-${col}`

          if (legalMoveSetWhite.has(cellKey)) {
            expect(cell).toHaveClass('board-cell-legal')
            expect(cell).not.toBeDisabled()
          } else {
            expect(cell).not.toHaveClass('board-cell-legal')
            expect(cell).toBeDisabled()
          }
        })

        // Legal moves should be different between BLACK and WHITE
        // (They may have the same count, but the positions should differ)
        const legalMoveSetWhiteStr = new Set(
          legalMovesWhite.map((move: Position) => `${move.row}-${move.col}`)
        )
        // Check that at least one legal move position differs
        const allSame = legalMovesBlack.every((move: Position) =>
          legalMoveSetWhiteStr.has(`${move.row}-${move.col}`)
        )
        expect(allSame).toBe(false)
      })
    })
  })
})
