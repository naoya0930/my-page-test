# データベースマイグレーション

このディレクトリには、Cloudflare D1データベースのマイグレーションファイルが含まれています。

## マイグレーションファイル一覧

### 001_create_tables.sql
初期テーブルの作成
- `Users`: ユーザー情報
- `MorningPages`: モーニングページの日次記録
- `ArtistDates`: アーティストデートの週次記録
- `Progress`: 週次進捗の集計キャッシュ（オプション）

## ローカル開発環境でのマイグレーション適用

### 前提条件
- Docker環境が起動していること
- wranglerが正しく設定されていること

### 方法1: wranglerコマンドを直接実行

```bash
# Dockerコンテナ内で実行
docker-compose exec workers npx wrangler d1 execute ast_way_db --local --file=./migrations/001_create_tables.sql
```

### 方法2: package.jsonのスクリプトを使用

```bash
# マイグレーションを適用
npm run d1:migrate

# または個別のファイルを実行
npm run d1:execute "$(cat migrations/001_create_tables.sql)"
```

### 方法3: D1 コンソールで対話的に実行

```bash
# D1 コンソールを開く
docker-compose exec workers npx wrangler d1 execute ast_way_db --local

# SQLファイルの内容をコピー&ペーストして実行
```

## マイグレーションの確認

```bash
# テーブル一覧を確認
docker-compose exec workers npx wrangler d1 execute ast_way_db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# 特定のテーブルのスキーマを確認
docker-compose exec workers npx wrangler d1 execute ast_way_db --local --command="PRAGMA table_info(Users);"
```

## 本番環境へのデプロイ

```bash
# 本番D1データベースにマイグレーションを適用
npx wrangler d1 execute ast_way_db --file=./migrations/001_create_tables.sql

# 注意: 本番環境では慎重に実行してください
```

## トラブルシューティング

### エラー: "database is locked"
- 別のプロセスがデータベースを使用している可能性があります
- wrangler devを再起動してください

### エラー: "table already exists"
- テーブルが既に存在しています
- `DROP TABLE IF EXISTS` を使用するか、マイグレーションファイルを調整してください

### データのリセット
ローカル開発環境でデータベースを完全にリセットする場合：

```bash
# .wranglerディレクトリを削除
rm -rf .wrangler

# Dockerボリュームをリセット
docker-compose down -v
docker-compose up --build
```

## マイグレーションファイルの作成ルール

1. ファイル名は `XXX_description.sql` の形式にする（XXXは連番）
2. 各マイグレーションは冪等性を保つ（複数回実行しても安全）
3. `IF NOT EXISTS` を使用してテーブル作成を安全にする
4. 外部キー制約とインデックスを適切に定義する
5. テーブル削除は慎重に行う（本番環境では特に注意）

## 参考リンク

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
