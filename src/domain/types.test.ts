import { describe, it, expect } from 'vitest'
import type { Board, Move, GameState } from './types'

describe('Domain Types', () => {
  describe('Board type', () => {
    it('should accept valid 8x8 board', () => {
      const board: Board = [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, 'BLACK', 'WHITE', null, null, null],
        [null, null, null, 'WHITE', 'BLACK', null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
      expect(board.length).toBe(8)
      expect(board[0].length).toBe(8)
    })
  })

  describe('Move type', () => {
    it('should represent normal move', () => {
      const move: Move = {
        moveNumber: 1,
        color: 'BLACK',
        row: 2,
        col: 3,
        isPass: false,
      }
      expect(move.isPass).toBe(false)
      expect(move.row).toBe(2)
      expect(move.col).toBe(3)
    })

    it('should represent pass move', () => {
      const move: Move = {
        moveNumber: 2,
        color: 'WHITE',
        row: null,
        col: null,
        isPass: true,
      }
      expect(move.isPass).toBe(true)
      expect(move.row).toBeNull()
      expect(move.col).toBeNull()
    })
  })

  describe('GameState type', () => {
    it('should represent game state', () => {
      const board: Board = [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, 'BLACK', 'WHITE', null, null, null],
        [null, null, null, 'WHITE', 'BLACK', null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
      const state: GameState = {
        board,
        nextTurnColor: 'BLACK',
        isFinished: false,
      }
      expect(state.nextTurnColor).toBe('BLACK')
      expect(state.isFinished).toBe(false)
    })
  })
})
