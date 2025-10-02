# Multi-stage Dockerfile for Next.js app
# - Keeps the project's `dev.db` at the repository root inside the container (/dev.db)
# - Exposes port 3000
# - Declares volumes for /dev.db and /public so host can bind-mount them for persistence

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy project files and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# This path is read by the updated src/lib/db.ts
ENV SQLITE_PATH=/app/dev.db

# Copy runtime artifacts from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy the dev.db into the container so the image has a fallback DB if not bind-mounted
COPY --from=builder /app/dev.db ./dev.db

# Declare mount points for persistence (host should bind-mount these)
VOLUME ["/app/public", "/app/dev.db"]

EXPOSE 3000

# Start the Next.js production server on PORT
CMD ["npm", "run", "start"]
