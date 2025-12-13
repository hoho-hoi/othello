# Project Requirements

<!--
このファイルはプロジェクトの要件定義のメインエントリです。
Goal / Domain / Interaction / Architecture の4本柱をまとめて記述します。

他の設計ファイルとの関係:
- ドメイン構造: DOMAIN_ER.md
- インタラクション状態遷移: INTERACTION_FLOW.md
- コンポーネント構成: ARCHITECTURE_DIAGRAM.md
- ユースケース詳細: USE_CASES.md

運用ルール:
- 「TBD」や空欄のままにせず、すべての項目に具体的な内容を埋めてから次フェーズに進むこと。
- 説明文は必要に応じて削除してよいが、見出し・項目名は原則残すこと。
-->

---

## 1. Overview (Goal / Scope)

### 1.1 Product Summary

<!-- プロジェクトの概要を短く定義する。 -->

- Goal: オフラインで動作する、対局中の棋譜を中心に扱えるオセロ（リバーシ）Webアプリを提供する。  
- Target Users: 1人で同一端末上で黒白の両者を操作し、対局の進行と棋譜の入出力（インポート/エクスポート）を行いたいユーザ。  
- One-line Description: ブラウザで動く、モバイル対応・オフライン動作の「現在の対局」棋譜管理オセロアプリ。  

### 1.2 Scope

<!--
スコープ内とスコープ外を明確に切り分ける。
「やらないこと」を書くことでスコープの暴走を防ぐ。
-->

- In Scope:  
  - Webブラウザ上で動作し、モバイル端末でも操作できるUI  
  - 起動時に「前回の対局が存在すれば自動復元」、存在しなければ「新規ゲームを自動生成」  
  - オセロの正式ルールに準拠した対局進行（合法手判定、石の反転、パス、終了判定）  
  - 対局中の棋譜（着手履歴）をサイドバーに表示  
  - 任意タイミングでの棋譜インポート/エクスポート（独自JSON形式）  
    - インポートは確認ダイアログを表示し、承認後に「現在の対局」を上書き  
    - 入出力手段は「ファイル（ダウンロード/アップロード）」と「クリップボード（コピー/貼り付け）」の両方  
  - 途中で対局をやめて新しいゲームを開始できる（確認ダイアログを推奨）  
- Out of Scope:  
  - オンライン対戦、マルチデバイス同期、ユーザアカウント/ログイン  
  - CPU対戦、解析機能（形勢判断、候補手ランキング等）  
  - 複数棋譜のライブラリ管理（保存済み一覧、タグ、検索、フォルダ等）※「現在の対局」以外はアプリ内で保持しない  

### 1.3 Success Criteria & Constraints

<!--
成功判定の基準と、守るべき制約条件を記述する。
例: 指標(DAU, 継続率, 応答時間)や締切、対応プラットフォームなど。
-->

- Success Criteria:  
  - 対局が正式ルールに準拠して進行し、終了判定（両者が連続してパス、または盤面が埋まる等）が正しく行える  
  - 対局中に棋譜（着手履歴）が常に参照可能である  
  - 棋譜を独自JSONでインポート/エクスポートでき、インポートは確認後に現在の対局へ確実に復元できる  
  - ブラウザの再読み込み/再起動後に「前回の対局」が自動復元される（データが存在する場合）  
  - モバイル端末で主要操作（着手、棋譜参照、入出力）が実用的に行える  
- Constraints:  
  - オンライン機能は持たない（サーバ不要、ネットワーク前提なし）  
  - データは端末内（DeviceLocal）に保存し、外部へはユーザ操作によるエクスポートのみ  
  - インポート/クリップボード入力は不正データを想定し、クラッシュせず安全にエラー処理する  

---

## 2. Domain Model (Domain)

### 2.1 Domain Entities

<!--
ドメインエンティティとその関係は DOMAIN_ER.md に mermaid の erDiagram 形式で記述する。

DOMAIN_ER.md では、各エンティティに storage_scope をコメントで付与する運用を想定する:
- Ephemeral          : 1操作 / 1フレーム内だけで完結する一時データ
- Session            : セッション(ログイン中, ゲーム1プレイ中 等)の間維持されるデータ
- DeviceLocal        : デバイス上に永続化され、主にそのデバイスだけで利用されるデータ
- UserPersistent     : ユーザアカウントに紐づき、複数デバイス間で共有されるデータ
- GlobalPersistent   : システム全体で共有される永続データ
-->

- Domain ER Diagram: see `DOMAIN_ER.md`  

### 2.2 Domain Notes (Optional)

<!--
ER 図だけでは表現しづらいルールや補足がある場合に記述する。
何もなければ空でもよい。
-->

- Notes:  
  - 本アプリの棋譜は「現在の対局の着手履歴」を中心に扱う。アプリ内で複数棋譜の一覧管理は行わない。  
  - ルールは「オセロの正式ルール」に準拠する。具体例として、合法手がない手番はパスとなり、両者とも合法手がなくなった時点で対局終了とする。  

---

## 3. Interaction / UI / Operations

### 3.1 Interaction State Flow

<!--
システム全体のインタラクション状態遷移は INTERACTION_FLOW.md に mermaid flowchart で記述する。

ルール:
- ノードIDは状態(State)IDとして扱う（例: STATE_TITLE, STATE_IN_GAME 等）。
- 矢印には可能な限り「イベント名」をラベルとして付ける。
  例: |start_button_clicked|, |timer_expired|, |message_received| など。
-->

- Interaction State Diagram: see `INTERACTION_FLOW.md`  

### 3.2 Error Handling Policy (statusMessage / STATE_ERROR)

<!--
エラー処理の方針を明確にする。
statusMessage と STATE_ERROR の使い分けを定義する。
-->

- **statusMessage**:  
  - 各状態で表示可能な一時的なメッセージ（エラー/情報）を表す。  
  - エラー発生時、STATE_ERROR への遷移は行わず、statusMessage でエラーを表示し、元の状態を維持する。  
  - 例: 不正手の着手試行、インポートバリデーション失敗、ストレージ保存失敗など。  
  - アクセシビリティ対応: `aria-live="polite"` でスクリーンリーダーに通知される。  
- **STATE_ERROR**:  
  - アプリ起動時の初期化失敗など、回復不可能なエラーのみに限定される。  
  - 例: DeviceLocal からのゲーム復元失敗、新規ゲーム生成失敗など。  
  - ユーザは「再試行」ボタンで STATE_LOADING に戻り、初期化を再実行できる。

### 3.3 Public Operations / APIs

<!--
クライアント(人間・他システム・外部アプリ等)から見える操作/インターフェースを列挙する。
Web の場合は HTTP パス、CLI の場合はコマンド、ゲーム/組み込みの場合は公開APIやメッセージ名など。

列挙した OP_ID は USE_CASES.md の Operations から参照される前提。
-->

| OP_ID | Interface / Path / Command | Summary |
|-------|----------------------------|---------|
| OP_OPEN_APP | UI / App Launch | アプリを開く（前回対局の自動復元、無ければ新規生成） |
| OP_PLACE_STONE | UI / Tap Board Cell | 盤面のマスをタップして着手する（合法手のみ） |
| OP_START_NEW_GAME | UI / New Game Button | 現在の対局を中断し、新規ゲームを開始する（確認あり） |
| OP_IMPORT_RECORD_FROM_FILE | UI / Import File | ファイルから棋譜（独自JSON）を読み込み、確認後に現在対局を上書きする |
| OP_IMPORT_RECORD_FROM_CLIPBOARD | UI / Paste JSON | クリップボードから棋譜（独自JSON）を貼り付け、確認後に現在対局を上書きする |
| OP_EXPORT_RECORD_TO_FILE | UI / Export File | 現在対局の棋譜（独自JSON）をファイルとして書き出す |
| OP_EXPORT_RECORD_TO_CLIPBOARD | UI / Copy JSON | 現在対局の棋譜（独自JSON）をクリップボードへコピーする |

### 3.4 Use Cases

<!--
ユースケースの詳細仕様は USE_CASES.md に記述する。

ここでは「ユースケースの一覧」や「重要なユースケースIDだけ」を簡潔に列挙しておくとよい。
-->

- Key Use Case IDs: UC_PLAY_GAME_WITH_RECORD_SIDEBAR, UC_IMPORT_RECORD_OVERWRITE, UC_EXPORT_RECORD, UC_START_NEW_GAME  

---

## 4. Architecture

### 4.1 Components & Data Flow

<!--
システムを構成する主要なコンポーネント(箱)とデータフローは ARCHITECTURE_DIAGRAM.md に mermaid flowchart で記述する。

ルール:
- ノードはコンポーネント(例: Frontend, API Server, GameServer, DeviceController 等)。
- 外部サービス・外部デバイスはノード名に「(外部)」を付ける。
- 矢印には可能な限り「代表的な操作/プロトコル名」をラベルとして付ける。
  例: |HTTP /api/login|, |gRPC Match|, |I2C Read| など。
-->

- Architecture Diagram: see `ARCHITECTURE_DIAGRAM.md`  

### 4.2 Storage Scope Policy

<!--
DOMAIN_ER.md で付与した storage_scope を、具体的なストレージ/媒体にマッピングする方針を記述する。
例: UserPersistent -> クラウドDB, Session -> サーバメモリ+キャッシュ 等。
-->

- Ephemeral: 合法手候補、反転対象の算出結果、UI一時状態（例: モーダルの開閉）  
- Session: なし（ログイン等のセッション概念を持たない）  
- DeviceLocal: 現在の対局（盤面/手番/棋譜/終了状態）を端末内ストレージに永続化し、自動復元に利用する  
- UserPersistent: 該当なし（ユーザアカウントを持たない）  
- GlobalPersistent: 該当なし（サーバ/共有DBを持たない）  

### 4.3 Non-Functional Requirements (Architecture-related)

<!--
アーキテクチャ設計に強く影響する非機能要件のみを記述する。
詳細なSLAや細かい数値要件がある場合は別ドキュメントに分けてもよい。
-->

- Performance / Throughput:  
  - モバイル端末での操作に支障がない応答性（着手/棋譜表示/入出力のUIが体感的に遅延しない）  
- Security / Authentication / Authorization:  
  - 認証/認可は不要（オフライン・単一ユーザ想定）  
  - インポートデータ（ファイル/クリップボード）は信頼しない：スキーマ検証を行い、不正データはエラー表示して破棄  
  - 表示はXSSを避ける（ユーザ提供テキストをHTMLとして解釈しない）  
  - インポート入力の最大サイズを設ける（例: 1 MiB）  
  - 段階的バリデーションを行う（JSON parse -> schema validate -> rule consistency check）  
  - 失敗時はトランザクショナルに扱い、バリデーション失敗では「現在の対局」を破壊しない（上書きは成功時のみ）  
- Availability / Reliability / Backup:  
  - 端末内ストレージに保存し、再読み込み/再起動後に復元できる（保存失敗時は明示エラー）  
  - バックアップはユーザによるエクスポートに委ねる  
- Observability (Logging / Metrics / Tracing / Alerting):  
  - 開発時のローカルログ程度（個人端末内で完結、外部送信しない）  
- Other NFRs:  
  - オフライン前提のため、外部ネットワーク接続を必須とする設計は行わない  