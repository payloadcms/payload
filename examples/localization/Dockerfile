FROM node:24.22.1-alpine as base

FROM base as builder

WORKDIR /home/node/app
COPY package*.json ./

COPY . .
RUN yarn install
RUN yarn build

FROM base as runtime

ENV NODE_ENV=production

WORKDIR /home/node/app
COPY package*.json  ./
COPY yarn.lock ./

RUN yarn install --production

EXPOSE 3000

CMD ["node", "dist/server.js"]
