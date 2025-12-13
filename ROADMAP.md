# Project Roadmap & Status


## Current Status
- **Phase:** Phase 3 (Polish)  <!-- e.g., Phase 1 (Setup), Phase 2 (Implementation) -->
- **Active Issues:**
  - #26 [DOCS] INTERACTION_FLOW の状態遷移を実装に合わせて更新（statusMessage方針）

## Milestones

### v0.1 (MVP)
- [x] Issue #2: [SETUP] Webアプリ基盤（Vite+React+TS）/ Lint・Format・Test・CI 整備
- [x] Issue #4: [TASK] Othello Rules Engine（合法手/反転/パス/終了判定）
- [x] Issue #5: [TASK] OP_OPEN_APP: 現在対局の自動復元/新規生成（DeviceLocal）
- [x] Issue #6: [TASK] OP_PLACE_STONE: 盤面UI + 着手 + 棋譜サイドバー
- [x] Issue #7: [TASK] OP_START_NEW_GAME: 新規ゲーム開始（確認含む）
- [x] Issue #12: [TASK] OP_EXPORT_RECORD: 棋譜をクリップボード/ファイルにエクスポート
- [x] Issue #13: [TASK] OP_IMPORT_RECORD_FROM_CLIPBOARD: 棋譜JSON貼り付け→検証→確認→上書き
- [x] Issue #14: [TASK] OP_IMPORT_RECORD_FROM_FILE: ファイル選択→検証→確認→上書き
- [x] Issue #18: [TASK] パス処理（自動パス/棋譜反映/連続パスで終了）
- [x] Issue #19: [TASK] 結果画面（石数/勝敗表示）とRESULT時の導線整備
- [x] Issue #20: [TASK] 無効手/保存失敗のUX改善（ユーザ向けエラー表示）
- [x] Issue #24: [TASK] アクセシビリティ改善（statusMessage aria-live / 盤面aria-label / キーボード操作）
- [x] Issue #25: [TASK] 合法手ヒント（打てるマスのハイライト/無効セルの誤タップ防止）
<!-- When v0.1 is fully checked, the Manager must run a meta-review (see project-admin.mdc). -->

### v0.2 (Documentation & Refinement)
- [ ] Issue #26: [DOCS] INTERACTION_FLOW の状態遷移を実装に合わせて更新（statusMessage方針）
- [ ] Issue #31: [DOCS] USE_CASES のエラー方針を実装に合わせて更新
- [ ] Issue #32: [DOCS] REQUIREMENT の整合性確認と更新（実装反映）
- [ ] Issue #33: [CHORE] コード品質・テストカバレッジの改善
- [ ] Issue #34: [CHORE] パフォーマンス最適化とモバイルUX強化

### Backlog (Refactoring & Future)
<!-- When v0.1 is fully checked, the Manager must run a meta-review (see project-admin.mdc). -->
- [ ] ...

> NOTE: `ROADMAP.md` is maintained by the Manager (or human owner) as the single source of truth for high-level progress.