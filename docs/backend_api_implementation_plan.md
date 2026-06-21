# バックエンドAPI実装計画書

## 実装日
2026-06-22

## 目的
todo.md セクション3「バックエンド API 実装」の全8タスクを完了する。

---

## 1. 全体アーキテクチャ

### 現状の構造
```
workers/index.js (134行)
├── export default { async fetch() }  // メインハンドラー
├── verifySupabaseAuth()              // JWT検証（実装済み）
└── jsonResponse()                     // レスポンスヘルパー（実装済み）
```

### 実装後の構造
```
workers/index.js (約530行)
├── export default { async fetch() }  // メインハンドラー
├── verifySupabaseAuth()              // JWT検証（既存）
├── getOrCreateUser()                 // 新規: ユーザー管理
├── handleApiRequest()                // 新規: APIルーター
├── handleCreateMorningPage()         // 新規: POST /api/morning-pages
├── handleGetMorningPage()            // 新規: GET /api/morning-pages
├── handleCreateArtistDate()          // 新規: POST /api/artist-dates
├── handleGetArtistDate()             // 新規: GET /api/artist-dates
├── handleGetProgress()               // 新規: GET /api/progress
└── jsonResponse()                     // 既存（CORS対応を追加）
```

---

## 2. 実装詳細

### 2.1 ユーザー管理ヘルパー関数

#### `getOrCreateUser(db, supabase_user_id, email)`

**目的**: Supabase User IDから内部User IDを取得、存在しない場合は新規作成

**処理フロー**:
```
1. SELECT id FROM Users WHERE supabase_user_id = ?
2. 存在する → user_idを返す
3. 存在しない →
   a. user_id = "user_{timestamp}_{random}" を生成
   b. INSERT INTO Users
   c. 新しいuser_idを返す
```

**戻り値**: `string` (user_id)

**エラー処理**: try-catch で包み、エラーメッセージをスロー

**コード量**: 約30行

---

### 2.2 APIルーター関数

#### `handleApiRequest(request, env, pathname, userId, auth)`

**目的**: URLパスとHTTPメソッドに応じて適切なハンドラーを呼び出す

**ルーティング**:
```javascript
POST /api/morning-pages        → handleCreateMorningPage()
GET  /api/morning-pages        → handleGetMorningPage()
POST /api/artist-dates          → handleCreateArtistDate()
GET  /api/artist-dates          → handleGetArtistDate()
GET  /api/progress              → handleGetProgress()
GET  /api/                      → テスト用レスポンス
その他                          → 404エラー
```

**エラー処理**: 全体をtry-catchで包み、500エラーを返す

**コード量**: 約80行

---

### 2.3 モーニングページAPI

#### `POST /api/morning-pages`

**リクエスト**:
```json
{
  "content": "今日の朝の思考..."
}
```

**処理フロー**:
```
1. リクエストボディをパース
2. contentが空でないかバリデーション
3. entry_date = 今日の日付（YYYY-MM-DD）
4. character_count = content.length
5. 既存レコードをチェック (user_id + entry_date)
6. 存在する → UPDATE
   存在しない → INSERT
7. 成功レスポンスを返す
```

**レスポンス**:
```json
{
  "ok": true,
  "message": "Morning page saved successfully",
  "data": {
    "entry_date": "2026-06-22",
    "character_count": 1234
  }
}
```

**バリデーション**:
- content: 必須、空文字不可
- 最大文字数制限なし（将来的に追加可能）

**エラーケース**:
- 400: contentが空
- 500: DB操作失敗

**コード量**: 約60行

---

#### `GET /api/morning-pages?date=YYYY-MM-DD`

**クエリパラメータ**:
- `date`: オプショナル、デフォルト = 今日

**処理フロー**:
```
1. dateパラメータを取得（なければ今日）
2. SELECT FROM MorningPages WHERE user_id = ? AND entry_date = ?
3. 結果を返す（なければnull）
```

**レスポンス（存在する場合）**:
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "entry_date": "2026-06-22",
    "content": "今日の朝の思考...",
    "character_count": 1234,
    "created_at": "2026-06-22T01:23:45",
    "updated_at": "2026-06-22T01:23:45"
  }
}
```

**レスポンス（存在しない場合）**:
```json
{
  "ok": true,
  "message": "No morning page found for this date",
  "data": null
}
```

**エラーケース**:
- 500: DB操作失敗

**コード量**: 約40行

---

### 2.4 アーティストデートAPI

#### `POST /api/artist-dates`

**リクエスト**:
```json
{
  "week_number": 3,
  "went_out": true,
  "excited": false
}
```

**処理フロー**:
```
1. リクエストボディをパース
2. week_numberのバリデーション（1-12）
3. Boolean値を0/1に変換
4. 既存レコードをチェック (user_id + week_number)
5. 存在する → UPDATE
   存在しない → INSERT
6. 成功レスポンスを返す
```

**レスポンス**:
```json
{
  "ok": true,
  "message": "Artist date saved successfully",
  "data": {
    "week_number": 3,
    "went_out": true,
    "excited": false
  }
}
```

**バリデーション**:
- week_number: 必須、1-12の範囲
- went_out: Boolean（デフォルト false）
- excited: Boolean（デフォルト false）

**エラーケース**:
- 400: week_numberが範囲外
- 500: DB操作失敗

**コード量**: 約70行

---

#### `GET /api/artist-dates?week_number=N`

**クエリパラメータ**:
- `week_number`: 必須

**処理フロー**:
```
1. week_numberパラメータを取得
2. パラメータが存在するかチェック
3. SELECT FROM ArtistDates WHERE user_id = ? AND week_number = ?
4. 結果を返す（0/1をBoolean値に変換）
```

**レスポンス（存在する場合）**:
```json
{
  "ok": true,
  "data": {
    "id": 5,
    "week_number": 3,
    "went_out": true,
    "excited": false,
    "created_at": "2026-06-15T10:20:30",
    "updated_at": "2026-06-22T11:30:40"
  }
}
```

**レスポンス（存在しない場合）**:
```json
{
  "ok": true,
  "message": "No artist date found for this week",
  "data": null
}
```

**エラーケース**:
- 400: week_numberパラメータなし
- 500: DB操作失敗

**コード量**: 約50行

---

### 2.5 進捗API

#### `GET /api/progress`

**目的**: ユーザーホームで表示する週次進捗情報を返す

**処理フロー**:
```
1. ユーザー作成日を取得
2. 現在の週番号を計算（作成日からの経過日数 ÷ 7 + 1、最大12）
3. 今週のモーニングページ数を取得（過去7日間）
4. 今週のアーティストデート情報を取得
5. 進捗情報を返す
```

**週番号の計算方法**:
```javascript
const daysSinceCreation = (今日 - 作成日) / (24時間)
const currentWeek = Math.min(Math.floor(daysSinceCreation / 7) + 1, 12)
```

**レスポンス**:
```json
{
  "ok": true,
  "data": {
    "current_week": 3,
    "morning_pages_this_week": 5,
    "morning_page_done": false,
    "artist_date_done": true,
    "artist_date_details": {
      "went_out": true,
      "excited": false
    }
  }
}
```

**フィールド説明**:
- `current_week`: 現在の週番号（1-12）
- `morning_pages_this_week`: 過去7日間のモーニングページ数
- `morning_page_done`: 7日以上書いたか
- `artist_date_done`: アーティストデートを記録したか
- `artist_date_details`: アーティストデートの詳細（なければnull）

**エラーケース**:
- 404: ユーザーが存在しない
- 500: DB操作失敗

**コード量**: 約70行

---

### 2.6 エラーハンドリング

#### 統一レスポンス形式

**成功時**:
```json
{
  "ok": true,
  "message": "...",
  "data": { ... }
}
```

**エラー時**:
```json
{
  "ok": false,
  "message": "エラーメッセージ",
  "error": "詳細なエラー情報（開発用）"
}
```

#### HTTPステータスコード
- 200: 成功
- 400: バリデーションエラー
- 401: 認証エラー（既存）
- 404: リソースが見つからない
- 500: サーバーエラー

---

### 2.7 CORS対応

#### jsonResponse関数の拡張

**追加ヘッダー**:
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

**影響**: フロントエンドからのAPIアクセスが可能になる

---

## 3. データフロー図

### POST /api/morning-pages
```
[Client] 
  ↓ POST + JWT Token + { content }
[Workers: verifySupabaseAuth]
  ↓ Supabase User ID
[Workers: getOrCreateUser]
  ↓ Internal User ID
[Workers: handleCreateMorningPage]
  ↓ SELECT (既存チェック)
[D1 Database]
  ↓ 存在する？
[Workers: UPDATE または INSERT]
  ↓
[D1 Database]
  ↓ 成功
[Client] ← { ok: true, data: {...} }
```

### GET /api/progress
```
[Client]
  ↓ GET + JWT Token
[Workers: verifySupabaseAuth]
  ↓ Supabase User ID
[Workers: getOrCreateUser]
  ↓ Internal User ID
[Workers: handleGetProgress]
  ↓ SELECT user.created_at
[D1 Database]
  ↓ 作成日
[Workers: 週番号計算]
  ↓ SELECT MorningPages (過去7日)
[D1 Database]
  ↓ モーニングページ数
[Workers: SELECT ArtistDates (current week)]
[D1 Database]
  ↓ アーティストデート情報
[Workers: レスポンス作成]
  ↓
[Client] ← { ok: true, data: { progress } }
```

---

## 4. テスト計画

### 4.1 単体テスト（curlコマンド）

#### Test 1: ユーザー作成（自動）
```bash
# 初回APIアクセス時に自動作成される
curl -X GET http://localhost:8787/api/ \
  -H "Authorization: Bearer {valid-jwt}"
```
**期待結果**: user_idが返される

#### Test 2: モーニングページ作成
```bash
curl -X POST http://localhost:8787/api/morning-pages \
  -H "Authorization: Bearer {valid-jwt}" \
  -H "Content-Type: application/json" \
  -d '{"content":"今日の朝の思考..."}'
```
**期待結果**: 200 + 保存成功メッセージ

#### Test 3: モーニングページ取得
```bash
curl -X GET "http://localhost:8787/api/morning-pages?date=2026-06-22" \
  -H "Authorization: Bearer {valid-jwt}"
```
**期待結果**: 200 + データ取得

#### Test 4: アーティストデート作成
```bash
curl -X POST http://localhost:8787/api/artist-dates \
  -H "Authorization: Bearer {valid-jwt}" \
  -H "Content-Type: application/json" \
  -d '{"week_number":1,"went_out":true,"excited":false}'
```
**期待結果**: 200 + 保存成功メッセージ

#### Test 5: アーティストデート取得
```bash
curl -X GET "http://localhost:8787/api/artist-dates?week_number=1" \
  -H "Authorization: Bearer {valid-jwt}"
```
**期待結果**: 200 + データ取得

#### Test 6: 進捗取得
```bash
curl -X GET http://localhost:8787/api/progress \
  -H "Authorization: Bearer {valid-jwt}"
```
**期待結果**: 200 + 進捗情報

### 4.2 エラーケーステスト

#### Test 7: 空のcontent
```bash
curl -X POST http://localhost:8787/api/morning-pages \
  -H "Authorization: Bearer {valid-jwt}" \
  -H "Content-Type: application/json" \
  -d '{"content":""}'
```
**期待結果**: 400 + バリデーションエラー

#### Test 8: 範囲外のweek_number
```bash
curl -X POST http://localhost:8787/api/artist-dates \
  -H "Authorization: Bearer {valid-jwt}" \
  -H "Content-Type: application/json" \
  -d '{"week_number":13,"went_out":true,"excited":false}'
```
**期待結果**: 400 + バリデーションエラー

#### Test 9: 認証なし
```bash
curl -X GET http://localhost:8787/api/progress
```
**期待結果**: 401 + 認証エラー

---

## 5. テストデータ挿入スクリプト

### スクリプト概要
テスト用のダミーデータを簡単に挿入できるSQLスクリプトを作成。

**ファイル**: `migrations/test_data.sql`

**内容**:
```sql
-- テストユーザー
INSERT INTO Users (id, supabase_user_id, email, created_at, last_active_at)
VALUES ('test-user-1', 'test-supabase-id-1', 'test@example.com', datetime('now', '-14 days'), datetime('now'));

-- テスト用モーニングページ（過去2週間分）
INSERT INTO MorningPages (user_id, entry_date, content, character_count, created_at, updated_at)
VALUES 
  ('test-user-1', date('now', '-7 days'), 'Day 1 morning page', 20, datetime('now', '-7 days'), datetime('now', '-7 days')),
  ('test-user-1', date('now', '-6 days'), 'Day 2 morning page', 20, datetime('now', '-6 days'), datetime('now', '-6 days')),
  ('test-user-1', date('now', '-5 days'), 'Day 3 morning page', 20, datetime('now', '-5 days'), datetime('now', '-5 days'));

-- テスト用アーティストデート
INSERT INTO ArtistDates (user_id, week_number, went_out, excited, created_at, updated_at)
VALUES 
  ('test-user-1', 1, 1, 0, datetime('now', '-7 days'), datetime('now', '-7 days')),
  ('test-user-1', 2, 1, 1, datetime('now'), datetime('now'));
```

**実行方法**:
```bash
docker-compose exec workers npx wrangler d1 execute ast_way_db --local --file=./migrations/test_data.sql
```

---

## 6. 実装順序

### Step 1: ヘルパー関数（5分）
- `getOrCreateUser()` を追加
- 簡単なテストで動作確認

### Step 2: APIルーター（5分）
- `handleApiRequest()` を追加
- ルーティングロジックの確認

### Step 3: モーニングページAPI（10分）
- `handleCreateMorningPage()` を追加
- `handleGetMorningPage()` を追加
- curlでテスト

### Step 4: アーティストデートAPI（10分）
- `handleCreateArtistDate()` を追加
- `handleGetArtistDate()` を追加
- curlでテスト

### Step 5: 進捗API（10分）
- `handleGetProgress()` を追加
- 週番号計算ロジックの確認
- curlでテスト

### Step 6: CORS対応（5分）
- `jsonResponse()` にヘッダー追加
- フロントエンドからのアクセステスト

### Step 7: テストスクリプト（5分）
- `test_data.sql` を作成
- 実行して確認

### Step 8: ドキュメント更新（5分）
- todo.mdを更新
- gen_logs/4を作成

**合計**: 約55分

---

## 7. リスクと対応策

### リスク1: D1のトランザクション制約
**対応**: UPSERTロジックで既存チェック→UPDATE/INSERT

### リスク2: 日付計算のタイムゾーン
**対応**: ISO 8601形式を使用、UTCベース

### リスク3: 週番号の計算ロジック
**対応**: シンプルな計算方式（日数 ÷ 7）、将来的に改善可能

### リスク4: 大量データのパフォーマンス
**対応**: 初期段階では問題なし、将来的にインデックス最適化

---

## 8. 今後の拡張可能性

### フェーズ2の機能候補
- `DELETE /api/morning-pages?date=` - 削除機能
- `GET /api/morning-pages/list?from=&to=` - 期間取得
- `PATCH /api/artist-dates` - 部分更新
- `GET /api/statistics` - 統計情報
- レート制限
- ページネーション

---

## 9. レビューポイント

### ✅ 確認してほしい点
1. APIエンドポイントの設計は適切か？
2. エラーハンドリングは十分か？
3. セキュリティ上の懸念はないか？
4. データベース操作は適切か（N+1問題等）？
5. 週番号計算のロジックは妥当か？

### 📝 変更提案があれば
- エンドポイントのURL構造
- リクエスト/レスポンス形式
- バリデーションルール
- エラーメッセージ
- その他の要件

---

## 10. 承認後のアクション

### 承認された場合
1. workers/index.jsを段階的に更新
2. 各ステップでテスト実行
3. 問題があれば即座に報告
4. 完了後、todo.mdを更新
5. gen_logs/4を作成

### 変更要求がある場合
1. フィードバックを反映
2. 修正版の計画書を作成
3. 再度レビュー

---