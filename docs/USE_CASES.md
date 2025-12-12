# USE_CASES.md

<!--
このファイルでは、ユースケース仕様をテキストで記述する。
UMLの Fully Dressed Use Case を簡略化し、Domain / State / Operations と
トレースしやすい構造にしている。

関係:
- States: INTERACTION_FLOW.md の状態IDを参照する。
- Operations: REQUIREMENT.md の Public Operations / APIs の OP_ID を参照する。
- Domain: DOMAIN_ER.md のエンティティ・ルールと整合している必要がある。

ルール:
- 各ユースケースは UC-ID 単位で 1 ブロックとして記述する。
- Precondition / Postcondition はできる限り Domain の用語で書く。
- States / Operations は配列のように [] 内にIDを列挙する。
- ErrorCases は代表的なものだけでよいが、「どう扱うか」も簡潔に書くこと。
-->

## Use Cases

### UC-1

<!--
例:
- UC_ID        : UC_UPDATE_PROFILE
- Title        : プロフィール編集
- Actor        : 一般ユーザ
-->

- UC_ID: UC_PLAY_GAME_WITH_RECORD_SIDEBAR
- Title: 対局を進行し、サイドバーで棋譜（着手履歴）を確認する
- Actor: Single User (same device controls both colors)

- Goal: オセロの正式ルールに従って着手し、現在の対局の棋譜を随時参照できる

- Precondition:
  - アプリが起動している
  - 現在の対局が存在する（自動復元または新規生成済み）
- Postcondition:
  - 着手が行われた場合、棋譜（着手履歴）に反映され、DeviceLocalに保存される
  - 対局が終了条件を満たした場合、結果表示状態へ遷移する

- States: [STATE_LOADING -> STATE_PLAYING -> STATE_RESULT]

- Operations: [OP_OPEN_APP, OP_PLACE_STONE]

- ErrorCases:
  - 不正手（合法手でないマスのタップ）: 着手せず、UIでエラー/無効操作として扱う
  - DeviceLocalへの保存失敗: エラー表示し、継続可否を明示する（少なくともクラッシュしない）

---

### UC-2

- UC_ID: UC_IMPORT_RECORD_OVERWRITE
- Title: 棋譜（独自JSON）をインポートし、現在の対局を上書きする
- Actor: Single User

- Goal: ファイルまたはクリップボードから棋譜を取り込み、確認後に現在対局として復元する

- Precondition:
  - アプリが起動している
- Postcondition:
  - 承認された場合、現在の対局がインポート内容で上書きされ、DeviceLocalに保存される
  - キャンセルされた場合、現在の対局は変更されない

- States: [STATE_PLAYING -> STATE_IMPORT_CONFIRM -> STATE_IMPORTING -> STATE_PLAYING]

- Operations: [OP_IMPORT_RECORD_FROM_FILE, OP_IMPORT_RECORD_FROM_CLIPBOARD]

- ErrorCases:
  - JSONがパースできない/スキーマ不正: 上書きせず、エラー表示して元の対局へ戻る
  - クリップボード権限拒否: エラー表示して元の対局へ戻る
  - DeviceLocalへの保存失敗: エラー表示し、復元結果が永続化されない可能性を明示する

---

### UC-3

- UC_ID: UC_EXPORT_RECORD
- Title: 現在の対局の棋譜（独自JSON）をエクスポートする
- Actor: Single User

- Goal: 現在の対局の棋譜を、ファイルまたはクリップボードへ出力できる

- Precondition:
  - アプリが起動している
  - 現在の対局が存在する
- Postcondition:
  - エクスポートされたJSONがユーザの操作した媒体（ファイル or クリップボード）に出力される

- States: [STATE_PLAYING -> STATE_EXPORTING -> STATE_PLAYING]

- Operations: [OP_EXPORT_RECORD_TO_FILE, OP_EXPORT_RECORD_TO_CLIPBOARD]

- ErrorCases:
  - クリップボード権限拒否: エラー表示し、ファイル出力など代替手段を案内する
  - ダウンロード失敗: エラー表示し、再試行可能にする

---

### UC-4

- UC_ID: UC_START_NEW_GAME
- Title: 現在の対局を中断して新しいゲームを開始する
- Actor: Single User

- Goal: 確認後に現在の対局を破棄し、新規ゲームを開始できる

- Precondition:
  - アプリが起動している
  - 現在の対局が存在する
- Postcondition:
  - 承認された場合、新規ゲームが生成され現在の対局として保存される
  - キャンセルされた場合、現在の対局は変更されない

- States: [STATE_PLAYING -> STATE_NEW_GAME_CONFIRM -> STATE_PLAYING]

- Operations: [OP_START_NEW_GAME]

- ErrorCases:
  - DeviceLocalへの保存失敗: エラー表示し、復元できない可能性を明示する

<!--
Record Format (Draft, custom JSON):
- This is intentionally minimal and versioned for forward compatibility.
- Exact schema will be finalized in implementation phase.
-->

Record Format (Fixed, custom JSON / moves-only):
- Purpose: export/import/restore "current game" without managing a library.
- Encoding: UTF-8 JSON text.
- Versioning: `formatVersion` MUST be present for forward compatibility.
- Board coordinates: `row`/`col` are 0-based (0..7).
- `isPass=true` represents a pass move. When `isPass=true`, `row` and `col` MUST be null.

Schema:
```json
{
  "formatVersion": 1,
  "moves": [
    {
      "moveNumber": 1,
      "color": "BLACK",
      "row": 2,
      "col": 3,
      "isPass": false
    },
    {
      "moveNumber": 2,
      "color": "WHITE",
      "row": null,
      "col": null,
      "isPass": true
    }
  ]
}
```

Validation Rules:
- `formatVersion`:
  - required, integer, currently only `1` is accepted.
- `moves`:
  - required, array (can be empty for a new game).
  - must be sorted by `moveNumber` ascending.
  - `moveNumber` must be 1..N with no gaps.
- `color`:
  - required, enum: `BLACK` | `WHITE`.
- `row`/`col`:
  - when `isPass=false`: both required and integer in 0..7.
  - when `isPass=true`: both must be null.
- Import behavior:
  - After validation, overwrite current game and recompute board state from moves + rules.