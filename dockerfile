# 開発用の軽量なNode.jsイメージを使用
FROM node:20-alpine

WORKDIR /app

# パッケージ管理ファイルをコピーして依存関係をインストール
COPY package*.json ./
RUN npm install

# ソースコードをコピー
COPY . .

# Viteのデフォルトポートを開放
EXPOSE 5173

# 開発サーバーを起動（ホストからのアクセスを許可するために --host を付与）
CMD ["npm", "run", "dev", "--", "--host"]