# Wrangler / Miniflare を使った Cloudflare Workers 開発用 Dockerfile
FROM node:22

WORKDIR /app

# 依存関係をインストール
COPY package*.json ./
RUN npm install

# アプリケーションソースをコピー
COPY . .

# Workers 開発用のポートを公開
EXPOSE 8787

# デフォルトで Wrangler dev を起動
CMD ["npx", "wrangler", "dev", "--host", "0.0.0.0", "--port", "8787"]