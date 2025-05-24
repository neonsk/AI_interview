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
        ENV=${2:-development} docker-compose --env-file "$ENV_FILE" up -d
        ;;
    down)
        echo "🛑 Stopping containers..."
        ENV=${2:-development} docker-compose down
        ;;
    restart)
        echo "🔄 Restarting containers..."
        ENV=${2:-development} docker-compose down
        docker rmi -f $(docker images -q)
        ENV=${2:-development} docker-compose --env-file "$ENV_FILE" up -d
        ;;
    logs)
        echo "📄 Showing logs..."
        ENV=${2:-development} docker-compose logs -f
        ;;
    reset-resources)
        echo "🔄 Resetting resources..."
        docker system prune -af --volumes
        ;;
    *)
        echo "Usage: $0 {up|down|logs|reset-resources} [environment]"
        exit 1
        ;;
esac