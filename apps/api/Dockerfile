# Multi-stage Dockerfile for @rea/api deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace definitions
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/db/package*.json ./packages/db/
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy source files
COPY packages/db/ ./packages/db/
COPY apps/api/ ./apps/api/

# Build db package then api service
RUN npm run build:db
RUN npm run build:api

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY packages/db/package*.json ./packages/db/
COPY apps/api/package*.json ./apps/api/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
