FROM node:20-alpine AS builder

WORKDIR /app

COPY services/websocket/package.json services/websocket/package-lock.json ./
RUN npm ci --no-audit --prefer-offline

COPY services/websocket/prisma ./prisma
COPY services/websocket/tsconfig.json .
COPY services/websocket/server.ts .

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/build ./build

EXPOSE 3001

CMD ["node", "build/server.js"]
