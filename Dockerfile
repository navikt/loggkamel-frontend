FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:26-slim@sha256:c92f85fa4d3b5c5f7b65b95387df49b93546e687736eeed1b2084ecd6694fd51

WORKDIR /app

COPY package.json .npmrc ./

RUN pnpm install

COPY . ./

RUN pnpm run build

CMD ["node", "./index.js"]