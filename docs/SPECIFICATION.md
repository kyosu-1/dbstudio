# DB Studio 仕様書

PostgreSQL 向けデスクトップデータベース GUI ツール。Tauri v2 + React で構築。

---

## 1. 概要

DB Studio は PostgreSQL データベースの管理・操作を行うデスクトップアプリケーション。以下の主要機能を提供する。

- 複数の PostgreSQL 接続の管理（保存・切り替え）
- スキーマ・テーブル・カラム情報のツリー表示による探索
- ページネーション・ソート対応のデータグリッド
- SQL エディタによるクエリ実行・EXPLAIN ANALYZE
- SSH トンネル経由でのリモート接続

---

## 2. アーキテクチャ

### 2.1 全体構成

```
┌──────────────────────────────────────────────┐
│                  Tauri Window                 │
│  ┌────────────┐  ┌────────────────────────┐  │
│  │  Sidebar    │  │     Main Panel         │  │
│  │            │  │  ┌──────────────────┐  │  │
│  │ Connection │  │  │  Tab: Table/SQL  │  │  │
│  │ List       │  │  │                  │  │  │
│  │            │  │  │  DataGrid /      │  │  │
│  │ Table Tree │  │  │  SQL Editor      │  │  │
│  │            │  │  └──────────────────┘  │  │
│  └────────────┘  └────────────────────────┘  │
│  ┌──────────────────────────────────────────┐│
│  │            Status Bar                     ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
         │ Tauri IPC (invoke)
         ▼
┌──────────────────────────────────────────────┐
│              Rust Backend                     │
│  Commands ─► DB Pool ─► PostgreSQL            │
│                    └─► SSH Tunnel ─► Remote DB│
└──────────────────────────────────────────────┘
```

### 2.2 通信方式

フロントエンド（React）とバックエンド（Rust）は Tauri IPC を介して通信する。フロントエンドは `src/lib/api.ts` のラッパー関数を通じて Tauri コマンドを呼び出す。

### 2.3 状態管理

- **フロントエンド**: Zustand ストア（`src/store/`）
  - `savedConnections`: 保存済み接続情報のリスト
  - `activeConnectionId`: 現在選択中の接続 ID
  - `connectionStatus`: 接続ごとの接続状態（connected/disconnected）
  - `tabs`: 開いているタブ一覧（テーブル閲覧タブ / SQL クエリタブ）
  - `activeTabId`: 現在表示中のタブ ID

- **バックエンド**: `AppState`（`src-tauri/src/state/connections.rs`）
  - `Mutex<HashMap<String, PgPool>>`: 接続 ID → コネクションプール
  - `Mutex<HashMap<String, SshTunnel>>`: 接続 ID → SSH トンネル

---

## 3. 機能仕様

### 3.1 接続管理

#### 接続設定項目

| 項目 | 型 | 必須 | 説明 |
|------|-----|------|------|
| name | String | Yes | 接続の表示名 |
| host | String | Yes | PostgreSQL ホスト |
| port | u16 | Yes | ポート番号（デフォルト: 5432） |
| database | String | Yes | データベース名 |
| username | String | Yes | ユーザー名 |
| password | String | No | パスワード |
| ssl_mode | String | No | SSL モード（disable / prefer / require） |

#### 操作

- **保存**: 接続情報を `~/.config/dbstudio/connections.json` に JSON として永続化。ID は UUID v4 で自動生成。
- **編集**: 既存接続の設定を変更。
- **削除**: 接続情報を削除。アクティブな場合はプール・トンネルも閉じる。
- **テスト接続**: 一時的なプールを作成し `SELECT version()` を実行して接続を検証。
- **接続**: コネクションプールを確立（SSH 設定がある場合はトンネルも開始）。
- **切断**: プールを閉じ、SSH トンネルがあればシャットダウン。

#### コネクションプール設定

- 最大接続数: 5
- 接続タイムアウト: 5 秒

### 3.2 SSH トンネル

SSH トンネルを経由してリモートの PostgreSQL に接続できる。

#### SSH 設定項目

| 項目 | 型 | 必須 | 説明 |
|------|-----|------|------|
| enabled | bool | Yes | SSH トンネルの有効/無効 |
| host | String | Yes | SSH サーバーのホスト |
| port | u16 | Yes | SSH ポート（デフォルト: 22） |
| username | String | Yes | SSH ユーザー名 |
| auth | SshAuth | Yes | 認証方式 |

#### 認証方式（SshAuth）

- **Password**: パスワード認証
- **PrivateKey**: 秘密鍵ファイルパス + オプションのパスフレーズ

#### トンネル動作

1. SSH セッションを確立（bastion ホストへ接続）
2. ローカルにエフェメラルポートで TCP リスナーを起動（`127.0.0.1:0`）
3. `channel_open_direct_tcpip` でポートフォワーディング
4. ローカル TCP ↔ SSH チャネル ↔ リモート PostgreSQL を双方向リレー
5. tokio の非同期 I/O + キャンセルトークンによるグレースフルシャットダウン

### 3.3 スキーマ探索

サイドバーのツリービューでデータベース構造を階層的に表示する。

#### ツリー構造

```
Schema (例: public)
  └─ Table (名前, タイプ, 推定行数)
       └─ Column (名前, データ型, NULL許可, PK)
```

#### 表示情報

- **スキーマ一覧**: `information_schema.schemata` から取得。`pg_*` と `information_schema` は除外。
- **テーブル一覧**: テーブル名、タイプ（TABLE / VIEW）、推定行数（`pg_class.reltuples`）
- **カラム詳細**: カラム名、データ型、NULL 許可、デフォルト値、主キーかどうか、序数位置

### 3.4 データブラウジング

テーブルのデータをページネーション付きのグリッドで表示する。

#### 仕様

- **ページサイズ**: デフォルト 100 行
- **ソート**: カラムヘッダークリックで ASC/DESC 切り替え（安全にクォートされた識別子を使用）
- **ページネーション**: LIMIT/OFFSET による実装
- **セル表示**:
  - NULL 値: 専用表示
  - Boolean: 色分け表示
  - バイナリデータ: インジケーター表示
- **行番号**: 各行に連番を表示
- **総行数**: 画面下部に表示

#### レスポンス（FetchResult）

```typescript
{
  columns: ColumnMeta[]   // カラムメタデータ
  rows: Record<string, any>[]  // 行データ（JSON）
  total_count: number     // 総行数
  page: number            // 現在のページ
  page_size: number       // ページサイズ
}
```

### 3.5 SQL エディタ

CodeMirror ベースの SQL エディタで、自由なクエリ実行を行える。

#### 機能

- PostgreSQL 方言のシンタックスハイライト
- **Cmd+Enter** でクエリ実行
- **Run ボタン**: クエリ実行
- **Explain ボタン**: `EXPLAIN ANALYZE` でクエリプラン取得
- 実行時間の表示
- エラーメッセージ表示（構文エラーの文字位置表示を含む）
- 複数のクエリタブを同時に開ける

#### クエリ種別判定

以下のキーワードで始まるクエリは SELECT 型として扱う:
- `SELECT`, `WITH`, `EXPLAIN`, `SHOW`, `TABLE`, `VALUES`

#### レスポンス（QueryResult）

- **Select 型**: columns, rows, row_count, execution_time_ms
- **Execute 型**: rows_affected, execution_time_ms
- **Error 型**: message, position（構文エラー位置）

### 3.6 タブ UI

メインパネルはタブ方式で、複数のテーブル閲覧タブや SQL クエリタブを同時に開ける。

- テーブルツリーからテーブルをクリック → テーブル閲覧タブが開く
- SQL クエリタブは手動で追加
- 各タブは独立して操作可能

---

## 4. バックエンド API（Tauri コマンド）

### 4.1 接続管理

| コマンド | 引数 | 戻り値 | 説明 |
|----------|------|--------|------|
| `list_saved_connections` | - | `SavedConnection[]` | 保存済み接続一覧を取得 |
| `save_connection` | `SavedConnection` | - | 接続情報を保存（新規/更新） |
| `delete_connection` | `id: String` | - | 接続を削除 |
| `test_connection` | `SavedConnection` | `String` | 接続テスト（バージョン文字列を返す） |
| `connect` | `id: String` | - | 接続を確立 |
| `disconnect` | `id: String` | - | 接続を切断 |

### 4.2 スキーマ

| コマンド | 引数 | 戻り値 | 説明 |
|----------|------|--------|------|
| `list_schemas` | `connection_id` | `String[]` | スキーマ一覧 |
| `list_tables` | `connection_id, schema` | `TableInfo[]` | テーブル一覧 |
| `describe_table` | `connection_id, schema, table` | `ColumnInfo[]` | カラム詳細 |

### 4.3 データ取得

| コマンド | 引数 | 戻り値 | 説明 |
|----------|------|--------|------|
| `fetch_rows` | `connection_id, schema, table, page, page_size, sort_column?, sort_direction?` | `FetchResult` | テーブルデータ取得 |

### 4.4 クエリ実行

| コマンド | 引数 | 戻り値 | 説明 |
|----------|------|--------|------|
| `execute_sql` | `connection_id, sql` | `QueryResult` | SQL 実行 |
| `explain_sql` | `connection_id, sql` | `String` | EXPLAIN ANALYZE 実行 |

---

## 5. データ型マッピング

バックエンドで PostgreSQL の型を JSON に変換する際の対応表:

| PostgreSQL 型 | Rust / JSON 変換 |
|---------------|-----------------|
| BOOLEAN | bool → JSON bool |
| INT2 (SMALLINT) | i16 → JSON number |
| INT4 (INTEGER) | i32 → JSON number |
| INT8 (BIGINT) | i64 → JSON number |
| FLOAT4 (REAL) | f32 → JSON number |
| FLOAT8 (DOUBLE) | f64 → JSON number |
| JSON / JSONB | serde_json::Value → JSON object |
| TIMESTAMP | NaiveDateTime → JSON string |
| TIMESTAMPTZ | DateTime<Utc> → JSON string |
| DATE | NaiveDate → JSON string |
| TIME | NaiveTime → JSON string |
| UUID | Uuid → JSON string |
| BYTEA | bytes → JSON string (表示用) |
| その他 | String → JSON string（フォールバック） |

---

## 6. 技術スタック

### フロントエンド

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| React | 19.x | UI フレームワーク |
| TypeScript | 6.x | 型安全な開発 |
| Tailwind CSS | 4.x | スタイリング（ダークテーマ） |
| Zustand | 5.x | 状態管理 |
| CodeMirror 6 (@uiw/react-codemirror) | - | SQL エディタ |
| Lucide React | 1.x | アイコン |
| TanStack Virtual | - | 仮想スクロール |
| Vite | 8.x | ビルドツール |

### バックエンド

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| Tauri | 2.x | デスクトップフレームワーク |
| sqlx | 0.8 | PostgreSQL ドライバー（非同期） |
| russh | 0.46 | SSH クライアント |
| tokio | - | 非同期ランタイム |
| serde / serde_json | - | シリアライズ |
| uuid | - | UUID 生成 |
| chrono | - | 日時型 |
| dirs | - | クロスプラットフォームのパス解決 |

---

## 7. ウィンドウ設定

| 項目 | 値 |
|------|-----|
| 初期サイズ | 1200 x 800 px |
| リサイズ | 可能 |
| ターゲット OS | macOS, Linux, Windows |

---

## 8. 設定ファイル

### 接続情報の保存先

```
~/.config/dbstudio/connections.json
```

各接続は以下の JSON 構造で保存される:

```json
{
  "id": "uuid-v4",
  "name": "My Database",
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "username": "user",
  "password": "pass",
  "ssl_mode": "prefer",
  "ssh_config": {
    "enabled": true,
    "host": "bastion.example.com",
    "port": 22,
    "username": "ssh_user",
    "auth": {
      "type": "PrivateKey",
      "path": "/home/user/.ssh/id_rsa",
      "passphrase": null
    }
  }
}
```

---

## 9. 開発環境

### 前提条件

- Node.js >= 18
- pnpm
- Rust (cargo)
- [Tauri の前提条件](https://v2.tauri.app/start/prerequisites/)

### コマンド

```bash
pnpm install          # 依存関係インストール
pnpm tauri dev        # 開発サーバー起動（http://localhost:5173）
pnpm tauri build      # プロダクションビルド
```

### テスト用データベース

`docker-compose.yml` でローカル PostgreSQL を起動できる:

```bash
docker compose up -d
```

- ホスト: localhost:5432
- ユーザー: testuser
- パスワード: testpass
- データベース: testdb

---

## 10. プロジェクト構成

```
dbstudio/
├── src/                            # React フロントエンド
│   ├── components/
│   │   ├── connection/             # 接続ダイアログ・フォーム・リスト
│   │   ├── explorer/               # テーブルツリー
│   │   ├── datagrid/               # データグリッド・テーブルブラウザ
│   │   ├── editor/                 # SQL エディタ
│   │   └── layout/                 # サイドバー・メインパネル・ステータスバー
│   ├── lib/
│   │   ├── api.ts                  # Tauri IPC ラッパー関数
│   │   └── types.ts                # TypeScript 型定義
│   ├── store/                      # Zustand ストア
│   ├── styles/                     # グローバル CSS（テーマ変数）
│   ├── App.tsx                     # ルートコンポーネント
│   └── main.tsx                    # エントリーポイント
├── src-tauri/                      # Rust バックエンド
│   ├── src/
│   │   ├── commands/
│   │   │   ├── connection.rs       # 接続管理コマンド
│   │   │   ├── schema.rs           # スキーマ探索コマンド
│   │   │   ├── data.rs             # データ取得コマンド
│   │   │   └── query.rs            # SQL 実行コマンド
│   │   ├── db/
│   │   │   ├── pool.rs             # コネクションプール管理
│   │   │   ├── types.rs            # PostgreSQL→JSON 型変換
│   │   │   └── error.rs            # エラー型定義
│   │   ├── ssh/
│   │   │   └── tunnel.rs           # SSH トンネル実装
│   │   ├── config/
│   │   │   └── storage.rs          # 接続設定の永続化
│   │   ├── state/
│   │   │   └── connections.rs      # アプリ状態管理
│   │   ├── lib.rs                  # モジュール定義・Tauri セットアップ
│   │   └── main.rs                 # Rust エントリーポイント
│   ├── Cargo.toml                  # Rust 依存関係
│   └── tauri.conf.json             # Tauri 設定
├── docker-compose.yml              # テスト用 PostgreSQL
├── package.json                    # Node 依存関係
├── vite.config.ts                  # Vite 設定
└── tsconfig.json                   # TypeScript 設定
```
