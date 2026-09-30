FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:26-slim

ENV NODE_ENV production
ENV NPM_CONFIG_CACHE /tmp

WORKDIR /app

EXPOSE 8080
CMD ["server/index.js"]