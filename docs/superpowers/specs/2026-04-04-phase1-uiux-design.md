# Phase 1 UI/UX 改善設計書

> DB Studio Phase 1: データ編集、オートコンプリート、コマンドパレット

## 概要

DB Studio の UI/UX を本格的な DB ツールに近づけるための Phase 1 改善。
ハイブリッド型アプローチを採用し、データ型に応じてインラインエディタとポップオーバーエディタを切り替える。

**スコープ**:
1. データ編集（INSERT / UPDATE / DELETE）
2. SQL オートコンプリート
3. コマンドパレット

---

## 1. データ編集（INSERT / UPDATE / DELETE）

### 1.1 設計方針

- DataGrid をインライン編集可能にし、変更をバッファに溜めて一括コミットする
- PK を持つテーブルのみ編集可能。PK がないテーブルは閲覧専用にフォールバック
- データ型に応じてインラインエディタとポップオーバーエディタを使い分ける

### 1.2 バックエンド追加コマンド

#### `get_primary_keys`

テーブルの主キーカラム一覧を返す。

- 引数: `connection_id: String, schema: String, table: String`
- 戻り値: `String[]`（PK カラム名のリスト）

#### `update_rows`

PK 指定で行を更新する。

- 引数: `connection_id: String, schema: String, table: String, changes: UpdateChange[]`
- 戻り値: `{ updated: number }`

```typescript
type UpdateChange = {
  pk: Record<string, any>       // PK カラム名 → 値
  column: string                // 更新対象カラム
  old_value: any                // 楽観的ロック用（WHERE 条件に含める）
  new_value: any                // 新しい値
}
```

WHERE 句には PK + old_value を含め、楽観的ロックとして機能させる。一致しない場合はエラーを返す。

#### `insert_rows`

新規行を挿入する。

- 引数: `connection_id: String, schema: String, table: String, rows: Record<string, any>[]`
- 戻り値: `{ inserted: number }`

#### `delete_rows`

PK 指定で行を削除する。

- 引数: `connection_id: String, schema: String, table: String, pk_values: Record<string, any>[]`
- 戻り値: `{ deleted: number }`

### 1.3 フロントエンド設計

#### 編集モード

DataGrid のツールバーに「Edit」トグルボタンを追加する。

- 編集モード OFF: 現在と同じ閲覧専用グリッド
- 編集モード ON: セルがクリック可能、ツールバーに操作ボタン表示
- PK がないテーブルでは Edit ボタンを disabled にし、ツールチップで理由を表示

#### インラインエディタ（型ごと）

| データ型 | エディタ | 動作 |
|----------|---------|------|
| text, varchar | `<input type="text">` | セル内で直接入力 |
| integer, numeric | `<input type="number">` | 数値入力 |
| boolean | チェックボックス | クリックでトグル |
| timestamp, date | `<input type="text">` | テキスト入力（フォーマットバリデーション） |
| JSON/JSONB | ポップオーバー | CodeMirror JSON エディタ |
| 長文テキスト (>100文字) | ポップオーバー | テキストエリアエディタ |

- セルダブルクリックで編集開始
- Enter で確定、Escape でキャンセル
- Tab で次のセルに移動
- NULL 値の設定: セル編集中に Ctrl+Shift+N で NULL をセット

#### 変更バッファ

Zustand ストアに `pendingChanges: Map<tabId, ChangeSet>` を追加する。

```typescript
type ChangeSet = {
  updates: UpdateChange[]              // セル単位の変更
  inserts: Record<string, any>[]       // 新規行
  deletes: Record<string, any>[]       // 削除対象の PK 値
}
```

変更の視覚的フィードバック:
- 変更セル: オレンジ背景（`--warning` 色、薄い透過）
- 新規行: 緑背景（`--success` 色、薄い透過）
- 削除予定行: 赤背景（`--error` 色、薄い透過）+ 取り消し線

#### ツールバー（編集モード時）

| ボタン | ショートカット | 動作 |
|--------|---------------|------|
| + Add Row | — | 末尾に空の新規行を追加 |
| - Delete Row | Delete | 選択行を削除マーク（トグル） |
| Save | Ctrl+S | 変更を一括コミット |
| Discard | — | すべての変更を破棄 |

#### 確認ダイアログ

Save 実行時に確認ダイアログを表示する:

> 「N 行を更新、M 行を挿入、K 行を削除します。実行しますか？」

- 実行後、成功した場合はデータを再取得してグリッドをリフレッシュ
- エラー時はどの操作で失敗したかをメッセージ表示

### 1.4 新規ファイル

- `src-tauri/src/commands/mutation.rs` — INSERT/UPDATE/DELETE コマンド
- `src/components/datagrid/InlineEditor.tsx` — インラインセルエディタ
- `src/components/datagrid/PopoverEditor.tsx` — ポップオーバーエディタ（JSON, 長文）
- `src/components/datagrid/EditToolbar.tsx` — 編集モード時のツールバー
- `src/components/datagrid/ConfirmDialog.tsx` — 保存確認ダイアログ

### 1.5 変更ファイル

- `src/components/datagrid/DataGrid.tsx` — 編集モード対応
- `src/components/datagrid/TableBrowser.tsx` — PK 取得、編集モード状態管理
- `src/store/appStore.ts` — pendingChanges 追加
- `src/lib/api.ts` — 新規コマンドのラッパー追加
- `src/lib/types.ts` — 新規型定義追加
- `src-tauri/src/commands/mod.rs` — mutation モジュール追加
- `src-tauri/src/lib.rs` — 新規コマンド登録

---

## 2. SQL オートコンプリート

### 2.1 設計方針

- 接続中の DB のメタデータを取得し、CodeMirror の補完機能でサジェストする
- 接続時に一括取得してフロントエンドでキャッシュ
- 完璧なパースは目指さず、実用的なレベルのコンテキスト認識を行う

### 2.2 バックエンド追加コマンド

#### `get_completion_metadata`

補完用メタデータを一括取得する。

- 引数: `connection_id: String`
- 戻り値: `CompletionMetadata`

```typescript
type CompletionMetadata = {
  schemas: string[]
  tables: { schema: string, name: string, type: "TABLE" | "VIEW" }[]
  columns: { schema: string, table: string, name: string, data_type: string }[]
  functions: { name: string, description: string }[]
}
```

- `schemas`: `information_schema.schemata` から取得（pg_* と information_schema を除外）
- `tables`: `information_schema.tables` から取得
- `columns`: `information_schema.columns` から取得
- `functions`: `pg_proc` + `pg_namespace` から主要な組み込み関数を取得

### 2.3 フロントエンド設計

#### メタデータキャッシュ

- Zustand ストアに `completionMetadata: Record<connectionId, CompletionMetadata>` を追加
- 接続成功時に `get_completion_metadata` を呼び出してキャッシュ
- コマンドパレットの `Refresh Metadata` で手動リフレッシュ可能

#### 補完ソース（優先度順）

1. **SQL キーワード** — SELECT, FROM, WHERE, JOIN 等（静的リスト、約100個）
2. **スキーマ名** — `FROM` / `JOIN` の後、ドット記法の前半
3. **テーブル名** — スキーマ指定後、または FROM/JOIN 直後
4. **カラム名** — テーブルが特定できる場合にそのテーブルのカラムを優先
5. **関数名** — `(` の前のコンテキスト

#### コンテキスト認識

カーソル位置の前のテキストを簡易パースし、コンテキストに応じた補完候補を出す:

| コンテキスト | 候補 |
|-------------|------|
| `SELECT \|` | カラム名 + 関数名 + `*` |
| `FROM \|` | スキーマ名.テーブル名 |
| `FROM public.\|` | public スキーマのテーブル一覧 |
| `WHERE t.\|` | エイリアス t のテーブルのカラム |
| `JOIN \| ON` | テーブル名 |
| その他 | 全候補（キーワード + テーブル + カラム） |

#### エイリアス解決

FROM 句を簡易パースして `FROM users u` → `u` = `users` のマッピングを構築する。
対応できない場合は全テーブルのカラムを候補に出す。

#### 補完 UI

- CodeMirror の `@codemirror/autocomplete` 拡張を使用
- ドロップダウンに型アイコン表示:
  - テーブル: Table アイコン
  - カラム: Columns アイコン
  - 関数: Function アイコン
  - キーワード: Code アイコン
- Tab / Enter で確定、Esc で閉じる
- 入力2文字以上、またはドット `.` 入力で自動トリガー

### 2.4 新規ファイル

- `src-tauri/src/commands/metadata.rs` — メタデータ取得コマンド
- `src/lib/sql-completion.ts` — 補完ロジック（コンテキスト認識 + 候補生成）
- `src/lib/sql-keywords.ts` — SQL キーワード一覧（静的データ）

### 2.5 変更ファイル

- `src/components/editor/SqlEditor.tsx` — CodeMirror に autocomplete 拡張を追加
- `src/store/appStore.ts` — completionMetadata キャッシュ追加
- `src/lib/api.ts` — get_completion_metadata ラッパー追加
- `src/lib/types.ts` — CompletionMetadata 型追加
- `src-tauri/src/commands/mod.rs` — metadata モジュール追加
- `src-tauri/src/lib.rs` — 新規コマンド登録

---

## 3. コマンドパレット

### 3.1 設計方針

- Cmd+K（macOS）/ Ctrl+K（Windows/Linux）でモーダルを開く
- ファジー検索で全アクションにアクセスする
- コマンドをレジストリとして集約し、機能追加時にコマンドを登録するだけで自動的にパレットに出る

### 3.2 コマンド一覧

#### 接続系

| コマンド名 | ショートカット | 動作 |
|-----------|---------------|------|
| Connect to... | — | 保存済み接続一覧のサブリストを表示 |
| Disconnect | — | 現在の接続を切断 |
| New Connection | — | 接続ダイアログを開く |

#### エディタ系

| コマンド名 | ショートカット | 動作 |
|-----------|---------------|------|
| New Query | — | 新しい SQL クエリタブを開く |
| Run Query | Cmd+Enter | 現在のクエリを実行 |
| Explain Query | — | EXPLAIN ANALYZE を実行 |
| Refresh Metadata | — | オートコンプリート用メタデータを再取得 |

#### テーブル系

| コマンド名 | ショートカット | 動作 |
|-----------|---------------|------|
| Open Table... | — | テーブル名ファジー検索のサブリストを表示 |
| Toggle Edit Mode | — | テーブルタブの編集モード切り替え |

### 3.3 フロントエンド設計

#### パレット UI

- 画面上部中央にオーバーレイ表示（幅 500px、最大高さ 400px）
- 上部: 検索入力欄（オートフォーカス）
- 下部: フィルタ済みコマンドリスト
- 各アイテム: アイコン + コマンド名 + ショートカット（右寄せ）
- 背景にクリック可能なオーバーレイ（クリックで閉じる）

#### ファジー検索

各入力文字がコマンド名に順番に含まれるかをチェックする簡易ファジーマッチ:
- `nq` → **N**ew **Q**uery
- `cnt` → **C**o**n**nec**t** to...

マッチした文字をボールド or ハイライト表示する。

#### キーボード操作

| キー | 動作 |
|------|------|
| 上下矢印 | 候補を移動 |
| Enter | 選択・実行 |
| Esc | 閉じる |
| Backspace（入力が空） | サブリストから親リストに戻る |

#### サブリスト

`Connect to...` や `Open Table...` は選択後にサブリストに遷移する:
- 同じ UI（入力欄 + リスト）でコンテンツを切り替え
- サブリスト内もファジー検索可能
- 入力欄の左にパンくずまたは「< Back」表示

#### コマンドレジストリ

```typescript
type Command = {
  id: string
  name: string
  icon: LucideIcon
  shortcut?: string
  category: "connection" | "editor" | "table" | "general"
  action: () => void | Promise<void>
  enabled?: () => boolean      // false の場合はグレーアウト
  sublist?: () => SubItem[]    // サブリストを返す場合
}
```

### 3.4 新規ファイル

- `src/components/command-palette/CommandPalette.tsx` — パレット UI
- `src/components/command-palette/CommandItem.tsx` — 個別コマンド行
- `src/lib/commands.ts` — コマンドレジストリ（全コマンド定義）
- `src/lib/fuzzy-match.ts` — ファジーマッチユーティリティ

### 3.5 変更ファイル

- `src/App.tsx` — Cmd+K グローバルリスナー追加、CommandPalette の条件付きレンダリング
- `src/store/appStore.ts` — `showCommandPalette: boolean` 追加

---

## 4. 依存関係

### npm 追加パッケージ

- `@codemirror/autocomplete` — CodeMirror 補完拡張（オートコンプリートで使用）

### Cargo 追加クレート

なし（既存の sqlx で全クエリ対応可能）

---

## 5. Phase 1 に含まないもの

以下は Phase 2 以降のスコープとする:
- インポート/エクスポート（CSV/JSON/SQL）
- テーブル構造編集（ALTER TABLE）
- EXPLAIN 結果のグラフィカル可視化
- ER ダイアグラム
- AI 統合
- ダークモード/ライトモードの切り替え
- カラムリサイズ
- 行選択/マルチ行操作（削除以外）
