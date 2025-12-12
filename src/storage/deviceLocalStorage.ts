/**
 * DeviceLocal Storage Adapter
 *
 * Uses browser localStorage for persistence.
 * Choice: localStorage over IndexedDB because:
 * - Simpler API for single key-value storage
 * - Sufficient for moves-only record format (typically < 10KB)
 * - Better browser support and synchronous API
 * - No need for complex queries or transactions
 */

import type { Move } from '../domain/types'
import {
  parseRecordFormat,
  serializeRecordFormat,
  type RecordFormat,
  validateRecordFormat,
} from './recordFormat'

const STORAGE_KEY = 'othello_current_game'
export const MAX_RECORD_JSON_SIZE = 1024 * 1024

/**
 * Storage operation result
 */
export type StorageResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string }

/**
 * Save game moves to DeviceLocal storage
 *
 * Uses Record Format (moves-only / formatVersion=1).
 * Handles storage quota errors gracefully.
 */
export function saveGameToDeviceLocal(
  moves: readonly Move[]
): StorageResult<void> {
  try {
    const record: RecordFormat = {
      formatVersion: 1,
      moves,
    }

    // Validate before saving
    const validation = validateRecordFormat(record)
    if (!validation.success) {
      return {
        success: false,
        error: `Validation failed before save: ${validation.error}`,
      }
    }

    const json = serializeRecordFormat(record)

    // Check size limit (1 MiB as per REQUIREMENT.md)
    if (json.length > MAX_RECORD_JSON_SIZE) {
      return {
        success: false,
        error: `Record size exceeds limit: ${json.length} bytes > ${MAX_RECORD_JSON_SIZE} bytes`,
      }
    }

    localStorage.setItem(STORAGE_KEY, json)

    return { success: true, data: undefined }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'QuotaExceededError' ||
        error.message.includes('QuotaExceededError'))
    ) {
      return {
        success: false,
        error:
          'Storage quota exceeded. Please free up space or export your game.',
      }
    }
    return {
      success: false,
      error: `Storage save error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Load game moves from DeviceLocal storage
 *
 * Returns null if no saved game exists.
 * Validates record format before returning.
 */
export type LoadGameResult =
  | { readonly success: true; readonly record: RecordFormat | null }
  | { readonly success: false; readonly error: string }

export function loadGameFromDeviceLocal(): LoadGameResult {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (json === null) {
      return { success: true, record: null }
    }

    const parseResult = parseRecordFormat(json)
    if (!parseResult.success) {
      return {
        success: false,
        error: `Invalid record format: ${parseResult.error}`,
      }
    }

    return { success: true, record: parseResult.record! }
  } catch (error) {
    return {
      success: false,
      error: `Storage load error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Clear saved game from DeviceLocal storage
 */
export function clearGameFromDeviceLocal(): StorageResult<void> {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: `Failed to clear storage: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
