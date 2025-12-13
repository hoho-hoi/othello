/**
 * Tests for game state management and initialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initializeGame } from './gameState'
import { createInitialBoard } from '../domain/rules'
import * as deviceLocalStorage from '../storage/deviceLocalStorage'
import type { Move, Board } from '../domain/types'

vi.mock('../storage/deviceLocalStorage')

describe('initializeGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create new game when no saved game exists', async () => {
    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: null,
    })

    const result = await initializeGame()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.gameState).toBeTruthy()
      expect(result.gameState.board).toEqual(createInitialBoard())
      expect(result.gameState.nextTurnColor).toBe('BLACK')
      expect(result.gameState.isFinished).toBe(false)
      expect(result.moves).toEqual([])
    }
  })

  it('should restore game from saved moves', async () => {
    // Use a single legal move to avoid turn consistency issues
    // Initial board: BLACK can play at (2,3), (3,2), (4,5), (5,4)
    const savedMoves = [
      {
        moveNumber: 1,
        color: 'BLACK' as const,
        row: 2 as const,
        col: 3 as const,
        isPass: false,
      },
    ]

    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: {
        formatVersion: 1,
        moves: savedMoves,
      },
    })

    const result = await initializeGame()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.gameState).toBeTruthy()
      expect(result.moves).toEqual(savedMoves)
      // Board should be recomputed from moves
      expect(result.gameState.board).toBeTruthy()
      // After BLACK's move, next turn should be WHITE
      expect(result.gameState.nextTurnColor).toBe('WHITE')
    }
  })

  it('should reject invalid moves during restoration', async () => {
    // Use an illegal move to test validation
    const invalidMoves = [
      {
        moveNumber: 1,
        color: 'BLACK' as const,
        row: 0 as const,
        col: 0 as const,
        isPass: false,
      },
    ]

    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: {
        formatVersion: 1,
        moves: invalidMoves,
      },
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid game record')
      expect(result.error).toContain('Move 1')
    }
  })

  it('should reject invalid pass moves during restoration', async () => {
    // Use a pass move when legal moves are available
    const invalidPassMoves = [
      {
        moveNumber: 1,
        color: 'BLACK' as const,
        row: null,
        col: null,
        isPass: true,
      },
    ]

    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: {
        formatVersion: 1,
        moves: invalidPassMoves,
      },
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid game record')
      expect(result.error).toContain('Pass move invalid')
    }
  })

  it('should reject turn inconsistency during restoration', async () => {
    // Use WHITE move when BLACK should move first
    const turnInconsistentMoves = [
      {
        moveNumber: 1,
        color: 'WHITE' as const,
        row: 2 as const,
        col: 3 as const,
        isPass: false,
      },
    ]

    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: true,
      record: {
        formatVersion: 1,
        moves: turnInconsistentMoves,
      },
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid game record')
      expect(result.error).toContain('Expected BLACK')
    }
  })

  it('should handle storage load errors', async () => {
    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: false,
      error: 'Storage read error',
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Storage')
    }
  })

  it('should handle invalid record format errors', async () => {
    vi.mocked(deviceLocalStorage.loadGameFromDeviceLocal).mockReturnValue({
      success: false,
      error: 'Invalid record format: formatVersion must be 1',
    })

    const result = await initializeGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('format')
    }
  })
})

describe('placeStone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should place stone on legal move and update game state', async () => {
    const { placeStone } = await import('./gameState')
    const initialBoard = createInitialBoard()
    const gameState = {
      board: initialBoard,
      nextTurnColor: 'BLACK' as const,
      isFinished: false,
    }
    const moves: readonly Move[] = []

    // Mock save function
    vi.mocked(deviceLocalStorage.saveGameToDeviceLocal).mockReturnValue({
      success: true,
      data: undefined,
    })

    const result = await placeStone(gameState, moves, 2, 3)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.newGameState.nextTurnColor).toBe('WHITE')
      expect(result.newMoves.length).toBe(1)
      expect(result.newMoves[0].color).toBe('BLACK')
      expect(result.newMoves[0].row).toBe(2)
      expect(result.newMoves[0].col).toBe(3)
      expect(result.newMoves[0].isPass).toBe(false)
    }
  })

  it('should reject illegal move', async () => {
    const { placeStone } = await import('./gameState')
    const initialBoard = createInitialBoard()
    const gameState = {
      board: initialBoard,
      nextTurnColor: 'BLACK' as const,
      isFinished: false,
    }
    const moves: readonly Move[] = []

    const result = await placeStone(gameState, moves, 0, 0)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Illegal')
    }
  })

  it('should save game to DeviceLocal after successful move', async () => {
    const { placeStone } = await import('./gameState')
    const initialBoard = createInitialBoard()
    const gameState = {
      board: initialBoard,
      nextTurnColor: 'BLACK' as const,
      isFinished: false,
    }
    const moves: readonly Move[] = []

    vi.mocked(deviceLocalStorage.saveGameToDeviceLocal).mockReturnValue({
      success: true,
      data: undefined,
    })

    const result = await placeStone(gameState, moves, 2, 3)

    expect(result.success).toBe(true)
    expect(deviceLocalStorage.saveGameToDeviceLocal).toHaveBeenCalledTimes(1)
  })
})

describe('passTurn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Create a board where WHITE has no legal moves (all BLACK pieces)
   * This is a deterministic board state that guarantees canPass(board, 'WHITE') === true
   */
  const createBoardWhereWhiteCannotMove = (): Board => {
    return [
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
    ] as Board
  }

  /**
   * Create a board where both players have no legal moves
   * This is used for testing consecutive passes leading to game end
   */
  const createBoardWhereBothCannotMove = (): Board => {
    // A board where all cells are BLACK except one empty cell
    // Neither player can make a legal move from this position
    return [
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK'],
      ['BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', 'BLACK', null],
    ] as Board
  }

  it('should reject pass when legal moves are available', async () => {
    const { passTurn } = await import('./gameState')
    const initialBoard = createInitialBoard()
    const gameState = {
      board: initialBoard,
      nextTurnColor: 'BLACK' as const,
      isFinished: false,
    }
    const moves: readonly Move[] = []

    // Initial board has legal moves for BLACK, so pass should fail
    const result = await passTurn(gameState, moves)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('legal moves')
    }
  })

  it('should pass successfully when no legal moves available (R1, R2, R3)', async () => {
    const { passTurn } = await import('./gameState')
    const { canPass } = await import('../domain/rules')
    const board = createBoardWhereWhiteCannotMove()

    // Verify WHITE has no legal moves (deterministic)
    expect(canPass(board, 'WHITE')).toBe(true)

    const gameState = {
      board,
      nextTurnColor: 'WHITE' as const,
      isFinished: false,
    }
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK' as const,
        row: 2 as const,
        col: 3 as const,
        isPass: false,
      },
    ]

    vi.mocked(deviceLocalStorage.saveGameToDeviceLocal).mockReturnValue({
      success: true,
      data: undefined,
    })

    const result = await passTurn(gameState, moves)

    // R1: Pass should succeed
    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error('Pass should succeed')
    }

    // R2: Pass move should be added to moves with correct format
    expect(result.newMoves.length).toBe(2)
    expect(result.newMoves[1].isPass).toBe(true)
    expect(result.newMoves[1].row).toBe(null)
    expect(result.newMoves[1].col).toBe(null)
    expect(result.newMoves[1].color).toBe('WHITE')
    expect(result.newMoves[1].moveNumber).toBe(2) // Sequential move number

    // R3: Turn should switch
    expect(result.newGameState.nextTurnColor).toBe('BLACK')

    // R2/R5: Should save to DeviceLocal
    expect(deviceLocalStorage.saveGameToDeviceLocal).toHaveBeenCalledTimes(1)
    expect(deviceLocalStorage.saveGameToDeviceLocal).toHaveBeenCalledWith(
      result.newMoves
    )
  })

  it('should transition to finished state when both players must pass consecutively (R4)', async () => {
    const { passTurn } = await import('./gameState')
    const { canPass, isGameFinished } = await import('../domain/rules')
    const board = createBoardWhereBothCannotMove()

    // Verify both players have no legal moves
    expect(canPass(board, 'WHITE')).toBe(true)
    expect(canPass(board, 'BLACK')).toBe(true)

    // Previous move was BLACK pass, now WHITE must pass
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK' as const,
        row: null,
        col: null,
        isPass: true,
      },
    ]

    const gameState = {
      board,
      nextTurnColor: 'WHITE' as const,
      isFinished: false,
    }

    // Verify game should finish after this pass
    expect(isGameFinished(board, 'WHITE', 'BLACK')).toBe(true)

    vi.mocked(deviceLocalStorage.saveGameToDeviceLocal).mockReturnValue({
      success: true,
      data: undefined,
    })

    const result = await passTurn(gameState, moves)

    // R4: Game should be finished after consecutive passes
    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error('Pass should succeed')
    }

    expect(result.newGameState.isFinished).toBe(true)
    expect(result.newMoves.length).toBe(2)
    expect(result.newMoves[1].isPass).toBe(true)
    expect(result.newMoves[1].color).toBe('WHITE')
  })
})

describe('startNewGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create new game with empty moves and save to DeviceLocal', async () => {
    const { startNewGame } = await import('./gameState')

    vi.mocked(deviceLocalStorage.saveGameToDeviceLocal).mockReturnValue({
      success: true,
      data: undefined,
    })

    const result = await startNewGame()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.gameState).toBeTruthy()
      expect(result.gameState.board).toEqual(createInitialBoard())
      expect(result.gameState.nextTurnColor).toBe('BLACK')
      expect(result.gameState.isFinished).toBe(false)
      expect(result.moves).toEqual([])
    }
    expect(deviceLocalStorage.saveGameToDeviceLocal).toHaveBeenCalledTimes(1)
    expect(deviceLocalStorage.saveGameToDeviceLocal).toHaveBeenCalledWith([])
  })

  it('should return error when DeviceLocal save fails', async () => {
    const { startNewGame } = await import('./gameState')

    vi.mocked(deviceLocalStorage.saveGameToDeviceLocal).mockReturnValue({
      success: false,
      error: 'Storage quota exceeded',
    })

    const result = await startNewGame()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Storage quota exceeded')
    }
  })
})

describe('exportRecordToClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock navigator.clipboard
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    })
  })

  it('should export record to clipboard successfully', async () => {
    const { exportRecordToClipboard } = await import('./gameState')
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK',
        row: 2,
        col: 3,
        isPass: false,
      },
    ]

    const result = await exportRecordToClipboard(moves)

    expect(result.success).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
    const writtenText = vi.mocked(navigator.clipboard.writeText).mock
      .calls[0][0]
    const parsed = JSON.parse(writtenText)
    expect(parsed.formatVersion).toBe(1)
    expect(parsed.moves).toEqual(moves)
  })

  it('should handle clipboard permission denied error', async () => {
    const { exportRecordToClipboard } = await import('./gameState')
    const moves: readonly Move[] = []

    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError')
    )

    const result = await exportRecordToClipboard(moves)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Permission denied')
    }
  })

  it('should handle clipboard write failure', async () => {
    const { exportRecordToClipboard } = await import('./gameState')
    const moves: readonly Move[] = []

    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
      new Error('Clipboard write failed')
    )

    const result = await exportRecordToClipboard(moves)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Clipboard write failed')
    }
  })
})

describe('exportRecordToFile', () => {
  let originalCreateElement: typeof document.createElement
  let mockLink: HTMLAnchorElement

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    globalThis.URL.revokeObjectURL = vi.fn()
    // Mock document.createElement for anchor elements only
    originalCreateElement = document.createElement
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement
    globalThis.document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') {
        return mockLink
      }
      return originalCreateElement.call(document, tagName)
    }) as typeof document.createElement
    globalThis.document.body.appendChild = vi.fn()
    globalThis.document.body.removeChild = vi.fn()
  })

  afterEach(() => {
    globalThis.document.createElement = originalCreateElement
  })

  it('should export record to file successfully', async () => {
    const { exportRecordToFile } = await import('./gameState')
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK',
        row: 2,
        col: 3,
        isPass: false,
      },
    ]

    const result = await exportRecordToFile(moves)

    expect(result.success).toBe(true)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
    // Verify blob content by checking the call
    expect(mockLink.download).toBe('othello-record.json')
    expect(mockLink.click).toHaveBeenCalledTimes(1)
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink)
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('should handle file download failure', async () => {
    const { exportRecordToFile } = await import('./gameState')
    const moves: readonly Move[] = []

    vi.mocked(URL.createObjectURL).mockImplementation(() => {
      throw new Error('Failed to create object URL')
    })

    const result = await exportRecordToFile(moves)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Failed to create object URL')
    }
  })
})

describe('prepareImportRecordFromClipboard', () => {
  let readTextMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    readTextMock = vi.fn()
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { readText: readTextMock },
      configurable: true,
      writable: true,
    })
  })

  it('should prepare import preview for valid record', async () => {
    const { prepareImportRecordFromClipboard } = await import('./gameState')
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK',
        row: 2,
        col: 3,
        isPass: false,
      },
    ]
    const clipboardText = JSON.stringify({
      formatVersion: 1,
      moves,
    })
    readTextMock.mockResolvedValue(clipboardText)

    const result = await prepareImportRecordFromClipboard()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.preview.moves).toEqual(moves)
      expect(result.preview.previewGameState.nextTurnColor).toBe('WHITE')
      expect(result.preview.recordSizeBytes).toBe(clipboardText.length)
    }
  })

  it('should reject oversized clipboard payload', async () => {
    const { prepareImportRecordFromClipboard } = await import('./gameState')
    const oversized = 'a'.repeat(deviceLocalStorage.MAX_RECORD_JSON_SIZE + 1)
    readTextMock.mockResolvedValue(oversized)

    const result = await prepareImportRecordFromClipboard()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Record size exceeds limit')
    }
  })

  it('should reject invalid record schemas', async () => {
    const { prepareImportRecordFromClipboard } = await import('./gameState')
    const invalidRecord = JSON.stringify({
      formatVersion: 2,
      moves: [],
    })
    readTextMock.mockResolvedValue(invalidRecord)

    const result = await prepareImportRecordFromClipboard()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Record validation failed')
    }
  })

  it('should reject rule validation failures', async () => {
    const { prepareImportRecordFromClipboard } = await import('./gameState')
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'WHITE',
        row: 2,
        col: 3,
        isPass: false,
      },
    ]
    readTextMock.mockResolvedValue(
      JSON.stringify({
        formatVersion: 1,
        moves,
      })
    )

    const result = await prepareImportRecordFromClipboard()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Rule validation failed')
    }
  })

  it('should surface clipboard read errors', async () => {
    const { prepareImportRecordFromClipboard } = await import('./gameState')
    readTextMock.mockRejectedValue(new Error('Permission denied'))

    const result = await prepareImportRecordFromClipboard()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Clipboard read error')
    }
  })
})

describe('prepareImportRecordFromFile', () => {
  const createMockFile = (
    content: string,
    overrides?: {
      size?: number
      text?: () => Promise<string>
    }
  ): File =>
    ({
      size: overrides?.size ?? content.length,
      name: 'record.json',
      type: 'application/json',
      lastModified: Date.now(),
      text: overrides?.text ?? vi.fn().mockResolvedValue(content),
      arrayBuffer: vi
        .fn()
        .mockResolvedValue(new TextEncoder().encode(content).buffer),
      slice: vi.fn(),
      stream: vi.fn(),
    }) as unknown as File

  const createValidMoves = (): readonly Move[] => [
    {
      moveNumber: 1,
      color: 'BLACK',
      row: 2,
      col: 3,
      isPass: false,
    },
  ]

  it('should prepare import preview for valid file', async () => {
    const { prepareImportRecordFromFile } = await import('./gameState')
    const moves = createValidMoves()
    const fileContent = JSON.stringify({
      formatVersion: 1,
      moves,
    })
    const file = createMockFile(fileContent)

    const result = await prepareImportRecordFromFile(file)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.preview.moves).toEqual(moves)
      expect(result.preview.previewGameState.nextTurnColor).toBe('WHITE')
      expect(result.preview.recordSizeBytes).toBeGreaterThan(0)
    }
  })

  it('should reject oversized files before reading', async () => {
    const { prepareImportRecordFromFile } = await import('./gameState')
    const oversizedContent = 'a'.repeat(
      deviceLocalStorage.MAX_RECORD_JSON_SIZE + 1
    )
    const file = createMockFile(oversizedContent, {
      size: deviceLocalStorage.MAX_RECORD_JSON_SIZE + 1,
    })

    const result = await prepareImportRecordFromFile(file)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Record size exceeds limit')
    }
  })

  it('should reject invalid schemas from file uploads', async () => {
    const { prepareImportRecordFromFile } = await import('./gameState')
    const invalidRecord = JSON.stringify({
      formatVersion: 2,
      moves: [],
    })
    const file = createMockFile(invalidRecord)

    const result = await prepareImportRecordFromFile(file)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Record validation failed')
    }
  })

  it('should surface file read errors', async () => {
    const { prepareImportRecordFromFile } = await import('./gameState')
    const brokenFile = createMockFile('{}', {
      text: vi.fn().mockRejectedValue(new Error('Failed to read file')),
    })

    const result = await prepareImportRecordFromFile(brokenFile)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('File read error')
    }
  })
})

describe('importRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save imported record and return success', async () => {
    const { importRecord } = await import('./gameState')
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK',
        row: 2,
        col: 3,
        isPass: false,
      },
    ]
    const previewGameState = {
      board: createInitialBoard(),
      nextTurnColor: 'BLACK' as const,
      isFinished: false,
    }

    vi.mocked(deviceLocalStorage.saveGameToDeviceLocal).mockReturnValue({
      success: true,
      data: undefined,
    })

    const result = await importRecord(moves, previewGameState)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.gameState).toBe(previewGameState)
      expect(result.moves).toBe(moves)
    }
    expect(deviceLocalStorage.saveGameToDeviceLocal).toHaveBeenCalledWith(moves)
  })

  it('should surface storage save errors', async () => {
    const { importRecord } = await import('./gameState')
    const moves: readonly Move[] = [
      {
        moveNumber: 1,
        color: 'BLACK',
        row: 2,
        col: 3,
        isPass: false,
      },
    ]
    const previewGameState = {
      board: createInitialBoard(),
      nextTurnColor: 'BLACK' as const,
      isFinished: false,
    }

    vi.mocked(deviceLocalStorage.saveGameToDeviceLocal).mockReturnValue({
      success: false,
      error: 'Quota exceeded',
    })

    const result = await importRecord(moves, previewGameState)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Failed to save imported record')
    }
  })
})
