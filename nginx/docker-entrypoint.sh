#!/bin/sh
set -e
# テンプレートを置換して nginx.conf に出力
envsubst '${SERVER_NAME}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
# 本来の nginx 起動
exec "$@"