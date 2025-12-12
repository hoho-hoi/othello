# DOMAIN_ER.md

<!--
このファイルでは、ドメインエンティティとその関係を mermaid の erDiagram 形式で記述する。

目的:
- 「このシステムの世界には何が存在し、どう関係しているか」をユーザーと合意する。
- クラス図やテーブル定義など、後続の詳細設計のベースとする。

ルール:
- 永続/非永続に関わらず「ドメインとして意味のあるエンティティ」を列挙する。
- 各エンティティの属性コメントに storage_scope を付与する (任意だが推奨):

  storage_scope 候補:
    - Ephemeral        : 1操作 / 1フレーム内だけで完結
    - Session          : セッション(ログイン中, ゲーム1プレイ中 等)の間維持
    - DeviceLocal      : デバイスローカルに永続化
    - UserPersistent   : ユーザアカウントに紐づき複数デバイス間で共有
    - GlobalPersistent : システム全体で共有される永続データ

- 関係(1:1, 1:N, N:M等)には簡潔な説明ラベルを書くとよい。
-->

```mermaid
erDiagram
  %% Domain: "Current game only" Othello record management.
  %%
  %% Storage policy:
  %% - All persisted entities are DeviceLocal (offline, no account).

  GAME ||--o{ MOVE : "game has moves (1:N)"

  GAME {
    string id PK "storage_scope: DeviceLocal / UUID"
    string status "storage_scope: DeviceLocal / IN_PROGRESS|FINISHED"
    string nextTurnColor "storage_scope: DeviceLocal / BLACK|WHITE"
    string startedAt "storage_scope: DeviceLocal / ISO-8601"
    string updatedAt "storage_scope: DeviceLocal / ISO-8601"
  }

  MOVE {
    string id PK "storage_scope: DeviceLocal / UUID"
    string gameId FK "storage_scope: DeviceLocal"
    int moveNumber "storage_scope: DeviceLocal / 1.."
    int row "storage_scope: DeviceLocal / 0..7"
    int col "storage_scope: DeviceLocal / 0..7"
    string color "storage_scope: DeviceLocal / BLACK|WHITE"
    boolean isPass "storage_scope: DeviceLocal"
    string createdAt "storage_scope: DeviceLocal / ISO-8601"
  }
```

Notes:
- This ER focuses on "record" (moves) needed for import/export and restore.
- Board state and legal moves are derivable from MOVE sequence + Othello rules (Ephemeral).