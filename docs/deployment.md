# デプロイメントガイド

## 概要

このアプリケーションは以下の構成でデプロイされます：

- **フロントエンド（React + Vite）**: Cloudflare Pages
- **バックエンド（Workers + D1）**: Cloudflare Workers
- **認証**: Supabase Auth

## 前提条件

- Cloudflareアカウント
- Supabaseプロジェクト（認証用）
- Wrangler CLI（Cloudflare Workers用）
- Node.js 18以上

## 1. Supabaseセットアップ

### 1.1 プロジェクト作成

1. [Supabase Dashboard](https://app.supabase.com/) にアクセス
2. 新規プロジェクトを作成
3. プロジェクトURLとAnon Keyを取得

### 1.2 認証設定

1. Authentication → Providers で以下を設定：
   - **Email**: 有効化
   - **Google OAuth** (オプション): 有効化してクライアントIDとシークレットを設定

2. Authentication → URL Configuration:
   - Site URL: `https://your-app.pages.dev`
   - Redirect URLs に以下を追加:
     - `https://your-app.pages.dev/login`
     - `http://localhost:5173/login` (開発用)

### 1.3 JWTシークレット取得

Settings → API → JWT Settings から以下を取得：
- JWT Secret（Workers環境変数に使用）

## 2. Cloudflare Workersデプロイ

### 2.1 D1データベース作成

```bash
# D1データベースを作成
wrangler d1 create ast_way_db

# database_id をメモする
# 出力例: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2.2 wrangler.toml更新

`wrangler.toml`を編集してdatabase_idを設定：

```toml
[[d1_databases]]
binding = "DB"
database_name = "ast_way_db"
database_id = "YOUR_DATABASE_ID_HERE"  # 上記で取得したID
```

### 2.3 データベースマイグレーション

```bash
# スキーマを適用
wrangler d1 execute ast_way_db --remote --file=./migrations/001_create_tables.sql

# テストデータを投入（オプション）
wrangler d1 execute ast_way_db --remote --file=./migrations/test_data.sql
```

### 2.4 Workers環境変数設定

```bash
# Supabase JWT Secretを設定
wrangler secret put SUPABASE_JWT_SECRET
# プロンプトでJWT Secretを入力

# Supabase URLを設定
wrangler secret put SUPABASE_URL
# 例: https://xxxxxxxx.supabase.co

# CORS許可オリジンを設定
wrangler secret put CORS_ALLOWED_ORIGIN
# 本番フロントエンドのURL（例: https://your-app.pages.dev）
```

### 2.5 Workersデプロイ

```bash
# Workersをデプロイ
wrangler deploy

# デプロイ後のURLをメモ
# 例: https://my-page-test.your-subdomain.workers.dev
```

## 3. Cloudflare Pagesデプロイ

### 3.1 環境変数設定

Cloudflare Pages Dashboard → Settings → Environment variables で以下を設定：

**本番環境（Production）:**
- `VITE_SUPABASE_URL`: `https://xxxxxxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
- `VITE_API_BASE_URL`: `https://my-page-test.your-subdomain.workers.dev`

**プレビュー環境（Preview）（オプション）:**
- 同様の値を設定（テスト用のSupabaseプロジェクトを使用することを推奨）

### 3.2 ビルド設定

Cloudflare Pages Dashboard → Settings → Builds & deployments:

```
Build command: npm run build
Build output directory: dist
Root directory: /
Node version: 18
```

### 3.3 デプロイ

**方法1: GitHubからの自動デプロイ（推奨）**

1. Cloudflare Pages Dashboard → Create a project
2. GitHubリポジトリを接続
3. ビルド設定を入力
4. Deploy site

**方法2: Wranglerによる手動デプロイ**

```bash
# ビルド
npm run build

# Pagesにデプロイ
wrangler pages deploy dist --project-name=my-page-test
```

## 4. 動作確認

### 4.1 基本動作確認

1. `https://your-app.pages.dev` にアクセス
2. ログインページでメール認証を試す
3. ホーム画面が表示されることを確認
4. モーニングページを作成して保存
5. アーティストデートを記録

### 4.2 API接続確認

ブラウザの開発者ツール（F12）→ Networkタブで以下を確認：

- `/api/progress`: 200 OK
- `/api/morning-pages`: POST 200 OK
- `/api/artist-dates`: POST 200 OK

### 4.3 認証確認

- ログイン/ログアウトが正常に動作
- 未認証時に保護されたページにアクセスすると `/login` にリダイレクト
- セッションが維持される（ページリロード後もログイン状態）

## 5. トラブルシューティング

### 5.1 CORSエラー

**症状:** ブラウザコンソールに「CORS policy」エラー

**解決策:**
```bash
# Workers側でCORS_ALLOWED_ORIGINを正しく設定
wrangler secret put CORS_ALLOWED_ORIGIN
# フロントエンドの完全なURL（例: https://your-app.pages.dev）
```

### 5.2 認証エラー（401 Unauthorized）

**症状:** API呼び出しが401エラーを返す

**原因と解決策:**

1. **JWT Secretが正しく設定されていない**
   ```bash
   wrangler secret put SUPABASE_JWT_SECRET
   # SupabaseのJWT Secretを正確に入力
   ```

2. **Supabase URLが間違っている**
   - フロントエンド: `VITE_SUPABASE_URL`が正しいか確認
   - Workers: `SUPABASE_URL`が正しいか確認

3. **トークンの有効期限切れ**
   - ログアウトして再ログイン

### 5.3 API_BASE_URLが見つからない

**症状:** フロントエンドがlocalhostに接続しようとする

**解決策:**
```bash
# Cloudflare Pages環境変数を確認
VITE_API_BASE_URL=https://your-workers.workers.dev
```

### 5.4 D1データベースが空

**症状:** データ取得時に「No data found」エラー

**解決策:**
```bash
# マイグレーションを再実行
wrangler d1 execute ast_way_db --remote --file=./migrations/001_create_tables.sql
```

## 6. ローカル開発環境

### 6.1 .env設定

プロジェクトルートに `.env` を作成：

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8787
SAMPLE_USER_NAME=user@example.com
SAMPLE_USER_PASSWORD=your-password
```

### 6.2 Docker起動

```bash
# 開発環境起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down
```

### 6.3 アクセスURL

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:8787

### 6.4 統合テスト実行

```bash
# テストスクリプト実行
docker-compose exec web sh -c "export \$(cat .env | grep -v '^#' | xargs) && node integration-test.js"
```

## 7. 本番環境URL構成例

```
フロントエンド: https://artists-way.pages.dev
バックエンド:   https://artists-way-api.your-subdomain.workers.dev
認証:          https://your-project.supabase.co
データベース:   Cloudflare D1
```

## 8. セキュリティ考慮事項

### 8.1 環境変数の管理

- `.env` ファイルは **絶対に** Gitにコミットしない
- `.gitignore` に `.env` が含まれていることを確認
- 本番環境の環境変数はCloudflare Dashboard経由でのみ設定

### 8.2 JWT Secret

- Supabase JWT Secretは **絶対に公開しない**
- Workers環境変数（Secret）として安全に保存
- 定期的にローテーション（Supabase Dashboard → API → Generate new secret）

### 8.3 CORS設定

- `CORS_ALLOWED_ORIGIN` は特定のドメインのみを許可
- ワイルドカード（`*`）は開発時のみ使用

### 8.4 データベースアクセス

- D1データベースはWorkers経由でのみアクセス
- 直接的な外部アクセスは不可（Cloudflareのセキュリティ）

## 9. モニタリング

### 9.1 Cloudflare Analytics

- Cloudflare Dashboard → Workers → Analytics でリクエスト数を確認
- エラー率、レスポンスタイムを監視

### 9.2 Supabase Analytics

- Supabase Dashboard → Auth → Users で認証状況を確認
- API使用量を監視

### 9.3 ログ確認

```bash
# Workersのログをリアルタイム表示
wrangler tail

# 特定のデプロイメントのログ
wrangler tail --environment production
```

## 10. コスト見積もり

### Cloudflare（Free Tier）
- Workers: 100,000リクエスト/日まで無料
- Pages: 無制限ビルド、500ビルド/月
- D1: 5GB storage、5M行read/day無料

### Supabase（Free Tier）
- 500MB database
- 50,000 monthly active users
- 2GB bandwidth

**推定コスト: $0/月** （小規模利用の場合）

## 11. 次のステップ

- [ ] カスタムドメイン設定
- [ ] Google OAuth設定
- [ ] 週次レポートメール機能追加
- [ ] パフォーマンス最適化
- [ ] エラートラッキング（Sentry等）
- [ ] CI/CDパイプライン構築

## 参考リンク

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Wrangler CLI リファレンス](https://developers.cloudflare.com/workers/wrangler/)
