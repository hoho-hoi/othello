/**
 * Main App Component
 *
 * Handles OP_OPEN_APP: App launch with automatic game restoration or new game creation.
 * R1: STATE_LOADINGで起動時に「復元 or 新規生成」が行われる
 * R3: Save/Load失敗時はクラッシュせず、STATE_ERRORへ遷移できる
 */

import { useEffect, useState } from 'react'
import {
  initializeGame,
  placeStone,
  startNewGame,
  exportRecordToClipboard,
  exportRecordToFile,
  type AppState,
} from './app/gameState'
import { Board } from './components/Board'
import { RecordSidebar } from './components/RecordSidebar'

function App() {
  const [appState, setAppState] = useState<AppState>({ type: 'LOADING' })

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
          // Continue playing
          setAppState({
            type: 'PLAYING',
            gameState: result.newGameState,
            moves: result.newMoves,
          })
        }
      } else {
        // R3: 不正手の場合、エラーを表示（クラッシュしない）
        // For now, we silently ignore invalid moves
        // In a production app, we might show a toast notification
        console.warn('Invalid move:', result.error)
      }
    }

    const handleNewGameClick = () => {
      // R1: STATE_PLAYING から New Game 操作ができる
      setAppState({
        type: 'NEW_GAME_CONFIRM',
        previousState: 'PLAYING',
        previousGameState: appState.gameState,
        previousMoves: appState.moves,
      })
    }

    const handleExportClick = () => {
      // R1: STATE_PLAYING から Export 操作ができる
      setAppState({
        type: 'EXPORTING',
        originState: 'PLAYING',
        gameState: appState.gameState,
        moves: appState.moves,
      })
    }

    return (
      <div className="app-playing">
        <h1>Othello</h1>
        <div>
          <button onClick={handleNewGameClick}>New Game</button>
          <button onClick={handleExportClick}>Export</button>
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
      // R1: STATE_RESULT から New Game 操作ができる
      setAppState({
        type: 'NEW_GAME_CONFIRM',
        previousState: 'RESULT',
        previousGameState: appState.gameState,
        previousMoves: appState.moves,
      })
    }

    const handleExportClick = () => {
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
        <div>
          <h2>Start New Game</h2>
          <p>Current game will be abandoned. Are you sure?</p>
          <button onClick={handleConfirm}>Confirm</button>
          <button onClick={handleCancel}>Cancel</button>
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
