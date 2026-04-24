# データベースGUIツール サーベイ

## 調査対象ツール一覧

| ツール | 対応DB | 料金 | UI特徴 | 技術スタック |
|--------|--------|------|--------|-------------|
| DBeaver | 100以上 | Community無料 / Pro有料 | 伝統的・重厚 | Java, Eclipse RCP |
| pgAdmin | PostgreSQLのみ | 無料(OSS) | Webベース・やや旧来的 | Python + React |
| DataGrip | 主要DB全般 | $10/月〜 | IDE風・プロ向け | Java/Kotlin, IntelliJ |
| TablePlus | 12種+ | $99〜買い切り | 最もモダン・洗練 | ネイティブC++ |
| Beekeeper Studio | 15種+(Community) | Community無料 / Ultimate $7/月 | モダン・クリーン | Electron, Vue.js |
| DbGate | 15種+ | 無料(OSS) | モダンWeb風 | Svelte, Electron |
| Postico | PostgreSQLのみ | $69〜買い切り | Mac native・最軽量(12MB) | Objective-C/Swift |
| Sequel Ace | MySQL/MariaDBのみ | 無料(OSS) | Mac native・シンプル | Objective-C |
| HeidiSQL | 7種 | 無料(OSS) | Windows伝統的 | Delphi |
| Supabase Studio | PostgreSQLのみ | Supabase料金に含む | 最モダンWeb UI | Next.js, React |

## 各ツール詳細

### DBeaver

- **対応DB**: 100以上。Community版はPostgreSQL, MySQL, MariaDB, SQLite, Oracle, SQL Server等のSQL DB。Pro/Enterprise版はMongoDB, Cassandra, Redis, DynamoDB, Neo4j, CosmosDB, CSV/Excel等のNoSQL・フラットファイルも対応
- **主要機能**: SQLエディタ(シンタックスハイライト、補完)、データエディタ、ERダイアグラム、データインポート/エクスポート/マイグレーション、実行計画の可視化、SSHトンネリング、AI補完(OpenAI/Copilot)、データベースダッシュボード、空間データビューア
- **UI/UX**: Eclipse RCPベースのため、やや伝統的で重厚な印象。機能が豊富すぎて初心者には圧倒される面あり。起動も比較的遅い
- **料金**: Community版は完全無料(OSS, Apache 2.0)。Pro版/Enterprise版は有料サブスクリプション
- **差別化ポイント**: 対応DB数が圧倒的に多い。無料版でも実用的な機能がほぼ揃っている。実行計画のビジュアル表示が優秀

### pgAdmin

- **対応DB**: PostgreSQLのみ(公式ツール)
- **主要機能**: SQLエディタ(補完、シンタックスハイライト)、グラフィカルEXPLAIN、サーバーサイドカーソル対応、AI統合(セキュリティ/スキーマ/パフォーマンスレポート、AIチャット、EXPLAIN分析)、LLMプロバイダカスタム設定(OpenAI/Anthropic対応)
- **UI/UX**: Webベース(ブラウザ)またはデスクトップ。機能は豊富だがUIはやや旧来的。管理者向けの設計思想
- **料金**: 完全無料(OSS)
- **差別化ポイント**: PostgreSQL公式ツールとしての信頼性。FIPS準拠対応。AI Insights機能でEXPLAIN分析が可能

### DataGrip (JetBrains)

- **対応DB**: MySQL, PostgreSQL, SQL Server, Oracle, MongoDB等の主要DB
- **主要機能**: 高度なSQLコード補完・リファクタリング、使用箇所検索、スキーマ差分比較、クエリプロファイリング、AI支援コード補完、安全なリファクタリング
- **UI/UX**: JetBrains IDEベースでIDE的な操作感。SQLを「コード」として扱う設計思想。学習コストはやや高いが、プロフェッショナル向けには最高水準
- **料金**: 個人$10/月、組織$10.90/月。非商用・学生向け無料枠あり。30日間無料トライアル
- **差別化ポイント**: SQLリファクタリング・コード解析がIDE水準。スキーマ差分やusage searchなど他ツールにない機能が豊富

### TablePlus

- **対応DB**: MySQL, PostgreSQL, SQLite, SQL Server, Amazon Redshift, MariaDB, CockroachDB, Vertica, Redis, Cassandra, Snowflake, Oracle
- **主要機能**: ネイティブSQLエディタ(シンタックスハイライト、分割表示)、データ編集、スナップショット機能、変更のコードレビュー表示、マルチタブ/マルチウィンドウ、libssh/TLSによる暗号化接続
- **UI/UX**: 最もモダンで洗練されたUI。ネイティブアプリのため高速。学習コストが最も低いと評価される。Mac-firstの設計思想
- **料金**: Basic $99/1デバイス(買い切り)、Standard $129/2デバイス。1年間のアップデート込み。更新は$59/デバイス
- **差別化ポイント**: 圧倒的なUI/UXの美しさと軽快さ。ネイティブアプリによるパフォーマンス。変更差分をコードレビュー風に表示する機能

### Beekeeper Studio

- **対応DB**: Community版はMySQL, PostgreSQL, SQLite, SQL Server, MariaDB, CockroachDB, ClickHouse, DuckDB, Firebird, TiDB等。Ultimate版は+ Oracle, Cassandra, Redis, Trino, SurrealDB, BigQuery, Redshift等
- **主要機能**: SQLエディタ(補完、ハイライト)、スプレッドシート風データ編集、JSONサイドバー、テーブル作成/編集GUI、AI Shell(データベース連携AIアシスタント)、インポート/エクスポート
- **UI/UX**: モダンでクリーンなUI。Electronベースだが操作感は良好。全OS完全機能パリティ
- **料金**: Community版は無料(GPLv3)。Ultimate版は約$7/月/ユーザー。14日間無料トライアル
- **差別化ポイント**: AI Shellによるデータベース対話型AI。OSSでありながらモダンUI。クロスプラットフォームで全機能同一

### DbGate

- **対応DB**: MySQL, PostgreSQL, SQL Server, Oracle, SQLite, MongoDB, Redis, Cassandra, CockroachDB, Redshift, MariaDB, CosmosDB, ClickHouse。Premium版は+ DynamoDB, API連携(OpenAPI/GraphQL/oData)
- **主要機能**: スキーマ比較、ビジュアルクエリデザイナー、チャート可視化、バッチインポート/エクスポート、マスター/ディテール表示、外部キールックアップ、Excel風セル編集、CSV/JSON/Excel対応
- **UI/UX**: モダンなWebベースUI。デスクトップアプリまたはDockerでブラウザ実行可能
- **料金**: 無料(GPL-3.0)。Premium版あり
- **差別化ポイント**: スキーマ比較機能。ビジュアルクエリデザイナー搭載。Web/Docker版でブラウザからアクセス可能。APIエンドポイント対応(Premium)

### Postico

- **対応DB**: PostgreSQLのみ(+ Redshift, Greenplum, CockroachDB等のPostgreSQL互換)
- **主要機能**: マルチファイルSQLエディタ、データ入力/編集、行詳細サイドバー、グラフィカル構造エディタ、ファンクションエディタ、ユーザー/ロール管理、補完・ハイライト
- **UI/UX**: Mac nativeで最も美しくシンプル。わずか12MBの軽量アプリ。クラッシュ率が極めて低い。「少ない機能を極めて高い品質で」の設計哲学
- **料金**: Personal $69/3デバイス、Student $29/1デバイス、Commercial $99/1デバイス。全て買い切り。30日間無料トライアル
- **差別化ポイント**: macOS上でのPostgreSQL操作に特化した最高のUX。12MBという驚異的な軽量さ。安定性の高さ

### Sequel Ace

- **対応DB**: MySQL / MariaDBのみ
- **主要機能**: マルチタブクエリ実行、SSHトンネリング、ビジュアルクエリビルダー、検索/フィルタリング、補完・ハイライト、AWS IAM認証(RDS対応)
- **UI/UX**: Mac nativeのシンプルなUI。MySQL専用として直感的
- **料金**: 完全無料(OSS、Mac App Storeから入手)
- **差別化ポイント**: Mac上でのMySQL管理に特化した無料ツール。AWS RDS IAM認証対応

### HeidiSQL

- **対応DB**: MariaDB, MySQL, SQL Server, PostgreSQL, SQLite, Interbase, Firebird
- **主要機能**: SQLエディタ(補完、ハイライト)、データインポート/エクスポート(CSV, SQL, XML)、データベース同期、テーブル/ビュー/ストアドプロシージャ/トリガー/スケジュールイベント管理、SSHトンネリング
- **UI/UX**: Windows伝統的なUI。軽量で動作は高速。機能は実用的だがデザインは古め
- **料金**: 完全無料(OSS)
- **差別化ポイント**: Windows上で最軽量級の無料DBクライアント。データベース同期機能

### Supabase Studio

- **対応DB**: PostgreSQLのみ(Supabaseプラットフォーム統合)
- **主要機能**: テーブルエディタ、SQLエディタ(スニペット保存・共有)、認証管理、ストレージブラウザ、Edge Functions管理、リードレプリカ管理、コマンドメニュー(Cmd+K)、Supabase Assistant(AIクエリ最適化)、RLSポリシー管理
- **UI/UX**: 最もモダンなWebベースUI。開発者体験(DX)を重視した設計。Cmd+Kショートカット等の現代的なUXパターン
- **料金**: Supabaseプラットフォームの一部。Free tier無料、Pro $25/月、Team $599/月
- **差別化ポイント**: BaaS統合(認証・ストレージ・Edge Functions・リアルタイム)。宣言的スキーマ管理。大規模データセットでの高速表示

## 全ツール共通の基本機能

ほぼ全てのツールに共通している機能:

1. **SQLエディタ** - シンタックスハイライト、オートコンプリート
2. **データ閲覧・編集** - テーブルデータのGUI操作(CRUD)
3. **接続管理** - 複数DB接続の保存・切り替え
4. **SSHトンネリング** - セキュアなリモート接続
5. **インポート/エクスポート** - CSV, JSON, SQL, Excel等のデータ入出力
6. **テーブル構造管理** - GUIでのCREATE/ALTER TABLE

## 差別化される先進機能

| 機能 | 搭載ツール | 概要 |
|------|-----------|------|
| AI統合(SQL生成・最適化) | pgAdmin, DBeaver, DataGrip, Beekeeper, Supabase | LLMによるSQL支援。2026年時点でほぼ標準化 |
| ERダイアグラム | DBeaver, DataGrip, pgAdmin | スキーマの視覚的なER図表示 |
| スキーマ比較・同期 | DbGate, DataGrip, DBeaver | 2つのDB間の差分検出・マイグレーション |
| ビジュアルクエリビルダー | DbGate, DBeaver, Sequel Ace | SQLを書かずにGUIでクエリ構築 |
| 変更差分のコードレビュー表示 | TablePlus | DB変更をGit diff風に可視化 |
| コマンドパレット(Cmd+K) | Supabase Studio | エディタ風の高速ナビゲーション |
| SQLリファクタリング | DataGrip | 変数リネーム・使用箇所検索をIDE水準で |
| EXPLAIN可視化 | DBeaver, pgAdmin, DataGrip | 実行計画をグラフィカルに表示 |
| API連携 | DbGate(Premium) | OpenAPI/GraphQLエンドポイントをDBとして扱う |

## dbstudioへの示唆

### 活かすべき強み

- **Tauri v2のネイティブ性能**: TablePlus/Postico的な「軽量・高速」路線を実現できる
- **React + Tailwind**: Supabase Studio風のモダンUIが可能
- **SSHトンネリング実装済み**: 全ツール共通の必須機能をカバー

### 未実装で追加価値が高い機能(優先度順)

1. **データ編集(INSERT/UPDATE/DELETE)** - ほぼ全ツールにある基本機能
2. **インポート/エクスポート(CSV/JSON/SQL)** - 実用上必須
3. **テーブル構造の編集(GUI上でALTER TABLE)** - 基本機能
4. **オートコンプリート** - SQLエディタの必須機能
5. **ERダイアグラム表示** - スキーマ理解に有用、差別化要素
6. **AI統合(SQL生成・最適化)** - 2026年の標準機能、大きな差別化
7. **EXPLAIN結果のグラフィカル可視化** - 現在テキストのみから図表示で価値向上
8. **コマンドパレット** - モダンUXの象徴
