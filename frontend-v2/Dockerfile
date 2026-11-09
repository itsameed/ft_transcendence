FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/certs \
    && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
       -keyout /etc/nginx/certs/transcendence.key \
       -out /etc/nginx/certs/transcendence.crt \
       -subj "/CN=localhost" \
       -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443