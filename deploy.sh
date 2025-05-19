#!/bin/bash

ACTION=$1
ENV=${2:-development}
ENV_FILE=".env.$ENV"

if [[ "$ACTION" == "up" && ! -f "$ENV_FILE" ]]; then
    echo "❌ 環境ファイル $ENV_FILE が存在しません。"
    echo "正しい環境名を指定するか、$ENV_FILE を作成してください。"
    exit 1
fi

case "$ACTION" in
    up)
        echo "🚀 Starting containers with $ENV_FILE..."
        docker-compose --env-file "$ENV_FILE" up -d
        ;;
    down)
        echo "🛑 Stopping containers..."
        docker-compose down
        ;;
    logs)
        echo "📄 Showing logs..."
        docker-compose logs -f
        ;;
    *)
        echo "Usage: $0 {up|down|logs} [environment]"
        exit 1
        ;;
esac