FROM python:3.11-slim

WORKDIR /app

# 依存関係のインストール
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ログディレクトリの作成とパーミッション設定
RUN mkdir -p /app/logs && chmod 777 /app/logs

# アプリケーションコードをコピー
COPY ./backend /app/

# アプリケーションを実行
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]