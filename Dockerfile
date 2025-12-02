# Erstes Stage – Dependencies installieren und builden
FROM node:20-alpine AS builder
WORKDIR /app

# package.json kopieren
COPY package*.json ./
RUN npm install

# Rest des Codes
COPY . .

# Next.js build
RUN npm run build

# Zweites Stage – production image
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]