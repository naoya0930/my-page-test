# Wrangler + Docker 開発のベストプラクティス

## 現状の構成

このプロジェクトでは `docker-compose.yml` で以下の2サービスを起動している：

- `web` : Vite (React フロントエンド) - port 5173
- `workers` : Wrangler dev (Cloudflare Workers + D1) - port 8787

---

## ベストプラクティス

### 1. Wrangler はローカル直接起動が推奨

**Cloudflare 公式の推奨は Docker を使わず、ホストマシン上で直接 `wrangler dev` を実行すること。**

理由：
- Wrangler の `--local` モードは内部で [Miniflare](https://miniflare.dev/) を使い、既に isolate されたサンドボックス環境を提供する
- Docker 内で動かすと「コンテナの中でさらに別のサンドボックス」になり、二重のオーバーヘッドが発生する
- ファイルシステムの bind mount で node_modules の競合や権限問題が起きやすい

```bash
# ホスト上で直接起動（最もシンプルで確実）
npx wrangler dev --port 8787
```

---

### 2. Docker で動かす場合の注意点（このプロジェクトの現状）

チーム開発や CI で環境を統一するために Docker を使う場合の注意点：

#### ✅ `--persist-to` を必ず指定する

D1 のローカルデータを named volume に永続化する。指定しないと毎回データが消える。

```yaml
command: npx wrangler dev --ip 0.0.0.0 --port 8787 --persist-to /app/.wrangler
volumes:
  - wrangler_data:/app/.wrangler
```

#### ✅ マイグレーションは起動時に適用する

```yaml
command: >
  sh -c "npx wrangler d1 migrations apply ast_way_db --local --persist-to /app/.wrangler &&
         npx wrangler dev --ip 0.0.0.0 --port 8787 --persist-to /app/.wrangler"
```

#### ✅ `.dev.vars` を `env_file` で読み込む

Wrangler はコンテナ内でも `.dev.vars` を自動読み込みするが、Docker の環境変数として明示的に渡す方が安全：

```yaml
env_file:
  - .dev.vars
```

#### ✅ インタラクティブなプロンプトを無効化する

```yaml
environment:
  - WRANGLER_SEND_METRICS=false
  - CI=true
```

#### ✅ `npm install` は `command` ではなく `Dockerfile` の `RUN` で行う

`command` に `npm install` を書くと**コンテナ起動のたびに実行**されて遅い。
`Dockerfile` 側でインストールしておき、`node_modules` は anonymous volume でオーバーライドする。

```dockerfile
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
```

```yaml
volumes:
  - .:/app
  - /app/node_modules   # ← ホストの node_modules で上書きされないよう保護
```

#### ✅ `version` フィールドは削除する

Docker Compose v2 では `version:` は obsolete で警告が出る。削除してよい。

#### ✅ `depends_on` の方向

フロントエンドが API を呼ぶため、`web` が `workers` に依存するのが正しい：

```yaml
web:
  depends_on:
    - workers
```

---

### 3. 推奨開発フロー

#### パターン A: ホスト上で直接（最速・推奨）

```bash
# ターミナル 1: Workers
npx wrangler dev

# ターミナル 2: Vite
npm run dev
```

#### パターン B: Docker（環境統一が必要な場合）

```bash
docker-compose up --build
```

---

### 4. D1 ローカルデータの場所

`--persist-to` を使うと、D1 のデータは以下に保存される：

- Docker 使用時: named volume `wrangler_data` → コンテナ内 `/app/.wrangler/`
- ホスト直接起動時: `.wrangler/state/v3/d1/` (プロジェクトルート)

データをリセットしたい場合：

```bash
# ホスト直接起動の場合
rm -rf .wrangler/state

# Docker の場合
docker-compose down -v   # -v で named volume も削除
```

---

### 5. 参考リンク

- [Wrangler CLI docs](https://developers.cloudflare.com/workers/wrangler/)
- [D1 local development](https://developers.cloudflare.com/d1/build-with-d1/local-development/)
- [Miniflare](https://miniflare.dev/)
