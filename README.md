# AI Interview アプリケーション

## プロジェクト構成

このプロジェクトは以下の構成になっています：

- `frontend/`: Reactベースのフロントエンドアプリケーション
- `backend/`: FastAPIベースのバックエンドAPI
- `Dockerfile/`: フロントエンドとバックエンド用のDockerfile
- `docker-compose.yml`: Docker Composeの設定ファイル

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

## 使い方

1. コンテナを起動

./deploy.sh up [環境名]

- 環境名（オプション）：使用する環境を指定します。  
- 省略した場合は development がデフォルトで使用されます。

＜使用例＞
- ./deploy.sh up           → .env.development を使用
- ./deploy.sh up production→ .env.production を使用


2. コンテナを停止

./deploy.sh down


3. コンテナのログを確認

./deploy.sh logs

---

【環境変数ファイルについて】

- 環境変数ファイルはプロジェクトルートに配置し、以下のように命名します：
  - .env.development
  - .env.production

＜.env.production の例＞

VITE_API_BASE_URL=https://api.production.com
OPENAI_API_KEY=your-production-api-key
FREE_DETAILED_FEEDBACK_COUNT=3

---

【注意事項】

- スクリプトに実行権限を付与してください。  
  chmod +x ./deploy.sh

- 実行前に、使用する .env ファイルが存在していることを確認してください。

- 環境を追加したい場合は、対応する .env.<環境名> ファイルを作成してください。


## nginx + HTTPS（開発・GCP両対応）

### GCP（Let’s Encrypt証明書）

1. `docker-compose.yml` の certbot サービスのメール・ドメインを修正
2. 初回証明書取得
   ```
   docker-compose run --rm certbot
   ```
3. nginx起動
   ```
   docker-compose up -d nginx
   ```
4. 証明書更新
   ```
   docker-compose run --rm certbot renew
   ```

### ローカル（自己署名証明書）

1. 自己署名証明書生成
   ```
   chmod +x ./nginx/certs/generate-selfsigned.sh
   docker run --rm -v $(pwd)/nginx/certs:/etc/nginx/certs alpine sh /etc/nginx/certs/generate-selfsigned.sh
   ```
2. nginx起動
   ```
   docker-compose up -d nginx
   ```
3. https://localhost でアクセス（証明書警告は無視）

---

## 注意
- certbot用webrootは `./nginx/www`
- 証明書パスは `/etc/nginx/certs/`
- frontend/backendのAPIパスはnginx.confで調整