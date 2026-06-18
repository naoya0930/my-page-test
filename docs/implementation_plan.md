# 実装計画書

このドキュメントは `system_design.md` をベースに、実装対象の画面とAPIを一覧化したものです。

---

## 1. 画面一覧

### 1.1 LP (ランディングページ)
**パス:** `/`  
**認証:** 不要

**主要機能:**
- アプリ名と説明文の表示
- 12週間プログラムサポートの紹介
- 通知機能の説明（将来実装予定）
- ログインページへのCTAボタン

**遷移先:**
- `/login` （ログイン画面）

---

### 1.2 ログイン画面
**パス:** `/login`  
**認証:** 不要

**主要機能:**
- 認証フォームまたはボタンの表示
- 認証処理の実行
- 認証成功時にユーザーホームへ遷移
- 認証失敗時にエラーメッセージを表示

**遷移先:**
- `/home` （認証成功時）

**API呼び出し:**
- 認証API（実装詳細は未確定、Supabase Auth等を想定）

---

### 1.3 ユーザーホーム画面
**パス:** `/home`  
**認証:** 必須

**主要機能:**
- 現在の週次表示（「現在第◯週目」）
- モーニングページへのリンク
- アーティストデートへのリンク
- 今日/今週のタスク完了状況チェックリスト
  - モーニングページ入力済み（当日分）
  - アーティストデート完了（今週分）

**遷移先:**
- `/morning-page` （モーニングページ画面）
- `/artist-date` （アーティストデート画面）

**API呼び出し:**
- `GET /api/progress` （週次進捗取得）

---

### 1.4 モーニングページ画面
**パス:** `/morning-page`  
**認証:** 必須

**主要機能:**
- マルチラインテキストエリア
- リアルタイム文字数カウント表示
- 保存ボタン
- 保存成功/失敗メッセージ表示
- 当日の既存データがあれば読み込み

**バリデーション:**
- テキストが空の場合は保存不可

**遷移先:**
- `/home` （保存成功後）

**API呼び出し:**
- `GET /api/morning-pages?date=YYYY-MM-DD` （当日データ取得）
- `POST /api/morning-pages` （保存）

---

### 1.5 アーティストデート画面
**パス:** `/artist-date`  
**認証:** 必須

**主要機能:**
- 「今週出かけたか」チェックボックス
- 「わくわくしたか」チェックボックス
- 保存ボタン
- 保存成功/失敗メッセージ表示
- 今週の既存データがあれば読み込み

**バリデーション:**
- 未選択でも保存可能

**遷移先:**
- `/home` （保存成功後）

**API呼び出し:**
- `GET /api/artist-dates?week_number=N` （今週データ取得）
- `POST /api/artist-dates` （保存）

---

## 2. API一覧

### 2.1 認証関連API

#### 認証API
**実装方式:** 未確定（Supabase Auth連携を想定）  
**詳細:** 今後の実装フェーズで確定

---

### 2.2 モーニングページ関連API

#### モーニングページ保存
**メソッド:** `POST`  
**パス:** `/api/morning-pages`  
**認証:** 必須

**リクエストボディ:**
```json
{
  "user_id": "string",
  "entry_date": "YYYY-MM-DD",
  "content": "string",
  "character_count": 1234
}
```

**レスポンス（成功）:**
```json
{
  "ok": true,
  "message": "保存しました",
  "id": 123
}
```

**レスポンス（失敗）:**
```json
{
  "ok": false,
  "error": "エラーメッセージ"
}
```

---

#### モーニングページ取得
**メソッド:** `GET`  
**パス:** `/api/morning-pages`  
**認証:** 必須

**クエリパラメータ:**
- `date`: YYYY-MM-DD 形式（指定日付のデータを取得）

**レスポンス（成功）:**
```json
{
  "ok": true,
  "data": {
    "id": 123,
    "user_id": "string",
    "entry_date": "YYYY-MM-DD",
    "content": "string",
    "character_count": 1234,
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**レスポンス（データなし）:**
```json
{
  "ok": true,
  "data": null
}
```

---

### 2.3 アーティストデート関連API

#### アーティストデート保存
**メソッド:** `POST`  
**パス:** `/api/artist-dates`  
**認証:** 必須

**リクエストボディ:**
```json
{
  "user_id": "string",
  "week_number": 1,
  "went_out": true,
  "excited": false
}
```

**レスポンス（成功）:**
```json
{
  "ok": true,
  "message": "保存しました",
  "id": 456
}
```

**レスポンス（失敗）:**
```json
{
  "ok": false,
  "error": "エラーメッセージ"
}
```

---

#### アーティストデート取得
**メソッド:** `GET`  
**パス:** `/api/artist-dates`  
**認証:** 必須

**クエリパラメータ:**
- `week_number`: 整数（指定週のデータを取得）

**レスポンス（成功）:**
```json
{
  "ok": true,
  "data": {
    "id": 456,
    "user_id": "string",
    "week_number": 1,
    "went_out": true,
    "excited": false,
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**レスポンス（データなし）:**
```json
{
  "ok": true,
  "data": null
}
```

---

### 2.4 進捗関連API

#### 進捗状況取得
**メソッド:** `GET`  
**パス:** `/api/progress`  
**認証:** 必須

**レスポンス（成功）:**
```json
{
  "ok": true,
  "current_week": 3,
  "morning_page_done_today": true,
  "artist_date_done_this_week": false
}
```

**レスポンス（失敗）:**
```json
{
  "ok": false,
  "error": "エラーメッセージ"
}
```

**補足:**
- `current_week`: ユーザーの現在週次（1〜12）
- `morning_page_done_today`: 今日のモーニングページが保存済みか
- `artist_date_done_this_week`: 今週のアーティストデートが保存済みか

---

## 3. データフロー図（テキストベース）

### 3.1 ユーザーホーム画面のデータフロー

```
[ユーザーホーム画面]
    ↓ (画面表示時)
[GET /api/progress]
    ↓
[D1: MorningPages, ArtistDates テーブル]
    ↓ (集計・計算)
[レスポンス: current_week, morning_page_done_today, artist_date_done_this_week]
    ↓
[画面に表示]
```

---

### 3.2 モーニングページ画面のデータフロー

#### データ読み込み時
```
[モーニングページ画面]
    ↓ (画面表示時)
[GET /api/morning-pages?date=今日]
    ↓
[D1: MorningPages テーブル]
    ↓
[レスポンス: 既存データまたはnull]
    ↓
[テキストエリアに反映]
```

#### データ保存時
```
[モーニングページ画面]
    ↓ (保存ボタン押下)
[POST /api/morning-pages]
    ↓
[D1: MorningPages テーブルへINSERT/UPDATE]
    ↓
[レスポンス: 成功/失敗]
    ↓
[保存メッセージ表示]
```

---

### 3.3 アーティストデート画面のデータフロー

#### データ読み込み時
```
[アーティストデート画面]
    ↓ (画面表示時)
[GET /api/artist-dates?week_number=現在週]
    ↓
[D1: ArtistDates テーブル]
    ↓
[レスポンス: 既存データまたはnull]
    ↓
[チェックボックスに反映]
```

#### データ保存時
```
[アーティストデート画面]
    ↓ (保存ボタン押下)
[POST /api/artist-dates]
    ↓
[D1: ArtistDates テーブルへINSERT/UPDATE]
    ↓
[レスポンス: 成功/失敗]
    ↓
[保存メッセージ表示]
```

---

## 4. データベーステーブル一覧

### 4.1 Users
```sql
CREATE TABLE Users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  last_active_at DATETIME,
  auth_provider TEXT
);
```

**用途:** ユーザー情報管理

---

### 4.2 MorningPages
```sql
CREATE TABLE MorningPages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL,
  character_count INTEGER NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE(user_id, entry_date)
);
```

**用途:** モーニングページの日次記録

---

### 4.3 ArtistDates
```sql
CREATE TABLE ArtistDates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  went_out BOOLEAN NOT NULL DEFAULT 0,
  excited BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE(user_id, week_number)
);
```

**用途:** アーティストデートの週次記録

---

### 4.4 Progress
```sql
CREATE TABLE Progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  morning_page_done BOOLEAN NOT NULL DEFAULT 0,
  artist_date_done BOOLEAN NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL,
  UNIQUE(user_id, week_number)
);
```

**用途:** 週次進捗の集計キャッシュ（オプション）

**補足:** 
- 実装方法により、このテーブルは不要になる可能性あり
- リアルタイム計算でも対応可能

---

## 5. 実装優先順位

### Phase 1: バックエンド基盤
1. D1スキーマ定義（migrations作成）
2. Workers APIの雛形実装
3. 認証検証機能の実装

### Phase 2: バックエンドAPI実装
1. `POST /api/morning-pages`
2. `GET /api/morning-pages`
3. `POST /api/artist-dates`
4. `GET /api/artist-dates`
5. `GET /api/progress`

### Phase 3: フロントエンド共通基盤
1. ルーティング設定（React Router）
2. 認証状態管理（Context/Provider）
3. API呼び出しユーティリティ
4. 共通レイアウトコンポーネント

### Phase 4: フロントエンド画面実装
1. LP（最もシンプル）
2. ログイン画面
3. ユーザーホーム画面
4. モーニングページ画面
5. アーティストデート画面

### Phase 5: 結合テストと調整
1. 全画面遷移確認
2. データ保存・読み込み確認
3. エラーハンドリング確認
4. UI/UX調整

---

## 6. 技術スタック

### フロントエンド
- React 18.3
- TypeScript 5.6
- React Router 6.17
- Tailwind CSS 3.4
- Vite 7.0

### バックエンド
- Cloudflare Workers
- Cloudflare D1（SQLite互換）
- Wrangler 4.101

### 開発環境
- Docker + docker-compose
- Node.js 20

---

## 7. 未確定事項

### 認証方式
- Supabase Auth連携の詳細仕様
- 認証トークンの管理方法
- セッション管理の実装

### 週次計算ロジック
- ユーザーの開始日の決定方法
- 週番号の自動計算ルール
- 週開始日の扱い（月曜 or 日曜）

### 文字数制限
- モーニングページの最大文字数
- 制限を超えた場合の挙動

### 通知機能
- 実装時期と方式（将来フェーズ）
- ブラウザ通知 vs プッシュ通知

---

## 8. セキュリティ要件

### 認証・認可
- 全APIで認証必須
- `user_id`の検証と紐付け
- 他ユーザーデータへのアクセス防止

### データ保護
- モーニングページの内容は個人情報として扱う
- 通信はHTTPS必須
- XSS/CSRF対策

### 著作権配慮
- 書籍本文を一切表示しない
- UI文言は独自の説明で補完
- 抽象的な表現にとどめる

---

**作成日:** 2026/6/18  
**ベース文書:** `docs/system_design.md`
