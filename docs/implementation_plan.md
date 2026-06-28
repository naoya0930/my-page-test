# 実装計画書

> **更新日**: 2026年6月28日  
> **ベース**: `docs/system_design.md`（要件定義書 v2.2）+ `docs/screen_spec.md`（画面仕様書 v2.3）

このドキュメントは `system_design.md` をベースに、実装対象の画面とAPIを一覧化したものです。spec2（統計・タイムトラベル）、spec3（サインアップ・dayX編集）、spec4（規約同意・完遂演出・UI改善）までの内容を反映しています。

> **spec4 の実装範囲メモ**: spec4 の追加要件はいずれも**フロントエンド完結**（規約同意チェック、完遂モーダル、本日 Day 表記、X/7 表記、ナビ視認性、保存トースト、統計の日次選択→詳細遷移、軌跡の 〇/✕ 表記）であり、新規バックエンドAPI / スキーマ変更は不要。完遂判定は既存 `GET /api/progress` の `current_day` を再利用する。

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

### 1.2 ログイン・アカウント作成画面
**パス:** `/login`  
**認証:** 不要

**主要機能:**
- ログイン / 新規アカウント作成のモード切り替えタブ
- ログインフォーム（メール / パスワード、Google OIDC）
- アカウント作成フォーム（メール / パスワード / パスワード確認）
- **利用規約・プライバシーポリシー同意チェックボックス（spec4）**: 未同意時は登録ボタンを非活性、押下時はバリデーションエラー表示
- クライアントバリデーション（メール形式、パスワード一致、利用規約同意）
- サインアップ成功時に確認メール案内表示、または自動ログイン
- 認証成功時にユーザーホームへ遷移
- 認証失敗時にエラーメッセージを表示

**遷移先:**
- `/home` （ログイン成功時 / サインアップ後の自動ログイン時）

**API呼び出し:**
- フロントエンドは Supabase Auth クライアントを用いてログインし、アクセストークン / セッションを取得する
- API 認証は Cloudflare Workers 上で Supabase JWT を検証し、認証ユーザーの `supabase_user_id` を取得して処理を行う

---

### 1.3 ユーザーホーム画面
**パス:** `/home`  
**認証:** 必須

**主要機能:**
- 全体進捗インジケーター「本日: Day X / 84」の表示（spec4 で「本日:」ラベルを付与）
- 現在の週次表示（「現在第◯週目」）＋週次タイムトラベル（左右切り替え）
- **ナビゲーションの視認性向上（spec4）**: 週移動ボタン（`<` / `>`）の可視性向上、「現在の週に戻る」ボタン（過去/未来週の閲覧中のみ・プライマリカラー）
- 7日間のドットグリッド（Day1〜Day7、文字数表示、クリック可能）＋**今週の達成日数「X/7」テキスト併記（spec4）**
- dayX クリックで対象日のモーニングページ編集へ遷移
  - 過去日クリック時は確認ダイアログ（「過去のページです。編集を開始してよろしいですか？」）を経由
  - 未来日はロック（遷移不可）
- アーティストデートへのリンク
- 今日/今週のタスク完了状況チェックリスト
  - モーニングページ入力済み（当日分）
  - アーティストデート完了（今週分）
- **保存完了トースト通知（spec4）**: `/morning-page` 保存後のリダイレクト直後に「モーニングページを保存しました」を数秒間表示
- **プログラム完遂モーダル（spec4）**: 経過日数が Day 84 到達時、ログイン直後/ホーム遷移時に祝福モーダル（紙吹雪演出）を表示（毎回表示・フラグ保存なし）
- ※ モーニングページを保存（書き込み）した日は日次ステータスを「完了」に更新する

**遷移先:**
- `/morning-page?date=YYYY-MM-DD` （dayX クリック時）
- `/morning-page` （当日のモーニングページ画面）
- `/artist-date` （アーティストデート画面）
- `/statistics` （統計画面）

**API呼び出し:**
- `GET /api/progress?week_number=N` （週次進捗取得。完遂判定に `current_day` を利用）

---

### 1.4 モーニングページ画面
**パス:** `/morning-page`  
**認証:** 必須

**主要機能:**
- 対象日タイトル表示（「Day X のモーニングページ」/ 日付）。`?date=YYYY-MM-DD` 指定時はその日付、未指定時は当日
- マルチラインテキストエリア
- リアルタイム文字数カウント表示
- 保存ボタン
- 保存成功時は `/home` へ自動リダイレクト、失敗時はエラーメッセージ表示（画面に留まる）
- 対象日の既存データがあれば読み込み

**バリデーション:**
- テキストが空の場合は保存不可

**遷移先:**
- `/home` （保存成功後、自動リダイレクト）

**API呼び出し:**
- `GET /api/morning-pages?date=YYYY-MM-DD` （対象日データ取得）
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

### 1.6 統計画面（spec2 新規）
**パス:** `/statistics`  
**認証:** 必須

**主要機能:**
- 12週間総合サマリーカード（総執筆日数、累計総文字数、アーティストデート達成率）
- 12週間の執筆文字数推移グラフ（Week 1〜12、未到達週は Pending/非表示）
- 日次アクティビティヒートマップ（12週×7日＝84マス、GitHub草風、ホバーで詳細）
- アーティストデート軌跡（spec4：実施=「〇」アクセントカラー、未実施=「✕」グレー）
- **日次データの選択と詳細確認（spec4）**: カレンダー/リストの各日をラジオ的に単一選択 →「詳細」ボタンで該当日の `/morning-page?date=YYYY-MM-DD` へ遷移

**遷移先:**
- `/morning-page?date=YYYY-MM-DD` （日付選択→詳細）
- `/home` （ホームへ戻る）

**API呼び出し:**
- `GET /api/statistics` （12週間集計データ取得）

---

## 2. API一覧

### 2.1 認証関連API

#### 認証API
**実装方式:** Supabase Auth を利用
**詳細:**
- フロントエンドで Supabase クライアントを初期化し、ログイン・ログアウトを実行する
- 毎回 API へリクエストする際は、Supabase のアクセストークンを Authorization ヘッダーに含める
- Cloudflare Workers は Supabase JWT を検証し、認証ユーザーの `supabase_user_id` を取得して API 処理を実行する
- アプリ独自の `Users` テーブルには `supabase_user_id` を保存し、ユーザー固有データと紐付ける

---

### 2.2 モーニングページ関連API

#### モーニングページ保存
**メソッド:** `POST`  
**パス:** `/api/morning-pages`  
**認証:** 必須

**リクエストボディ:**
```json
{
  "entry_date": "YYYY-MM-DD",
  "content": "string",
  "character_count": 1234
}
```

**補足:**
- `user_id` はクライアント送信ではなく、認証トークンから Workers 側で解決する

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
  "week_number": 1,
  "went_out": true,
  "excited": false
}
```

**補足:**
- `user_id` は認証済みユーザーの情報から Workers 側で付与する

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

**クエリパラメータ:**
- `week_number`: 整数（指定週の日次状況を取得。省略時は現在週）

**レスポンス（成功）:**
```json
{
  "week_number": 3,
  "current_week": 3,
  "current_day": 17,
  "morning_pages_this_week": 3,
  "artist_date_done": false,
  "daily_status": [
    { "day": 1, "date": "2024-01-15", "done": true, "character_count": 750 },
    { "day": 2, "date": "2024-01-16", "done": true, "character_count": 820 },
    { "day": 3, "date": "2024-01-17", "done": true, "character_count": 680 },
    { "day": 4, "date": "2024-01-18", "done": false, "character_count": 0 },
    { "day": 5, "date": "2024-01-19", "done": false, "character_count": 0 },
    { "day": 6, "date": "2024-01-20", "done": false, "character_count": 0 },
    { "day": 7, "date": "2024-01-21", "done": false, "character_count": 0 }
  ],
  "artist_date": { "went_out": false, "excited": false }
}
```

**補足:**
- `current_week`: ユーザーの現在週次（1〜12）
- `current_day`: プログラム開始日からの経過日数（ホームの「本日: Day X / 84」表示、および spec4 完遂モーダル（Day 84 到達）の判定に利用）
- `morning_pages_this_week`: 表示週のモーニングページ達成日数（ホームの「X/7」表記に利用）
- `daily_status`: 表示週の7日間の日次ステータス（`done` / `character_count`）
- `artist_date`: 表示週のアーティストデート状態（`went_out` / `excited`）

---

### 2.5 統計関連API（spec2 新規）

#### 統計データ取得
**メソッド:** `GET`  
**パス:** `/api/statistics`  
**認証:** 必須

**レスポンス（成功）:**
```json
{
  "summary": {
    "total_days": 52,
    "total_days_possible": 84,
    "total_characters": 68500,
    "artist_date_weeks": 8,
    "artist_date_weeks_possible": 12
  },
  "weekly_stats": [
    { "week_number": 1, "total_characters": 5600, "days_written": 6 }
  ],
  "daily_activity": [
    { "date": "2024-01-01", "character_count": 750, "week_number": 1, "day_of_week": 1 }
  ],
  "artist_date_history": [
    { "week_number": 1, "went_out": true, "excited": true }
  ]
}
```

**補足:**
- バックエンドで週ごとの集計クエリ（`GROUP BY week_number`）を実行する軽量な集計エンドポイント
- 統計画面のサマリー / 週次グラフ / 84日ヒートマップ / アーティストデート軌跡（spec4：〇/✕ 表記）に利用
- 日次データの「詳細」遷移（spec4）は本APIではなく `/morning-page?date=` 側で取得する

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
3. Supabase Auth トークン検証機能の実装
4. `supabase_user_id` とアプリユーザーIDの紐付けを設計

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
- Cloudflare Workers 上で Supabase JWT / アクセストークン検証を実施
- `supabase_user_id` を `Users` テーブルの `supabase_user_id` と紐付け
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
