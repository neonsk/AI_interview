# AI Interview アプリケーション

## プロジェクト構成

このプロジェクトは以下の構成になっています：

- `frontend/`: Reactベースのフロントエンドアプリケーション
- `backend/`: FastAPIベースのバックエンドAPI
- `Dockerfile/`: フロントエンドとバックエンド用のDockerfile
- `docker-compose.yml`: Docker Composeの設定ファイル

## 開発環境のセットアップ

### 必要条件

- Docker
- Docker Compose

### 起動方法

```bash
# Docker Composeでアプリケーションを起動
docker-compose up -d

# フロントエンドにアクセス
http://localhost:5173

# バックエンドAPIにアクセス
http://localhost:8000

# APIドキュメント
http://localhost:8000/docs
```

## 開発

### フロントエンド

フロントエンドは以下の技術を使用しています：

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- i18next（国際化）

### バックエンド

バックエンドは以下の技術を使用しています：

- Python
- FastAPI
- Uvicorn

## ライセンス

All rights reserved.