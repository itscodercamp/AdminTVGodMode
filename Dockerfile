# ---------- Builder Stage ----------
# This stage builds the Next.js application.
FROM node:20 AS builder
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package*.json ./
RUN npm ci --silent

# Copy the rest of the project files
COPY . .

# Build the Next.js application
RUN npm run build

# ---------- Runner Stage ----------
# This stage creates the final, lean image for production.
FROM node:20 AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production
# This PORT is used by Next.js. We will map it to 3000 on the host.
ENV PORT=3000
# IMPORTANT: This path must match the volume mount path in your docker run command.
ENV SQLITE_PATH=/dev.db

# Create a non-root user 'node' for better security
RUN addgroup --system --gid 1001 node
RUN adduser --system --uid 1001 node

# Copy only necessary files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# The 'public' folder will be mounted from the host,
# but we copy it here as a fallback in case it's not mounted.
COPY --from=builder --chown=node:node /app/public ./public

# Set the user to the non-root user
USER node

# Change ownership of the app directory to the 'node' user
# The folders for db and public will be created on the host,
# but this ensures the container itself has correct permissions.
RUN chown -R node:node /app

# IMPORTANT: Declare the paths that will be managed by external volumes.
# This explicitly tells Docker that data in these paths is meant to be persistent.
VOLUME ["/public", "/dev.db"]

EXPOSE 3000

# The command to start the Next.js production server
CMD ["npm", "run", "start"]
