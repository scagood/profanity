FROM node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85

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
