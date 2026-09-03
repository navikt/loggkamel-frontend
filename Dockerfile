FROM gcr.io/distroless/nodejs26-debian13:nonroot

WORKDIR /app

COPY package.json /app/

ENV NODE_ENV=production

EXPOSE 3000

CMD ["server.js"]