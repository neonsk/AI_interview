FROM node:20-alpine

WORKDIR /app

# 依存関係のインストールのために先にpackage.jsonとpackage-lock.jsonをコピー
COPY ./frontend/package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY ./frontend/ .

# パスを通すためにグローバルインストール
RUN npm install -g vite

# アプリケーションを実行
CMD ["vite", "--host", "0.0.0.0", "--port", "5173"]
