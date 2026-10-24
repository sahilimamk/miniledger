# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Only production deps (no devDependencies)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled JS + migrations + uploads dir
COPY --from=builder /app/dist ./dist
COPY migrations ./migrations
RUN mkdir -p uploads

# Default DB connection (override at runtime / docker-compose)
ENV DATABASE_URL=postgres://postgres:postgres@localhost:5432/miniledger
ENV JWT_SECRET=change-me-in-production

EXPOSE 4000

# Runs migrations then starts the server
CMD ["node", "dist/index.js"]
