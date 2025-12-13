## 対象 Issue
Closes #25

## TDD & Lint チェック
- [x] 新しいテストを追加し、そのテストが失敗すること（Red）を `make test` で確認した。
- [x] 実装を追加 / 修正し、同じテストが成功すること（Green）を `make test` で確認した。
- [x] `make lint` を実行し、すべてのエラーを解消した。

## Self-Walkthrough（要件と実装・テストの対応）

| Requirement (ID) | 実装・ロジック / テストとの対応 | 主なファイル / 関数 |
| :--- | :--- | :--- |
| R1: `STATE_PLAYING` で手番側の合法手一覧を算出し、盤面上で視覚的にハイライト表示する | `App.tsx` の `useMemo` で `STATE_PLAYING` 状態時に現在の手番側の合法手を計算し、`Board` コンポーネントに `legalMoves` プロップとして渡す。`Board` コンポーネントで合法手のセルに `board-cell-legal` クラスを適用してハイライト表示。テスト `src/components/Board.test.tsx` の `R1: Legal moves are highlighted visually` で検証。 | `src/App.tsx` の `useMemo`, `src/components/Board.tsx` の `Board` コンポーネント, `src/index.css` の `.board-cell-legal` スタイル |
| R2: 合法手でないセルは `disabled` にする（またはクリックを無視する）ことで誤タップを減らす | `Board` コンポーネントで合法手でないセルを `disabled` 属性で無効化し、`onClick` ハンドラ内でも `isDisabled` チェックでクリックを無視。テスト `src/components/Board.test.tsx` の `R2: Non-legal move cells are disabled` で検証。 | `src/components/Board.tsx` の `Board` コンポーネント |
| R3: ハイライト/disabled は手番が切り替わったら即時に更新される（着手/パス後） | `App.tsx` の `useMemo` の依存配列に `nextTurnColor` を含めることで、手番が切り替わるたびに合法手を再計算し、`Board` コンポーネントに新しい `legalMoves` が渡される。テスト `src/components/Board.test.tsx` の `R3: Legal moves update immediately when turn changes` で検証。 | `src/App.tsx` の `useMemo` の依存配列 |
| R4: 追加UIによりパフォーマンスが著しく悪化しない（8x8なのでO(64*8)程度は許容。重複計算は避ける） | `useMemo` を使用して合法手の計算をメモ化し、`board`, `nextTurnColor`, `isFinished` が変更された場合のみ再計算。`Board` コンポーネント内で `Set` を使用して合法手の検索をO(1)に最適化。テストではパフォーマンステストは明示的に追加していないが、`useMemo` の依存配列で重複計算を防止。 | `src/App.tsx` の `useMemo`, `src/components/Board.tsx` の `legalMoveSet` |

## Decision Log（判断メモ・トレードオフ）

- **合法手計算の最適化**: `useMemo` を使用して合法手の計算をメモ化し、`board`, `nextTurnColor`, `isFinished` が変更された場合のみ再計算することで、パフォーマンスを最適化。依存配列の複雑な条件式を避けるため、`isPlaying`, `gameBoard`, `nextTurnColor`, `isFinished` を事前に計算してから `useMemo` に渡すことで、ESLint の `react-hooks/exhaustive-deps` ルールに準拠。
- **合法手の検索最適化**: `Board` コンポーネント内で `Set` を使用して合法手の検索をO(1)に最適化し、各セルのレンダリング時に合法手かどうかを高速に判定。
- **既存テストの修正**: 合法手でないセルが `disabled` になったため、既存の `App.test.tsx` のテストで `cells[0]` をクリックしていた箇所を、合法手のセルをクリックするように修正。これにより、テストが実際のユーザー操作をより正確に反映するようになった。

