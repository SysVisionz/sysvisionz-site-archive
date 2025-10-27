ARG PORT

FROM node:23

USER root


WORKDIR /var/www/html/sysvisionz.com

COPY certs/ certs
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY server.js server.js
COPY .env-prod .env
COPY .npmrc-prod .npmrc
COPY .next .next

RUN npm ci
RUN nohup npm run start port=8081 &
EXPOSE 8081