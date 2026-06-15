# 開発用の軽量なBun イメージを使用
FROM oven/bun:latest

WORKDIR /app

# パッケージ管理ファイルをコピーして依存関係をインストール
COPY package*.json bunfig.toml* ./
RUN bun install

# ソースコードをコピー
COPY . .

# Viteのデフォルトポートを開放
EXPOSE 5173

# 開発サーバーを起動（ホストからのアクセスを許可するために --host を付与）
CMD ["bun", "run", "dev", "--", "--host"]