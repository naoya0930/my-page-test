# Supabase JWT 検証テスト結果

## 実装日
2026-06-22

## 概要
Cloudflare Workers上でSupabase Auth JWTトークンを検証する機能の雛形を実装しました。

## 実装内容

### 1. JWT検証機能（workers/index.js）
- **JWTデコード**: base64デコードでペイロード取得
- **有効期限チェック**: `exp`クレームを検証
- **ユーザーID取得**: `sub`クレーム（Supabase User ID）を抽出
- **エラーハンドリング**: 各種エラーケースに対応

### 2. 環境変数設定
- `.dev.vars`: `SUPABASE_JWT_SECRET` を追加
- `wrangler.toml`: コメントでドキュメント化

## テスト結果

### Test 1: 認証ヘッダーなし
```bash
curl -X GET http://localhost:8787/api/
```
**結果**: ✅ PASS
```json
{"ok":false,"message":"Authorization header is required"}
```

### Test 2: 無効なトークン形式
```bash
curl -X GET http://localhost:8787/api/ -H "Authorization: Bearer invalid-token"
```
**結果**: ✅ PASS
```json
{"ok":false,"message":"Invalid JWT format"}
```

### Test 3: 有効なJWT（未来の有効期限）
```bash
curl -X GET http://localhost:8787/api/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.fake-signature"
```
**結果**: ✅ PASS
```json
{"ok":true,"message":"API base route","d1_connected":true,"user":{"supabase_user_id":"test-user-123"}}
```

### Test 4: 期限切れトークン
```bash
curl -X GET http://localhost:8787/api/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxfQ.fake-signature"
```
**結果**: ✅ PASS
```json
{"ok":false,"message":"Token has expired"}
```

## 検証項目

| テストケース | 期待結果 | 実際の結果 | ステータス |
|------------|---------|-----------|----------|
| 認証ヘッダーなし | 401エラー | 401 "Authorization header is required" | ✅ |
| Bearer形式でない | 401エラー | 401 "Bearer token is required" | ✅ |
| 無効なJWT形式 | 401エラー | 401 "Invalid JWT format" | ✅ |
| 期限切れトークン | 401エラー | 401 "Token has expired" | ✅ |
| 有効なトークン | 200成功 + user_id | 200 + {"supabase_user_id":"test-user-123"} | ✅ |

## 今後の改善点

### 本番環境向けの追加実装が必要
1. **署名検証**: 現在は署名検証を行っていません
   - Supabase JWTシークレットまたは公開鍵を使用した署名検証
   - `jose`ライブラリ等を使用した実装を推奨

2. **追加検証項目**:
   - `aud` (audience) クレームの検証
   - `iss` (issuer) クレームの検証
   - `iat` (issued at) の検証

3. **セキュリティ強化**:
   - レート制限
   - トークンのブラックリスト管理

## 使用方法

### フロントエンドからの呼び出し
```javascript
const response = await fetch('http://localhost:8787/api/', {
  headers: {
    'Authorization': `Bearer ${supabaseAccessToken}`
  }
});
```

### Supabase クライアントとの統合
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  const response = await fetch('/api/', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
}
```

## まとめ
基本的なJWT検証の雛形実装が完了しました。本番環境では署名検証の実装が必須です。
