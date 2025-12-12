/**
 * Tests for DeviceLocal storage adapter
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadGameFromDeviceLocal,
  saveGameToDeviceLocal,
  clearGameFromDeviceLocal,
} from './deviceLocalStorage'
import type { Move } from '../domain/types'

// Mock localStorage with actual store behavior
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

const localStorageMock = createLocalStorageMock()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('DeviceLocal Storage', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('saveGameToDeviceLocal', () => {
    it('should save empty game record', () => {
      const moves: Move[] = []
      const result = saveGameToDeviceLocal(moves)
      expect(result.success).toBe(true)
      const savedValue = localStorageMock.getItem('othello_current_game')
      expect(savedValue).toBeTruthy()
      const parsed = JSON.parse(savedValue!)
      expect(parsed.formatVersion).toBe(1)
      expect(parsed.moves).toHaveLength(0)
    })

    it('should save game record with moves', () => {
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
          row: 4,
          col: 5,
          isPass: false,
        },
      ]
      const result = saveGameToDeviceLocal(moves)
      expect(result.success).toBe(true)
      const savedValue = localStorageMock.getItem('othello_current_game')
      const parsed = JSON.parse(savedValue!)
      expect(parsed.formatVersion).toBe(1)
      expect(parsed.moves).toHaveLength(2)
    })

    it('should handle storage quota exceeded error', () => {
      const originalSetItem = localStorageMock.setItem
      localStorageMock.setItem = () => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      }
      const moves: Move[] = []
      const result = saveGameToDeviceLocal(moves)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('quota')
      }
      localStorageMock.setItem = originalSetItem
    })

    it('should handle other storage errors', () => {
      const originalSetItem = localStorageMock.setItem
      localStorageMock.setItem = () => {
        throw new Error('Storage error')
      }
      const moves: Move[] = []
      const result = saveGameToDeviceLocal(moves)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
      localStorageMock.setItem = originalSetItem
    })
  })

  describe('loadGameFromDeviceLocal', () => {
    it('should return null when no saved game exists', () => {
      const result = loadGameFromDeviceLocal()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.record).toBeNull()
      }
    })

    it('should load valid game record', () => {
      const record = {
        formatVersion: 1,
        moves: [
          {
            moveNumber: 1,
            color: 'BLACK',
            row: 2,
            col: 3,
            isPass: false,
          },
        ],
      }
      localStorageMock.setItem('othello_current_game', JSON.stringify(record))
      const result = loadGameFromDeviceLocal()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.record).toBeTruthy()
        expect(result.record?.moves).toHaveLength(1)
      }
    })

    it('should reject invalid JSON', () => {
      localStorageMock.setItem('othello_current_game', 'invalid json')
      const result = loadGameFromDeviceLocal()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('JSON')
      }
    })

    it('should reject invalid record format', () => {
      const invalidRecord = {
        formatVersion: 2,
        moves: [],
      }
      localStorageMock.setItem(
        'othello_current_game',
        JSON.stringify(invalidRecord)
      )
      const result = loadGameFromDeviceLocal()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('formatVersion')
      }
    })

    it('should handle storage read errors', () => {
      const originalGetItem = localStorageMock.getItem
      localStorageMock.getItem = () => {
        throw new Error('Storage read error')
      }
      const result = loadGameFromDeviceLocal()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
      localStorageMock.getItem = originalGetItem
    })
  })

  describe('clearGameFromDeviceLocal', () => {
    it('should remove saved game', () => {
      const moves: Move[] = [
        {
          moveNumber: 1,
          color: 'BLACK',
          row: 2,
          col: 3,
          isPass: false,
        },
      ]
      const saveResult = saveGameToDeviceLocal(moves)
      expect(saveResult.success).toBe(true)

      // Verify game was saved
      const loadBeforeClear = loadGameFromDeviceLocal()
      expect(loadBeforeClear.success).toBe(true)
      if (loadBeforeClear.success) {
        expect(loadBeforeClear.record).toBeTruthy()
      }

      const clearResult = clearGameFromDeviceLocal()
      expect(clearResult.success).toBe(true)

      // After clear, should return null
      const loadResult = loadGameFromDeviceLocal()
      expect(loadResult.success).toBe(true)
      if (loadResult.success) {
        expect(loadResult.record).toBeNull()
      }
    })
  })
})
