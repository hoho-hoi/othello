## 対象 Issue
Closes #18

## TDD & Lint チェック
- [x] 新しいテストを追加し、そのテストが失敗すること（Red）を `make test` で確認した。
- [x] 実装を追加 / 修正し、同じテストが成功すること（Green）を `make test` で確認した。
- [x] `make lint` を実行し、すべてのエラーを解消した。

## Self-Walkthrough（要件と実装・テストの対応）

| Requirement (ID) | 実装・ロジック / テストとの対応 | 主なファイル / 関数 |
| :--- | :--- | :--- |
| R1: `STATE_PLAYING` 中、手番側に合法手が無い場合に **パスが発生**する | `App.tsx` の `useEffect` で `STATE_PLAYING` 状態時に現在の手番側に合法手が無い場合に自動パスを実行。また、`handleCellClick` で着手後に次の手番側に合法手が無い場合にも自動パスを実行。テスト `src/app/gameState.test.ts` の `passTurn` テストで検証。 | `src/App.tsx` の `useEffect` と `handleCellClick`, `src/app/gameState.ts` の `passTurn` |
| R2: パスは棋譜に 1 手として追加される（`isPass=true`, `row/col=null`, `moveNumber` 連番） | `passTurn` 関数で `isPass=true`, `row=null`, `col=null` のMoveを作成し、`moveNumber` を連番で設定。テスト `src/app/gameState.test.ts` の `passTurn` テストで検証。 | `src/app/gameState.ts` の `passTurn` |
| R3: パス後は手番が切り替わり、UI（Next turn / RecordSidebar）が更新される | `passTurn` 関数で手番を切り替え、`setAppState` で状態を更新することでUIが自動的に更新される。テスト `src/app/gameState.test.ts` の `passTurn` テストで検証。 | `src/app/gameState.ts` の `passTurn`, `src/App.tsx` の状態更新 |
| R4: 両者が連続してパス等の条件で対局終了となる場合、`STATE_RESULT` に遷移する | `passTurn` 関数内で `isGameFinished` を呼び出し、終了判定を行い、`isFinished=true` の場合は `STATE_RESULT` に遷移。テスト `src/app/gameState.test.ts` の `passTurn` テストで検証。 | `src/app/gameState.ts` の `passTurn`, `src/App.tsx` の状態遷移 |
| R5: パスが発生したことをユーザが認識できるUI（status message など）を最低限表示する | `setStatusMessage` でパスが発生したことを表示。テスト `src/App.test.tsx` で既存のテストが通過することを確認。 | `src/App.tsx` の `setStatusMessage` |

## Decision Log（判断メモ・トレードオフ）

- **自動パスの実装場所**: `useEffect` と `handleCellClick` の両方で自動パスを実装。`useEffect` はゲーム開始時や状態変更時に現在の手番側に合法手が無い場合に対応し、`handleCellClick` は着手後に次の手番側に合法手が無い場合に対応。無限ループを避けるため、依存配列を `appState` 全体に設定し、`appState.type === 'PLAYING'` の条件チェックで型安全性を確保。
- **パス処理の関数分離**: `placeStone` と同様に `passTurn` 関数を独立させ、テストしやすくし、再利用性を高めた。
- **無限ループ対策**: `useEffect` の依存配列に `appState` 全体を含めることで、状態変更時に適切に再実行されるが、`appState.type !== 'PLAYING'` の早期リターンで無限ループを防止。

