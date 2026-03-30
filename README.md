# DB Studio

PostgreSQL 向けのデスクトップデータベース GUI ツール。テーブル一覧・データ閲覧・SQL 実行をひとつの画面で操作できます。

## 機能

- **接続管理** - 接続情報の保存・編集・削除・テスト
- **スキーマ探索** - スキーマ・テーブル・カラム情報のツリー表示（PK・型・NULL 許可・デフォルト値）
- **データブラウジング** - ページネーション・ソート付きデータグリッド
- **SQL エディタ** - シンタックスハイライト・Cmd+Enter で実行・EXPLAIN ANALYZE 対応
- **タブ UI** - テーブル閲覧タブと SQL クエリタブを複数同時に開ける

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| デスクトップフレームワーク | Tauri v2 |
| バックエンド | Rust + sqlx (PostgreSQL) |
| フロントエンド | React + TypeScript |
| スタイリング | Tailwind CSS v4 |
| SQL エディタ | CodeMirror |
| 状態管理 | Zustand |

## 必要な環境

- Node.js >= 18
- pnpm
- Rust (cargo)
- [Tauri の前提条件](https://v2.tauri.app/start/prerequisites/)

## セットアップ

```bash
pnpm install
```

## 開発

```bash
pnpm tauri dev
```

## ビルド

```bash
pnpm tauri build
```

## プロジェクト構成

```
src-tauri/src/
  commands/     Tauri IPC コマンド (connection, schema, data, query)
  db/           DB 抽象層 (pool 管理、型マッピング)
  config/       接続情報の永続化 (JSON)
  state/        アプリ状態 (接続プール管理)

src/
  components/
    connection/ 接続ダイアログ・リスト
    explorer/   テーブルツリー
    datagrid/   データグリッド・テーブルブラウザ
    editor/     SQL エディタ
    layout/     サイドバー・メインパネル・ステータスバー
  store/        Zustand 状態管理
  lib/          型定義・Tauri API ラッパー
```

## ライセンス

MIT
