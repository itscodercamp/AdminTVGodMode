# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Next.js app
# The build process might create a temporary dev.db, which is fine. It won't be in the final image.
RUN npm run build

# ---

# Stage 2: Production image
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN mkdir -p /app/.next /app/public /app/db && chown -R nextjs:nodejs /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# --- IMPORTANT ---
# This step is crucial. We are NOT copying the dev.db file from the builder stage.
# We are declaring a volume, which tells Docker to use the mount from the host.
# This ensures that the database file is always the one from your KVM server's permanent storage.
VOLUME ["/public", "/dev.db"]

# Set the user to our non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the environment variable for Next.js to use the correct port
ENV PORT 3000
ENV NODE_ENV production

# Start the app
CMD ["npm", "start"]
