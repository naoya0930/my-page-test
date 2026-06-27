# テストデータ作成 TODO

> 対象: `test/user_list.md` の5シナリオを D1（`ast_way_db`）に投入する。
> ストレージ仕様の根拠: `docs/system_design.md` / `workers/index.js` / `migrations/001_create_tables.sql`

## 0. 準備（Supabase 実アカウント情報の収集）

- [ ] 作成済みの Supabase アカウントを5件用意する（user1〜user5 相当）
- [ ] 各アカウントの **UUID（`auth.users.id` / JWT の `sub`）** を控える
- [ ] 各アカウントの **Email** を控える
- [ ] `test/user_list.md` の `userN@example.com` を実 Email / UUID に置換する
  - `supabase_user_id` ← Supabase UUID（紐付けキー）
  - `email` ← 実 Email
  - `id` ← 任意の一意値（UUID と同一でも可）

## 1. SQL ファイルの作成（`migrations/test_data_v2.sql` 等）

- [ ] 既存 `migrations/test_data.sql` を雛形に新規ファイルを作成する
- [ ] **Users**: 5名分を INSERT
  - [ ] `created_at` を各シナリオの「開始日時」で**明示指定**する（週計算の起点）
  - [ ] `supabase_user_id` を実 UUID にする
- [ ] **MorningPages**: シナリオ別に投入
  - [ ] `entry_date` は `2026-06-27` 以下、`UNIQUE(user_id, entry_date)` を守る
  - [ ] `character_count` を content の実文字数（改行・空白含む）と一致させる
  - [ ] user1: 第1〜2週に飛び飛び
  - [ ] user2: 直近2日分のみ（100〜300文字）
  - [ ] user3: 第1〜3週は高頻度・1000文字前後 / 第4〜5週は週1〜2回・300文字程度
  - [ ] user4: 毎日入力＋境界値（1文字/空白のみ、4000文字超）
  - [ ] user5: 84日間ほぼ毎日（90%以上）・1200〜1500文字
- [ ] **ArtistDates**: `week_number` 1〜12、`went_out`/`excited` は 0/1
  - [ ] user1: 第1・2週あり
  - [ ] user2: なし
  - [ ] user3: 実施週 / 外出のみ週 / 未実施週を混在
  - [ ] user4: 各週 `went_out=0, excited=0`
  - [ ] user5: 第1〜12週すべて（大半が達成=1）
- [ ] **Progress**: 完了週ごとに `morning_page_done` / `artist_date_done` を投入（API 経由でないため手動整合）
  - [ ] user5 は第1〜12週すべて投入

## 2. 投入・実行

- [ ] スキーマ未適用ならマイグレーション実行
      `docker-compose exec workers npx wrangler d1 execute ast_way_db --local --file=./migrations/001_create_tables.sql`
- [ ] テストデータ投入
      `docker-compose exec workers npx wrangler d1 execute ast_way_db --local --file=./migrations/test_data_v2.sql`

## 3. 検証

- [ ] `SELECT * FROM Users;` で5名・`created_at`・`supabase_user_id` を確認
- [ ] 各ユーザーの実 JWT でログインし、`GET /api/progress` の `current_week` / `current_day` が期待値か確認
  - [ ] user1 → 第3週付近
  - [ ] user2 → 第1週 / Day 4 付近
  - [ ] user3 → 第6週付近
  - [ ] user4 → 第3週（境界値で UI が崩れないか）
  - [ ] user5 → `current_week=12` / `current_day=84`（cap 確認）
- [ ] `GET /api/statistics` でヒートマップ・週次グラフ・アーティストデート軌跡を確認（特に user3 の虫食い、user5 の最大実績）
- [ ] `character_count` と実際の content 長さが一致しているか抜き取り確認

## メモ / 既知の注意点

- 週・日の計算は `Users.created_at` 起点（マイグレーション日ではない）。
- `current_week` は 12、`current_day` は 84 で cap される。
- `ArtistDates.week_number` は CHECK(1〜12)。第13週は作成不可。
- ユーザー紐付けキーは `supabase_user_id`（JWT `sub`）。`Users.id` は内部キー。
