import { describe, it, expect } from 'vitest'
import {
  createInitialBoard,
  getLegalMoves,
  applyMove,
  canPass,
  isGameFinished,
  computeGameResult,
  recomputeBoardFromMoves,
} from './rules'
import type { Board, Move } from './types'

describe('Othello Rules Engine', () => {
  describe('createInitialBoard', () => {
    it('should create initial board with center pieces', () => {
      const board = createInitialBoard()
      // Center should be:
      // [3][3] = WHITE, [3][4] = BLACK
      // [4][3] = BLACK, [4][4] = WHITE
      expect(board[3][3]).toBe('WHITE')
      expect(board[3][4]).toBe('BLACK')
      expect(board[4][3]).toBe('BLACK')
      expect(board[4][4]).toBe('WHITE')
      // Other cells should be null
      expect(board[0][0]).toBeNull()
      expect(board[7][7]).toBeNull()
    })
  })

  describe('getLegalMoves', () => {
    it('should return legal moves for initial board (BLACK)', () => {
      const board = createInitialBoard()
      const legalMoves = getLegalMoves(board, 'BLACK')
      // Initial board: BLACK can play at (2,3), (3,2), (4,5), (5,4)
      expect(legalMoves.length).toBeGreaterThan(0)
      expect(legalMoves).toContainEqual({ row: 2, col: 3 })
      expect(legalMoves).toContainEqual({ row: 3, col: 2 })
      expect(legalMoves).toContainEqual({ row: 4, col: 5 })
      expect(legalMoves).toContainEqual({ row: 5, col: 4 })
    })

    it('should return empty array when no legal moves', () => {
      // Create a board where BLACK has no legal moves
      const board: Board = [
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
      ]
      const legalMoves = getLegalMoves(board, 'WHITE')
      expect(legalMoves).toEqual([])
    })
  })

  describe('applyMove', () => {
    it('should apply valid move and flip pieces', () => {
      const board = createInitialBoard()
      const result = applyMove(board, 'BLACK', 2, 3)
      expect(result.success).toBe(true)
      if (result.success) {
        // After placing BLACK at (2,3), piece at (3,3) should flip to BLACK
        expect(result.newState.board[2][3]).toBe('BLACK')
        expect(result.newState.board[3][3]).toBe('BLACK')
        expect(result.newState.nextTurnColor).toBe('WHITE')
        expect(result.newState.isFinished).toBe(false)
      }
    })

    it('should reject invalid move', () => {
      const board = createInitialBoard()
      const result = applyMove(board, 'BLACK', 0, 0)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('should reject move to occupied cell', () => {
      const board = createInitialBoard()
      const result = applyMove(board, 'BLACK', 3, 3)
      expect(result.success).toBe(false)
    })
  })

  describe('canPass', () => {
    it('should return true when no legal moves', () => {
      const board: Board = [
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
      ]
      expect(canPass(board, 'WHITE')).toBe(true)
    })

    it('should return false when legal moves exist', () => {
      const board = createInitialBoard()
      expect(canPass(board, 'BLACK')).toBe(false)
    })
  })

  describe('isGameFinished', () => {
    it('should return false for initial board', () => {
      const board = createInitialBoard()
      expect(isGameFinished(board, 'BLACK', 'WHITE')).toBe(false)
    })

    it('should return true when board is full', () => {
      const board: Board = [
        [
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
        ],
        [
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
        ],
        [
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
        ],
        [
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
        ],
        [
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
        ],
        [
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
        ],
        [
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
        ],
        [
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
          'WHITE',
          'BLACK',
        ],
      ]
      expect(isGameFinished(board, 'BLACK', 'WHITE')).toBe(true)
    })

    it('should return true when both players must pass', () => {
      const board: Board = [
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
      ]
      expect(isGameFinished(board, 'BLACK', 'WHITE')).toBe(true)
    })
  })

  describe('computeGameResult', () => {
    it('should count pieces correctly', () => {
      const board: Board = [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, 'WHITE', 'BLACK', null, null, null],
        [null, null, null, 'BLACK', 'WHITE', null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
      const result = computeGameResult(board)
      expect(result.blackCount).toBe(2)
      expect(result.whiteCount).toBe(2)
      expect(result.winner).toBeNull() // Draw
    })

    it('should determine winner correctly', () => {
      const board: Board = [
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
        ],
        [
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'BLACK',
          'WHITE',
          'WHITE',
        ],
      ]
      const result = computeGameResult(board)
      expect(result.blackCount).toBe(62)
      expect(result.whiteCount).toBe(2)
      expect(result.winner).toBe('BLACK')
    })
  })

  describe('recomputeBoardFromMoves', () => {
    it('should recompute board from empty moves (initial state)', () => {
      const moves: Move[] = []
      const board = recomputeBoardFromMoves(moves)
      expect(board[3][3]).toBe('WHITE')
      expect(board[3][4]).toBe('BLACK')
      expect(board[4][3]).toBe('BLACK')
      expect(board[4][4]).toBe('WHITE')
    })

    it('should recompute board from moves', () => {
      const moves: Move[] = [
        {
          moveNumber: 1,
          color: 'BLACK',
          row: 2,
          col: 3,
          isPass: false,
        },
      ]
      const board = recomputeBoardFromMoves(moves)
      // After BLACK plays at (2,3), piece at (3,3) should flip to BLACK
      expect(board[2][3]).toBe('BLACK')
      expect(board[3][3]).toBe('BLACK')
    })

    it('should handle pass moves', () => {
      const moves: Move[] = [
        {
          moveNumber: 1,
          color: 'BLACK',
          row: 2,
          col: 3,
          isPass: false,
        },
        {
          moveNumber: 2,
          color: 'WHITE',
          row: null,
          col: null,
          isPass: true,
        },
      ]
      const board = recomputeBoardFromMoves(moves)
      // Board should reflect BLACK's move, WHITE's pass doesn't change board
      expect(board[2][3]).toBe('BLACK')
      expect(board[3][3]).toBe('BLACK')
    })
  })
})
