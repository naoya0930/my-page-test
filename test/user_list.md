# 前提条件

> ストレージ仕様は `docs/system_design.md` と実装 `workers/index.js` / `migrations/001_create_tables.sql` に準拠する。

- **現在のシステム日時**: `2026-06-27 12:00:00` 固定（テストデータの投入もこの日付で実行する前提）
- **使用DB**: Cloudflare D1（SQLite 3）。データベース名は **`ast_way_db`**
- **実行環境 / 投入方法**: `.sql` ファイルを `wrangler d1 execute` で流し込む
  - ローカル: `docker-compose exec workers npx wrangler d1 execute ast_way_db --local --file=./migrations/<filename>.sql`
  - 本番: `npx wrangler d1 execute ast_way_db --file=./migrations/<filename>.sql`

## 経過週・経過日の計算（重要・修正点）

> ⚠️ 旧版では「マイグレーション実行日を起点」としていたが、これは誤り。
> 実装（`workers/index.js`）は **各ユーザーの `Users.created_at`** を起点に計算する。

- 起点 = **各ユーザーの `Users.created_at`**（＝各シナリオの「開始日時」）
- `経過日数 = floor((現在日時 - created_at) / 1日)`
- `現在の経過週 = min(floor(経過日数 / 7) + 1, 12)` … **第12週で上限（capされる）**
- `Day 表示 = clamp(経過日数 + 1, 1, 84)` … **84日で上限**
- → テストデータでは **`created_at` を必ず開始日時で明示指定する**こと（`CURRENT_TIMESTAMP` に依存しない）。
  `datetime('now', '-N days')` のような相対指定でも、固定日付（`'2026-06-13 09:00:00'` 等）でも可。

## ユーザー管理（Supabase Auth 連携・重要・修正点）

> ⚠️ 旧版では「`Users.id` = Supabase の UUID」としていたが、実装と異なる。

- 認証の Source of Truth は **Supabase Auth**。Workers は JWT の `sub` を
  **`Users.supabase_user_id`** と突き合わせてアプリ内ユーザーを解決する（`getOrCreateUser`）。
- したがって紐付けキーは `id` ではなく **`supabase_user_id`**。
  ここに **実際に作成した Supabase アカウントの UUID を入れること**。
- `Users.id` は子テーブル（MorningPages / ArtistDates / Progress）の外部キー先となる内部ID。
  Supabase UUID と同じ値でも、別の一意値でもよい（本番では `user_xxx` 形式で自動採番される）。
- `email` も実アカウントのメールアドレスに合わせる。
- 下記シナリオの `userN@example.com` は **プレースホルダ**。
  実 Supabase アカウントの Email / UUID に置換する（割り当ての対応関係は変えない）。

## テーブル別のストレージ注意点

- **MorningPages**: `UNIQUE(user_id, entry_date)`（1日1レコード）。`entry_date` は `2026-06-27` 以下のみ。
  `character_count` は **content の実文字数**（改行・空白も1文字としてカウント）と一致させる。
- **ArtistDates**: `UNIQUE(user_id, week_number)`、`week_number` は **CHECK(1〜12)**。
  `went_out` / `excited` は **0 / 1**（SQLite の BOOLEAN は INTEGER）。
- **Progress**: 週次集計のキャッシュ。本来は API 書き込み時に自動更新されるが、SQL 直接投入では
  自動更新されないため、**完了週ごとに `morning_page_done` / `artist_date_done` を明示投入して整合を取る**
  （`UNIQUE(user_id, week_number)`、`week_number` は 1〜12）。

# 生成するテストユーザーと網羅パターン（5つのシナリオ）

以下の5名のユーザーデータを生成する。
※ `supabase_user_id` と `email` は実際に作成した Supabase アカウントの値に置換すること。

## 1. 基準ユーザー (計画書ベース)
- **Email**: user1@example.com
- **開始日時 (created_at)**: 2026-06-13（2週間前・現在第3週）
- **データ要件**:
  - 第1週、第2週に、数日おき（飛び飛び）でモーニングページのレコードを挿入。
  - アーティストデートは第1週、第2週ともに実施済み（レコードあり）として作成。
  - Progress: 第1〜2週の `morning_page_done` / `artist_date_done` を投入。

## 2. 新規・直近開始パターン 【UI初期表示検証用】
- **Email**: user2@example.com
- **開始日時 (created_at)**: 2026-06-24（3日前・現在第1週）
- **データ要件**:
  - モーニングページは直近の2日分のみ。文字数は少なめ（100〜300文字）。
  - アーティストデートは未記録（レコードなし）。
  - Progress: レコードなし（または第1週を `0/0`）。

## 3. 中盤・アクティビティ斑（虫食い）パターン 【ヒートマップ検証用】
- **Email**: user3@example.com
- **開始日時 (created_at)**: 2026-05-20（約5週間前・現在第6週）
- **データ要件**:
  - 第1週〜第3週: 毎日欠かさず高頻度（5〜7日/週）でモーニングページを入力（文字数1000文字前後）。
  - 第4週〜第5週: 失速し、週に1〜2回しか入力していない（文字数も300文字程度に減少）。
  - アーティストデート: 「実施した週（went_out=1, excited=1）」「外出のみの週（went_out=1, excited=0）」「未実施の週（レコードなし）」を混在させる。
  - Progress: 各週の実績に合わせて投入。

## 4. 極端なデータ・境界値パターン 【UI崩れ検証用】
- **Email**: user4@example.com
- **開始日時 (created_at)**: 2026-06-13（2週間前・現在第3週）
- **データ要件**:
  - モーニングページは毎日入力。ただし文字数が極端なデータを混在させる。
    - パターンA: 1文字だけ、あるいは空白・改行のみ（`character_count` も実文字数に合わせる）。
    - パターンB: 1件で4000文字以上の超長文。
  - アーティストデートは毎週記録されているが、すべて `went_out=0, excited=0` に設定。

## 5. プログラム完遂パターン 【最大実績値・過去週検証用】
- **Email**: user5@example.com
- **開始日時 (created_at)**: 2026-04-04（正確に12週間前・完了者）
- **データ要件**:
  - 84日間、ほぼ毎日（90%以上の確率）モーニングページが入力されている。文字数はコンスタントに1200〜1500文字。
  - アーティストデートは第1週〜第12週まで全てデータが存在し、大半が達成（1）している。
  - `Progress` テーブルにも第1週〜第12週までのレコードが全て揃っている。
  - ⚠️ 補足: 開始から84日超でも **API の `current_week` は 12 で cap、`current_day` は 84 で cap** される。
    `ArtistDates.week_number` も CHECK(1〜12) のため **第13週のレコードは作れない**（=完了状態として扱う）。
