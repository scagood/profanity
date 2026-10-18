FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f

LABEL org.opencontainers.image.source="https://github.com/scagood/profanity"

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app

COPY ./.yarn /app/.yarn
COPY ./.yarnrc.yml /app/.yarnrc.yml
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

RUN yarn install

COPY . /app

EXPOSE 8080

CMD ["node", "index.js"]
