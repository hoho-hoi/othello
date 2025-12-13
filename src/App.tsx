/**
 * Main App Component
 *
 * Handles OP_OPEN_APP: App launch with automatic game restoration or new game creation.
 * R1: STATE_LOADINGで起動時に「復元 or 新規生成」が行われる
 * R3: Save/Load失敗時はクラッシュせず、STATE_ERRORへ遷移できる
 */

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  initializeGame,
  placeStone,
  passTurn,
  startNewGame,
  exportRecordToClipboard,
  exportRecordToFile,
  prepareImportRecordFromClipboard,
  prepareImportRecordFromFile,
  importRecord,
  type AppState,
} from './app/gameState'
import { canPass } from './domain/rules'
import { Board } from './components/Board'
import { RecordSidebar } from './components/RecordSidebar'

function App() {
  const [appState, setAppState] = useState<AppState>({ type: 'LOADING' })
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const statusMessageElement = statusMessage ? (
    <p className="status-message" role="status">
      {statusMessage}
    </p>
  ) : null

  useEffect(() => {
    // R1: Initialize game on app launch
    const loadGame = async () => {
      const result = await initializeGame()

      if (result.success) {
        // Transition to PLAYING state
        setAppState({
          type: 'PLAYING',
          gameState: result.gameState,
          moves: result.moves,
        })
      } else {
        // R3: Transition to ERROR state on failure (no crash)
        setAppState({
          type: 'ERROR',
          error: result.error,
        })
      }
    }

    loadGame()
  }, [])

  // R1: Auto-pass when current player has no legal moves in PLAYING state
  useEffect(() => {
    if (appState.type !== 'PLAYING') {
      return
    }

    const currentState = appState
    const checkAndAutoPass = async () => {
      const currentPlayerCanPass = canPass(
        currentState.gameState.board,
        currentState.gameState.nextTurnColor
      )

      if (currentPlayerCanPass && !currentState.gameState.isFinished) {
        // R1: Auto-pass for current player
        const passResult = await passTurn(
          currentState.gameState,
          currentState.moves
        )

        if (passResult.success) {
          // R5: Show pass message
          setStatusMessage(
            `${currentState.gameState.nextTurnColor} passed (no legal moves)`
          )

          if (passResult.newGameState.isFinished) {
            // R4: Game finished after consecutive passes
            setAppState({
              type: 'RESULT',
              gameState: passResult.newGameState,
              moves: passResult.newMoves,
            })
          } else {
            // Continue playing after pass
            setAppState({
              type: 'PLAYING',
              gameState: passResult.newGameState,
              moves: passResult.newMoves,
            })
          }
        }
      }
    }

    checkAndAutoPass()
  }, [appState])

  // Render based on current state
  if (appState.type === 'LOADING') {
    return (
      <div>
        <h1>Othello</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (appState.type === 'ERROR') {
    return (
      <div>
        <h1>Othello</h1>
        <div>
          <h2>Error</h2>
          <p>{appState.error}</p>
          <button
            onClick={() => {
              // Retry initialization
              setAppState({ type: 'LOADING' })
              initializeGame().then((result) => {
                if (result.success) {
                  setAppState({
                    type: 'PLAYING',
                    gameState: result.gameState,
                    moves: result.moves,
                  })
                } else {
                  setAppState({
                    type: 'ERROR',
                    error: result.error,
                  })
                }
              })
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (appState.type === 'PLAYING') {
    const handleCellClick = async (row: number, col: number) => {
      // R1: セルタップで着手を試みる
      // R2, R3: 合法手のみ着手を反映し、不正手はエラーとして扱う
      const result = await placeStone(
        appState.gameState,
        appState.moves,
        row,
        col
      )

      if (result.success) {
        // R2: 合法手の場合、状態を更新
        // R5: DeviceLocalへの保存はplaceStone内で行われる
        if (result.newGameState.isFinished) {
          // Game finished - transition to RESULT state
          setAppState({
            type: 'RESULT',
            gameState: result.newGameState,
            moves: result.newMoves,
          })
        } else {
          // R1: Check if next player has legal moves, auto-pass if not
          const nextPlayerCanPass = canPass(
            result.newGameState.board,
            result.newGameState.nextTurnColor
          )

          if (nextPlayerCanPass) {
            // R1: Auto-pass for next player
            const passResult = await passTurn(
              result.newGameState,
              result.newMoves
            )

            if (passResult.success) {
              // R5: Show pass message
              setStatusMessage(
                `${result.newGameState.nextTurnColor} passed (no legal moves)`
              )

              if (passResult.newGameState.isFinished) {
                // R4: Game finished after consecutive passes
                setAppState({
                  type: 'RESULT',
                  gameState: passResult.newGameState,
                  moves: passResult.newMoves,
                })
              } else {
                // Continue playing after pass
                setAppState({
                  type: 'PLAYING',
                  gameState: passResult.newGameState,
                  moves: passResult.newMoves,
                })
              }
            } else {
              // Pass failed (shouldn't happen if canPass was true)
              console.error('Auto-pass failed:', passResult.error)
              setAppState({
                type: 'PLAYING',
                gameState: result.newGameState,
                moves: result.newMoves,
              })
            }
          } else {
            // Continue playing - next player has legal moves
            setAppState({
              type: 'PLAYING',
              gameState: result.newGameState,
              moves: result.newMoves,
            })
          }
        }
      } else {
        // R3: 不正手の場合、エラーを表示（クラッシュしない）
        // For now, we silently ignore invalid moves
        // In a production app, we might show a toast notification
        console.warn('Invalid move:', result.error)
      }
    }

    const handleNewGameClick = () => {
      setStatusMessage(null)
      // R1: STATE_PLAYING から New Game 操作ができる
      setAppState({
        type: 'NEW_GAME_CONFIRM',
        previousState: 'PLAYING',
        previousGameState: appState.gameState,
        previousMoves: appState.moves,
      })
    }

    const handleExportClick = () => {
      setStatusMessage(null)
      // R1: STATE_PLAYING から Export 操作ができる
      setAppState({
        type: 'EXPORTING',
        originState: 'PLAYING',
        gameState: appState.gameState,
        moves: appState.moves,
      })
    }

    const handleImportClipboardClick = async () => {
      if (appState.type !== 'PLAYING') {
        return
      }
      const currentState = appState
      setStatusMessage(null)
      const result = await prepareImportRecordFromClipboard()
      if (!result.success) {
        setStatusMessage(result.error)
        return
      }

      setAppState({
        type: 'IMPORT_CONFIRM',
        previousGameState: currentState.gameState,
        previousMoves: currentState.moves,
        pendingImport: result.preview,
      })
    }

    const handleImportFileButtonClick = () => {
      if (fileInputRef.current) {
        setStatusMessage(null)
        fileInputRef.current.click()
      }
    }

    const handleFileSelection = async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      if (appState.type !== 'PLAYING') {
        event.target.value = ''
        return
      }

      const file = event.target.files?.[0] ?? null
      event.target.value = ''
      if (!file) {
        return
      }

      const currentState = appState
      setStatusMessage(null)
      const result = await prepareImportRecordFromFile(file)
      if (!result.success) {
        setStatusMessage(result.error)
        return
      }

      setAppState({
        type: 'IMPORT_CONFIRM',
        previousGameState: currentState.gameState,
        previousMoves: currentState.moves,
        pendingImport: result.preview,
      })
    }

    return (
      <div className="app-playing">
        <h1>Othello</h1>
        {statusMessageElement}
        <div>
          <button onClick={handleNewGameClick}>New Game</button>
          <button onClick={handleExportClick}>Export</button>
          <button onClick={handleImportClipboardClick}>
            Import (Clipboard)
          </button>
          <button onClick={handleImportFileButtonClick}>Import (File)</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            data-testid="import-file-input"
            style={{ display: 'none' }}
            onChange={handleFileSelection}
          />
        </div>
        <div className="game-container">
          <div className="board-container">
            <p>Next turn: {appState.gameState.nextTurnColor}</p>
            <Board
              gameState={appState.gameState}
              onCellClick={handleCellClick}
            />
          </div>
          <RecordSidebar moves={appState.moves} />
        </div>
      </div>
    )
  }

  if (appState.type === 'RESULT') {
    const handleNewGameClick = () => {
      setStatusMessage(null)
      // R1: STATE_RESULT から New Game 操作ができる
      setAppState({
        type: 'NEW_GAME_CONFIRM',
        previousState: 'RESULT',
        previousGameState: appState.gameState,
        previousMoves: appState.moves,
      })
    }

    const handleExportClick = () => {
      setStatusMessage(null)
      // R1: STATE_RESULT から Export 操作ができる
      setAppState({
        type: 'EXPORTING',
        originState: 'RESULT',
        gameState: appState.gameState,
        moves: appState.moves,
      })
    }

    return (
      <div>
        <h1>Othello</h1>
        {statusMessageElement}
        <p>Game finished.</p>
        <div>
          <button onClick={handleNewGameClick}>New Game</button>
          <button onClick={handleExportClick}>Export</button>
        </div>
      </div>
    )
  }

  if (appState.type === 'NEW_GAME_CONFIRM') {
    const handleConfirm = async () => {
      // R2: Confirm で新規ゲーム生成・保存
      const result = await startNewGame()

      if (result.success) {
        // R3: 新規ゲーム生成後、UIは STATE_PLAYING に遷移し、棋譜は空（moves=[]）相当から開始できる
        setAppState({
          type: 'PLAYING',
          gameState: result.gameState,
          moves: result.moves,
        })
      } else {
        // R4: DeviceLocal 保存失敗時はクラッシュせず、ユーザに分かる形でエラーを提示する
        setAppState({
          type: 'ERROR',
          error: result.error,
        })
      }
    }

    const handleCancel = () => {
      // R2: Cancel で元の状態に戻る
      if (appState.previousState === 'PLAYING') {
        setAppState({
          type: 'PLAYING',
          gameState: appState.previousGameState,
          moves: appState.previousMoves,
        })
      } else {
        setAppState({
          type: 'RESULT',
          gameState: appState.previousGameState,
          moves: appState.previousMoves,
        })
      }
    }

    return (
      <div>
        <h1>Othello</h1>
        {statusMessageElement}
        <div>
          <h2>Start New Game</h2>
          <p>Current game will be abandoned. Are you sure?</p>
          <button onClick={handleConfirm}>Confirm</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    )
  }

  if (appState.type === 'IMPORT_CONFIRM') {
    const { pendingImport, previousGameState, previousMoves } = appState
    const lastMove =
      pendingImport.moves.length === 0
        ? null
        : pendingImport.moves[pendingImport.moves.length - 1]
    const lastMoveLabel = lastMove
      ? lastMove.isPass
        ? `${lastMove.moveNumber}. ${lastMove.color} Pass`
        : `${lastMove.moveNumber}. ${lastMove.color} (${lastMove.row}, ${lastMove.col})`
      : 'No moves yet'

    const handleImportConfirm = async () => {
      setStatusMessage(null)
      setAppState({
        type: 'IMPORTING',
        previousGameState,
        previousMoves,
        pendingImport,
      })

      const result = await importRecord(
        pendingImport.moves,
        pendingImport.previewGameState
      )

      if (result.success) {
        setAppState({
          type: 'PLAYING',
          gameState: result.gameState,
          moves: result.moves,
        })
        setStatusMessage('Record imported successfully.')
      } else {
        setStatusMessage(result.error)
        setAppState({
          type: 'PLAYING',
          gameState: previousGameState,
          moves: previousMoves,
        })
      }
    }

    const handleImportCancel = () => {
      setAppState({
        type: 'PLAYING',
        gameState: appState.previousGameState,
        moves: appState.previousMoves,
      })
    }

    return (
      <div>
        <h1>Othello</h1>
        {statusMessageElement}
        <div>
          <h2>Import Record</h2>
          <p>Moves: {pendingImport.moves.length}</p>
          <p>Last move: {lastMoveLabel}</p>
          <p>Next turn: {pendingImport.previewGameState.nextTurnColor}</p>
          <p>
            Game finished:{' '}
            {pendingImport.previewGameState.isFinished ? 'Yes' : 'No'}
          </p>
          <p>Record size: {pendingImport.recordSizeBytes} bytes</p>
          <button onClick={handleImportConfirm}>Confirm</button>
          <button onClick={handleImportCancel}>Cancel</button>
        </div>
      </div>
    )
  }

  if (appState.type === 'IMPORTING') {
    return (
      <div>
        <h1>Othello</h1>
        {statusMessageElement}
        <div>
          <h2>Importing Record</h2>
          <p>Please wait while the record is being saved.</p>
        </div>
      </div>
    )
  }

  if (appState.type === 'EXPORTING') {
    const handleExportToClipboard = async () => {
      // R2: Export 先として Clipboard を提供する
      const result = await exportRecordToClipboard(appState.moves)

      if (result.success) {
        // R4: Export 成功時は「起点の状態」に戻る
        if (appState.originState === 'PLAYING') {
          setAppState({
            type: 'PLAYING',
            gameState: appState.gameState,
            moves: appState.moves,
          })
        } else {
          setAppState({
            type: 'RESULT',
            gameState: appState.gameState,
            moves: appState.moves,
          })
        }
      } else {
        // R5: 失敗時はクラッシュせず、ユーザに分かる形でエラーを提示する
        setAppState({
          type: 'ERROR',
          error: result.error,
        })
      }
    }

    const handleExportToFile = async () => {
      // R2: Export 先として File（download）を提供する
      const result = await exportRecordToFile(appState.moves)

      if (result.success) {
        // R4: Export 成功時は「起点の状態」に戻る
        if (appState.originState === 'PLAYING') {
          setAppState({
            type: 'PLAYING',
            gameState: appState.gameState,
            moves: appState.moves,
          })
        } else {
          setAppState({
            type: 'RESULT',
            gameState: appState.gameState,
            moves: appState.moves,
          })
        }
      } else {
        // R5: 失敗時はクラッシュせず、ユーザに分かる形でエラーを提示する
        setAppState({
          type: 'ERROR',
          error: result.error,
        })
      }
    }

    const handleCancel = () => {
      // Cancel: return to origin state
      if (appState.originState === 'PLAYING') {
        setAppState({
          type: 'PLAYING',
          gameState: appState.gameState,
          moves: appState.moves,
        })
      } else {
        setAppState({
          type: 'RESULT',
          gameState: appState.gameState,
          moves: appState.moves,
        })
      }
    }

    return (
      <div>
        <h1>Othello</h1>
        {statusMessageElement}
        <div>
          <h2>Export Record</h2>
          <p>Choose export destination:</p>
          <button onClick={handleExportToClipboard}>Copy to Clipboard</button>
          <button onClick={handleExportToFile}>Download as File</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    )
  }

  return null
}

export default App
