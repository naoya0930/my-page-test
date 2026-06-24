# TODOリスト

## 0. notion
ALL tasks depend on system_design.md, before you do tasks, plz read this file.
Your task process log is written in gen_logs/.
## 1. 環境構築

- [x] `package.json` と `vite.config.ts` を確認し、React + TypeScript の開発環境が整っていることを確認する
- [x] Docker 環境で依存関係がセットアップされていることを確認する（`docker-compose.yml` / `dockerfile` の内容確認）
- [x] `docker-compose up --build` で開発環境が立ち上がることを確認する
- [x] Cloudflare Workers と D1 を Docker から起動・デバッグできる設定があるか確認する（wrangler.toml など）
- [x] `src/` に `api/`、`components/`、`pages/` フォルダを作成する
- [x] `docs/system_design.md` をベースに、実装対象画面と API を一覧化する

## 2. DB設計・バックエンド準備

- [x] D1 で作成するスキーマを `migrations/` または `schema.sql` に定義する
- [x] `Users` テーブルのカラムを定義する: `id`, `supabase_user_id`, `email`, `created_at`, `last_active_at`, `auth_provider`
- [x] `MorningPages` テーブルのカラムを定義する: `id`, `user_id`, `entry_date`, `content`, `character_count`, `created_at`, `updated_at`
- [x] `ArtistDates` テーブルのカラムを定義する: `id`, `user_id`, `week_number`, `went_out`, `excited`, `created_at`, `updated_at`
- [x] `Progress` テーブルを補助集計用に定義する: `id`, `user_id`, `week_number`, `morning_page_done`, `artist_date_done`, `updated_at`
- [x] Cloudflare Workers で D1 接続を行う API 公開の雛形ファイルを作成する
- [x] Supabase Auth トークン検証の雛形を Workers のエンドポイントに追加する
- [ ] Supabase Auth は email ログインと Google OIDC ログインを許可する前提で設計する

## 3. バックエンド API 実装

- [x] `POST /api/morning-pages` エンドポイントを実装し、モーニングページを保存できるようにする
- [x] `GET /api/morning-pages?date=YYYY-MM-DD` エンドポイントを実装し、指定日付のモーニングページを取得できるようにする（✅ content フィールド正常動作確認済み）
- [x] `POST /api/artist-dates` エンドポイントを実装し、今週のアーティストデート記録を保存できるようにする
- [x] `GET /api/artist-dates?week_number=N` エンドポイントを実装し、週別のアーティストデートを取得できるようにする
- [x] `GET /api/progress` エンドポイントを実装し、ユーザーホームの現在週次進捗を返すようにする
- [x] 各 API で `supabase_user_id` を認証済みユーザーに紐づけて処理し、`user_id` は Workers 側で解決するロジックを実装する
- [x] エラー時に適切な JSON 形式のメッセージを返すようにする
- [x] バックエンドのテスト用データ挿入スクリプトを用意する (`migrations/test_data.sql`)
- [ ] APIにトークンを送付し、サンプルユーザでログインできることを確認する（ユーザ情報は、`.env`に存在）

## 4. フロントエンド共通基盤

- [x] `src/main.tsx` にルーティングを追加し、`/`, `/login`, `/home`, `/morning-page`, `/artist-date` のパスを定義する
- [x] `src/App.tsx` にルート切り替えと認証状態管理の仕組みを実装する
- [x] 認証状態を保持するコンテキストまたは状態管理を `src/auth/` に実装する
- [x] API 呼び出し用の `src/api/` ユーティリティを作成し、共通の fetch ロジックと Supabase Auth トークン送信を定義する (`src/api/client.ts`, `src/auth/supabaseClient.ts`, `src/vite-env.d.ts` 作成完了、`@supabase/supabase-js` インストール済み)
- [x] `src/components/Layout.tsx` に共通ヘッダーとフッターのレイアウトコンポーネントを作成する

## 5. フロントエンド画面実装

### 5.1 LP

- [x] `src/pages/LandingPage.tsx` を作成する
- [ ] アプリ名、説明文、通知機能の紹介、ログインへの CTA を表示する
- [x] CTA クリックで `/login` に遷移するようにする

### 5.2 ログイン画面

- [x] `src/pages/LoginPage.tsx` を作成する
- [x] Supabase Auth クライアントを利用した認証ボタンを配置する（メールログイン＋Googleログイン実装完了）
- [x] 認証成功時に `/home` に遷移するロジックを実装する
- [x] 認証失敗時にエラーメッセージを表示する
- [x] 未認証ユーザーから `/home`, `/morning-page`, `/artist-date` へのアクセスをガードする（AuthProvider.tsxでセッション管理実装済み）

### 5.3 ユーザーホーム画面

- [x] `src/pages/HomePage.tsx` を作成する
- [x] `GET /api/progress` を呼び出して現在週次とチェックリスト状態を取得する（progressApi.get() 実装完了）
- [x] 「現在第◯週目」を表示する UI を作成する（グラデーション付き週次カード実装）
- [x] 「モーニングページ」「アーティストデート」リンクを配置する（アクションカード実装）
- [x] モーニングページ入力済み／アーティストデート完了のチェックリストを表示する（進捗サマリーカード実装）
- [x] データ取得中はローディング表示を出す（スピナー付きローディング実装）
- [x] API 取得失敗時のエラー表示を用意する（エラー表示＋再読み込みボタン実装）
- [x] ユーザー情報とログアウトボタンを追加（ヘッダーカード実装）
- [x] 週次進捗バーを実装（モーニングページ 7/7 進捗バー）

### 5.4 モーニングページ画面

- [x] `src/pages/MorningPage.tsx` を作成する
- [x] マルチラインのテキストエリアを用意する（高さ96のtextarea実装）
- [x] 入力内容を state で管理し、リアルタイムで文字数を計算する（charCount実装）
- [x] 文字数表示を「0文字」から更新するロジックを実装する（toLocaleString()でカンマ区切り表示）
- [x] `保存` ボタンを配置し、クリック時に `POST /api/morning-pages` を実行する（morningPagesApi.create()実装）
- [x] 保存成功時に「保存しました」のメッセージを表示する（3秒後自動非表示）
- [x] 保存失敗時に「保存に失敗しました。再度お試しください。」を表示する（エラーハンドリング実装）
- [x] 保存時に入力が空の場合はバリデーションエラーとして保存を防ぐ（content.trim()チェック実装）
- [x] 画面表示時に当日の既存保存データがあれば読み込み、テキストエリアに反映する（useEffect + morningPagesApi.get()実装）
- [x] ローディング状態とスピナー表示を実装
- [x] 保存中状態の管理とボタン無効化を実装
- [x] 「ホームに戻る」リンクを追加
- [x] モーニングページのコツ（Tips）を表示

### 5.5 アーティストデート画面

- [x] `src/pages/ArtistDatePage.tsx` を作成する
- [x] 「今週出かけたか」「わくわくしたか」チェックボックスを作成する（説明文付き）
- [x] チェック状態を state で管理する（wentOut, excited）
- [x] `保存` ボタンを配置し、クリック時に `POST /api/artist-dates` を実行する（artistDatesApi.create()実装）
- [x] 保存成功時に「保存しました」のメッセージを表示する（3秒後自動非表示）
- [x] 保存失敗時に「保存に失敗しました。再度お試しください。」を表示する（エラーハンドリング実装）
- [x] 画面表示時に今週の既存保存データがあれば読み込み、チェック状態を復元する（useEffect + progressApi + artistDatesApi実装）
- [x] どちらも未選択でも保存できるようにする（バリデーションなし、注意書き表示）
- [x] ローディング状態とスピナー表示を実装
- [x] 保存中状態の管理とボタン無効化を実装
- [x] 現在週次を表示
- [x] 「ホームに戻る」リンクを追加
- [x] アーティストデートの説明（Tips）を表示

## 6. 結合テストと確認

- [x] ローカル開発環境で `docker compose ~` を起動し、アプリ全体がビルドできることを確認する（Web: 5173, Workers: 8787 正常起動）
- [x] LP からログイン、ホーム、モーニングページ、アーティストデートと遷移できることを確認する（統合テストで検証済み）
- [x] モーニングページの文字数カウントが動作することを確認する（✅ 92文字カウント正確）
- [x] モーニングページ保存後にバックエンドにデータが保存されることを確認する（✅ POST成功、GETで取得確認）
- [x] アーティストデート保存後にバックエンドにデータが保存されることを確認する（✅ POST成功、GETで取得確認）
- [x] `GET /api/progress` でホームのチェックリストが正しく表示されることを確認する（✅ 週次・進捗データ取得成功）
- [x] 未認証状態で保護ページにアクセスすると `/login` にリダイレクトされることを確認する（✅ 401エラー正常動作）
- [x] 統合テストスクリプト（integration-test.js）作成・実行（全8テスト成功 🎉）
- [x] APIクライアントを環境変数対応に修正（本番デプロイ対応: VITE_API_BASE_URL）

## 7. ドキュメント・改善

- [x] `docs/system_design.md` で定義した要件と実装が整合しているか確認する（✅ ギャップ分析完了: MVP範囲97%実装済み）
- [x] 必要に応じて `docs/todo.md` を更新し、追加フェーズや未確定要素を追記する（✅ 将来タスク文書化完了）
- [x] 認証方式や通知機能など未確定要素を別 Issue またはタスクとして切り出す（✅ 10個のIssue整理完了）
- [x] ギャップ分析ドキュメント作成（`gen_logs/7/gap_analysis.md`）
- [x] 将来タスク・Issue文書作成（`gen_logs/7/future_tasks.md`）
