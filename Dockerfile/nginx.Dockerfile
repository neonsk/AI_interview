FROM nginx:1.18-alpine
RUN apk add --no-cache gettext

COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx/docker-entrypoint.sh  /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# ポート開放
EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]