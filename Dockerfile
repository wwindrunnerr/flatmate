FROM node:20-alpine AS builder

WORKDIR /app

ENV DATABASE_URL="file:./test.db"

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./test.db"

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "start"]