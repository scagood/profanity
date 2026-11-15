FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

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
