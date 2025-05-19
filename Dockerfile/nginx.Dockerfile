FROM nginx:1.25-alpine

# 設定ファイルをコピー（後でdocker-composeでマウントも可）
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# 証明書・秘密鍵を配置するディレクトリ
RUN mkdir -p /etc/nginx/certs

# ポート開放
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]