FROM node:20-alpine

LABEL org.opencontainers.image.source "https://github.com/scagood/alex-stuff"

WORKDIR /app

COPY ./.yarn /app/.yarn
COPY ./.yarnrc.yml /app/.yarnrc.yml
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

RUN yarn install

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

COPY . /app

EXPOSE 8080

CMD node index.js
