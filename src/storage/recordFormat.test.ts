/**
 * Tests for Record Format validation and serialization
 */

import { describe, it, expect } from 'vitest'
import {
  validateRecordFormat,
  serializeRecordFormat,
  type RecordFormat,
} from './recordFormat'

describe('validateRecordFormat', () => {
  it('should accept valid record format with empty moves', () => {
    const record: RecordFormat = {
      formatVersion: 1,
      moves: [],
    }
    const result = validateRecordFormat(record)
    expect(result.success).toBe(true)
  })

  it('should accept valid record format with moves', () => {
    const record: RecordFormat = {
      formatVersion: 1,
      moves: [
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
      ],
    }
    const result = validateRecordFormat(record)
    expect(result.success).toBe(true)
  })

  it('should accept valid record format with pass moves', () => {
    const record: RecordFormat = {
      formatVersion: 1,
      moves: [
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
      ],
    }
    const result = validateRecordFormat(record)
    expect(result.success).toBe(true)
  })

  it('should reject missing formatVersion', () => {
    const record = {
      moves: [],
    } as unknown as RecordFormat
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('formatVersion')
    }
  })

  it('should reject invalid formatVersion', () => {
    const record = {
      formatVersion: 2,
      moves: [],
    } as unknown as RecordFormat
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('formatVersion')
    }
  })

  it('should reject missing moves', () => {
    const record = {
      formatVersion: 1,
    } as unknown as RecordFormat
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('moves')
    }
  })

  it('should reject moves not sorted by moveNumber', () => {
    const record: RecordFormat = {
      formatVersion: 1,
      moves: [
        {
          moveNumber: 2,
          color: 'WHITE',
          row: 4,
          col: 5,
          isPass: false,
        },
        {
          moveNumber: 1,
          color: 'BLACK',
          row: 2,
          col: 3,
          isPass: false,
        },
      ],
    }
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('moveNumber')
    }
  })

  it('should reject moves with gaps in moveNumber', () => {
    const record: RecordFormat = {
      formatVersion: 1,
      moves: [
        {
          moveNumber: 1,
          color: 'BLACK',
          row: 2,
          col: 3,
          isPass: false,
        },
        {
          moveNumber: 3,
          color: 'WHITE',
          row: 4,
          col: 5,
          isPass: false,
        },
      ],
    }
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('moveNumber')
    }
  })

  it('should reject invalid color', () => {
    const record = {
      formatVersion: 1,
      moves: [
        {
          moveNumber: 1,
          color: 'RED',
          row: 2,
          col: 3,
          isPass: false,
        },
      ],
    } as unknown as RecordFormat
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('color')
    }
  })

  it('should reject non-pass move with null row/col', () => {
    const record: RecordFormat = {
      formatVersion: 1,
      moves: [
        {
          moveNumber: 1,
          color: 'BLACK',
          row: null,
          col: null,
          isPass: false,
        },
      ],
    }
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('row')
    }
  })

  it('should reject pass move with non-null row/col', () => {
    const record: RecordFormat = {
      formatVersion: 1,
      moves: [
        {
          moveNumber: 1,
          color: 'BLACK',
          row: 2,
          col: 3,
          isPass: true,
        },
      ],
    }
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('isPass')
    }
  })

  it('should reject row/col out of range', () => {
    const record = {
      formatVersion: 1,
      moves: [
        {
          moveNumber: 1,
          color: 'BLACK',
          row: 8,
          col: 3,
          isPass: false,
        },
      ],
    } as unknown as RecordFormat
    const result = validateRecordFormat(record)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('row')
    }
  })
})

describe('serializeRecordFormat', () => {
  it('should serialize valid record format to JSON string', () => {
    const record: RecordFormat = {
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
    const json = serializeRecordFormat(record)
    expect(json).toBeTruthy()
    const parsed = JSON.parse(json)
    expect(parsed.formatVersion).toBe(1)
    expect(parsed.moves).toHaveLength(1)
  })
})
