/**
 * Record Sidebar Component
 *
 * R4: 棋譜（着手履歴）をサイドバーに表示する
 */

import type { Move } from '../domain/types'

interface RecordSidebarProps {
  readonly moves: readonly Move[]
}

/**
 * RecordSidebar component - displays game record (move history)
 */
export function RecordSidebar({ moves }: RecordSidebarProps): JSX.Element {
  return (
    <div className="record-sidebar" data-testid="record-sidebar">
      <h2>Record</h2>
      {moves.length === 0 ? (
        <p>No moves yet</p>
      ) : (
        <ul>
          {moves.map((move) => (
            <li key={move.moveNumber}>
              {move.moveNumber}. {move.color}{' '}
              {move.isPass ? 'Pass' : `(${move.row}, ${move.col})`}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
