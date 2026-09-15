FROM node:24-alpine@sha256:50c8e8ca1d27439048670df5883f32d57cf81cff6233222c893fd0d9884cbd81

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
