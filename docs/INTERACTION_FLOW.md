# INTERACTION_FLOW.md

<!--
このファイルでは、ユーザ視点またはシステム視点の「インタラクション状態遷移」を
mermaid の flowchart で記述する (UML 状態マシン図の簡易版)。

目的:
- システムがどのような状態(State)を持ち、どのイベントで状態が変わるかを俯瞰する。
- USE_CASES.md の States 項目から参照される「状態ID」の定義場所とする。

ルール:
- ノードIDは状態IDとして一意に命名する (例: STATE_TITLE, STATE_IN_GAME, STATE_ERROR)。
- 矢印には「イベント名」をできるだけラベルとして明記する。
  - 例: |start_button_clicked|, |login_success|, |timeout|, |sensor_triggered| など。
- ガード条件や細かい例外条件は、必要に応じて [condition] のような簡潔な表記か、
  USE_CASES.md 側の Precondition / ErrorCases に寄せる。
-->

```mermaid
flowchart TD
  %% Othello: offline, single device, current game only.

  STATE_LOADING["STATE_LOADING<br/>Load current game from DeviceLocal or create new game"] -->|app_opened| STATE_PLAYING

  STATE_PLAYING["STATE_PLAYING<br/>Board + sidebar record"] -->|cell_tapped_valid| STATE_PLAYING
  STATE_PLAYING -->|cell_tapped_invalid| STATE_PLAYING
  STATE_PLAYING -->|no_legal_moves_for_current_turn| STATE_PLAYING
  STATE_PLAYING -->|game_finished_by_rules| STATE_RESULT

  STATE_PLAYING -->|import_clicked| STATE_IMPORT_CONFIRM
  STATE_IMPORT_CONFIRM["STATE_IMPORT_CONFIRM<br/>Confirm overwrite current game"] -->|confirm| STATE_IMPORTING
  STATE_IMPORT_CONFIRM -->|cancel| STATE_PLAYING

  STATE_IMPORTING["STATE_IMPORTING<br/>Validate JSON + overwrite current game"] -->|import_succeeded| STATE_PLAYING
  STATE_IMPORTING -->|import_failed| STATE_ERROR

  STATE_PLAYING -->|export_clicked| STATE_EXPORTING
  STATE_RESULT -->|export_clicked| STATE_EXPORTING
  STATE_EXPORTING["STATE_EXPORTING<br/>Generate JSON + copy/download"] -->|export_succeeded [origin=STATE_PLAYING]| STATE_PLAYING
  STATE_EXPORTING -->|export_succeeded [origin=STATE_RESULT]| STATE_RESULT
  STATE_EXPORTING -->|export_failed| STATE_ERROR

  STATE_PLAYING -->|new_game_clicked| STATE_NEW_GAME_CONFIRM
  STATE_RESULT -->|new_game_clicked| STATE_NEW_GAME_CONFIRM
  STATE_NEW_GAME_CONFIRM["STATE_NEW_GAME_CONFIRM<br/>Confirm abandon current game"] -->|confirm| STATE_PLAYING
  STATE_NEW_GAME_CONFIRM -->|cancel| STATE_PLAYING

  STATE_ERROR["STATE_ERROR<br/>Show error message"] -->|close| STATE_PLAYING
```