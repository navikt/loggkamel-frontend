FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-dev AS dependencies

USER root
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
# The prepare script needs build tooling, which is not installed in this stage.
# RUN npm install --global pnpm@11.22.0 \
#     && pnpm install --prod --frozen-lockfile --ignore-scripts
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim

WORKDIR /app
COPY --from=dependencies /app/package.json ./package.json
COPY --from=dependencies /app/node_modules ./node_modules
COPY build ./build

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

EXPOSE 8080
CMD ["build/index.js"]
