/**
 * Main App Component
 *
 * Handles OP_OPEN_APP: App launch with automatic game restoration or new game creation.
 * R1: STATE_LOADINGで起動時に「復元 or 新規生成」が行われる
 * R3: Save/Load失敗時はクラッシュせず、STATE_ERRORへ遷移できる
 */

import { useEffect, useState } from 'react'
import { initializeGame, placeStone, type AppState } from './app/gameState'
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

    return (
      <div className="app-playing">
        <h1>Othello</h1>
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
    return (
      <div>
        <h1>Othello</h1>
        <p>Game finished.</p>
      </div>
    )
  }

  return null
}

export default App
