FROM node:20-alpine AS builder
WORKDIR /app

COPY src/package*.json ./src/
WORKDIR /app/src
RUN npm install

COPY src/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app/src

COPY --from=builder /app/src ./

EXPOSE 3000
CMD ["npm", "start"]