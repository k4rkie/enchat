FROM oven/bun:1-slim

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 8080

RUN bun run build

CMD ["./dist/server"]
