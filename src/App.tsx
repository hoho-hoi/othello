/**
 * Main App Component
 *
 * Handles OP_OPEN_APP: App launch with automatic game restoration or new game creation.
 * R1: STATE_LOADINGで起動時に「復元 or 新規生成」が行われる
 * R3: Save/Load失敗時はクラッシュせず、STATE_ERRORへ遷移できる
 */

import { useEffect, useState } from 'react'
import { initializeGame, type AppState } from './app/gameState'

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
    return (
      <div>
        <h1>Othello</h1>
        <p>Game loaded. Ready to play.</p>
        <p>Next turn: {appState.gameState.nextTurnColor}</p>
        <p>Moves: {appState.moves.length}</p>
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
