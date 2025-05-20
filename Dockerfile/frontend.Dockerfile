# FROM node:20-alpine

# WORKDIR /app

# # 依存関係のインストールのために先にpackage.jsonとpackage-lock.jsonをコピー
# COPY ./frontend/package*.json ./

# # 依存関係をインストール
# RUN npm install

# # ソースコードをコピー
# COPY ./frontend/ .

# # パスを通すためにグローバルインストール
# RUN npm install -g vite

# # アプリケーションを実行
# CMD ["vite", "--host", "0.0.0.0", "--port", "5173"]


# 開発環境用ではなく本番用でビルド
# --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# ビルド時に受け取る
ARG VITE_API_BASE_URL
# Vite はこの ENV をビルド時に読み込む
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# frontend/package.json を取り込む
COPY frontend/package*.json ./  
RUN npm ci

# frontend のソース一式を取り込む
COPY frontend/. .               
RUN npm run build               # → /app/dist が生成される

# --- Stage 2: Serve ---
FROM nginx:stable-alpine
# ビルド成果物を nginx のドキュメントルートへコピー
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]