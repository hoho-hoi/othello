/**
 * Record Format (moves-only / formatVersion=1)
 *
 * Purpose: export/import/restore "current game" without managing a library.
 * Encoding: UTF-8 JSON text.
 * Versioning: formatVersion MUST be present for forward compatibility.
 */

import type { Move } from '../domain/types'

/**
 * Record Format schema (moves-only)
 */
export interface RecordFormat {
  readonly formatVersion: 1
  readonly moves: readonly Move[]
}

/**
 * Validation result
 */
export type ValidationResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string }

/**
 * Validate Record Format according to schema rules
 */
export function validateRecordFormat(record: unknown): ValidationResult {
  // Type guard: check if it's an object
  if (typeof record !== 'object' || record === null) {
    return { success: false, error: 'Record must be an object' }
  }

  const obj = record as Record<string, unknown>

  // Check formatVersion
  if (!('formatVersion' in obj)) {
    return { success: false, error: 'formatVersion is required' }
  }
  if (obj.formatVersion !== 1) {
    return {
      success: false,
      error: `formatVersion must be 1, got ${obj.formatVersion}`,
    }
  }

  // Check moves
  if (!('moves' in obj)) {
    return { success: false, error: 'moves is required' }
  }
  if (!Array.isArray(obj.moves)) {
    return { success: false, error: 'moves must be an array' }
  }

  const moves = obj.moves as unknown[]

  // Validate each move
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    if (typeof move !== 'object' || move === null) {
      return {
        success: false,
        error: `moves[${i}] must be an object`,
      }
    }

    const moveObj = move as Record<string, unknown>

    // Check moveNumber
    if (typeof moveObj.moveNumber !== 'number') {
      return {
        success: false,
        error: `moves[${i}].moveNumber must be a number`,
      }
    }

    // Check color
    if (moveObj.color !== 'BLACK' && moveObj.color !== 'WHITE') {
      return {
        success: false,
        error: `moves[${i}].color must be 'BLACK' or 'WHITE'`,
      }
    }

    // Check isPass
    if (typeof moveObj.isPass !== 'boolean') {
      return {
        success: false,
        error: `moves[${i}].isPass must be a boolean`,
      }
    }

    // Check row/col based on isPass
    if (moveObj.isPass) {
      if (moveObj.row !== null || moveObj.col !== null) {
        return {
          success: false,
          error: `moves[${i}]: when isPass=true, row and col must be null`,
        }
      }
    } else {
      if (typeof moveObj.row !== 'number' || typeof moveObj.col !== 'number') {
        return {
          success: false,
          error: `moves[${i}]: when isPass=false, row and col must be numbers`,
        }
      }
      if (
        moveObj.row < 0 ||
        moveObj.row > 7 ||
        moveObj.col < 0 ||
        moveObj.col > 7
      ) {
        return {
          success: false,
          error: `moves[${i}]: row and col must be in range 0..7`,
        }
      }
    }
  }

  // Check moveNumber ordering and gaps
  if (moves.length > 0) {
    const moveNumbers = moves.map(
      (m) => (m as Record<string, unknown>).moveNumber as number
    )
    for (let i = 0; i < moveNumbers.length; i++) {
      if (moveNumbers[i] !== i + 1) {
        return {
          success: false,
          error: `moves must be sorted by moveNumber ascending with no gaps (expected ${i + 1}, got ${moveNumbers[i]})`,
        }
      }
    }
  }

  return { success: true }
}

/**
 * Serialize Record Format to JSON string
 */
export function serializeRecordFormat(record: RecordFormat): string {
  return JSON.stringify(record, null, 2)
}

/**
 * Parse JSON string to Record Format (with validation)
 */
export function parseRecordFormat(
  json: string
): ValidationResult & { record?: RecordFormat } {
  try {
    const parsed = JSON.parse(json) as unknown
    const validation = validateRecordFormat(parsed)
    if (validation.success) {
      return {
        success: true,
        record: parsed as RecordFormat,
      }
    }
    return validation
  } catch (error) {
    return {
      success: false,
      error: `JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
