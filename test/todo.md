# テストデータ作成 TODO

> 対象: `test/user_list.md` の5シナリオを D1（`ast_way_db`）に投入する。
> ストレージ仕様の根拠: `docs/system_design.md` / `workers/index.js` / `migrations/001_create_tables.sql`
> 実施結果のSQL: `migrations/test_data_v2.sql`（`npm run d1:seed` で再投入可）

## 0. 準備（Supabase 実アカウント情報の収集）

- [x] 作成済みの Supabase アカウントを5件用意する（user1〜user5）
- [x] 各アカウントの **UUID（`auth.users.id` / JWT の `sub`）** を控える
- [x] 各アカウントの **Email** を控える
- [x] 実 Email / UUID を SQL に反映（`@example.com` のまま、UUID を投入）

実アカウント（パスワードは全員 `.env` の `SAMPLE_USER_PASSWORD=super`）:

| Email | Supabase UUID |
|---|---|
| user1@example.com | d7ef576e-51cb-4bf6-9935-5bccf469d4c0 |
| user2@example.com | 3fc242cb-81fb-4943-9647-daf86488fa19 |
| user3@example.com | b2757357-8ac8-4607-8a57-7ad28c944d46 |
| user4@example.com | 18550a58-b9a5-4fb2-bfdb-578670673142 |
| user5@example.com | 00fb977a-b868-40bc-b67c-517d24e49ec7 |

## 1. SQL ファイルの作成（`migrations/test_data_v2.sql`）

- [x] **Users**: 5名分を INSERT（`created_at` を開始日時で明示、`supabase_user_id` に実 UUID）
- [x] **MorningPages**: シナリオ別に投入（`character_count` = content 実文字数）
  - [x] user1: 第1〜2週に飛び飛び（6件）
  - [x] user2: 直近2日分のみ（150 / 230 文字）
  - [x] user3: 第1〜3週 高頻度・1000文字前後 / 第4〜5週 週1〜2回・300文字程度（21件）
  - [x] user4: 毎日入力＋境界値（1文字 / 空白改行のみ=3文字 / 4200文字）（15件）
  - [x] user5: 84日中78件（約93%）・1200〜1500文字
- [x] **ArtistDates**: `week_number` 1〜12、`went_out`/`excited` は 0/1
  - [x] user1: 第1・2週（1,1）
  - [x] user2: なし
  - [x] user3: 実施(1,1) / 外出のみ(1,0) / 未実施(なし) を混在
  - [x] user4: 各週 `went_out=0, excited=0`
  - [x] user5: 第1〜12週すべて（大半 達成=1）
- [x] **Progress**: 完了週ごとに `morning_page_done` / `artist_date_done` を投入

## 2. 投入・実行

- [x] スキーマ適用（`npm run d1:migrate` 相当）
- [x] テストデータ投入（`npm run d1:seed`）
- [x] ⚠️ **persist-to パスを dev サーバと一致させる**こと
      （docker-compose の `wrangler dev --persist-to /app/.wrangler` と同じ DB を指す）

```bash
# 再投入（dev サーバが読む DB に対して）
docker compose exec workers npm run d1:seed
# スキーマごとリセットして再投入
docker compose exec workers npm run d1:reset
```

## 3. 検証

- [x] `GET /api/progress` の `current_week` / `current_day` を実 JWT で確認
  - [x] user1 → week 3 / day 15 ✅
  - [x] user3 → week 6 / day 39 ✅
  - [x] user5 → week 12 / day 84（cap）✅
- [x] user4 の境界値 `character_count` が content 長と一致（1 / 3 / 4200）✅
- [ ] ブラウザ（http://localhost:5173）で各ユーザーログイン後の UI 目視確認
  - [ ] user2 初期表示、user3 ヒートマップ虫食い、user4 UI崩れ、user5 最大実績
- [ ] `GET /api/statistics` の集計（週次グラフ・ヒートマップ・AD軌跡）確認

## メモ / 既知の注意点

- 週・日の計算は `Users.created_at` 起点（マイグレーション日ではない）。
- `current_week` は 12、`current_day` は 84 で cap される。
- `ArtistDates.week_number` は CHECK(1〜12)。第13週は作成不可。
- ユーザー紐付けキーは `supabase_user_id`（JWT `sub`）。`Users.id` は内部キー。
- ⚠️ **D1 の永続化パス問題**: `wrangler dev` は `--persist-to /app/.wrangler`（→ `.wrangler/v3/d1`）を使用。
  `wrangler d1 execute --local` を **persist-to 無し**で実行すると別 DB（`.wrangler/state/v3/d1`）に書き込まれ、
  dev サーバから見えない。必ず `--persist-to .wrangler` を付ける（`npm run d1:seed` は対応済み）。
