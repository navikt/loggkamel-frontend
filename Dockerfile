ARG NODE_VERSION="26"
FROM node:${NODE_VERSION} AS node-with-deps

COPY package.json .npmrc ./

RUN pnpm install

COPY . ./

RUN pnpm run build

FROM node:${NODE_VERSION}-alpine AS prod-deps

#COPY --from=node-with-deps /usr/app/package.json /usr/app/.npmrc ./
RUN pnpm install --prod

FROM node:${NODE_VERSION}-alpine
RUN apk upgrade --no-cache
#WORKDIR /usr/app

ENV NODE_ENV=production
ENV GRAPHQL_ENDPOINT=http://nais-api/graphql

COPY --from=prod-deps /usr/app/node_modules ./node_modules
COPY --from=node-with-deps /usr/app/build ./

CMD ["node", "./index.js"]