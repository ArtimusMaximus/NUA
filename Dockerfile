# NUA multi-stage build: build the Vite frontend in a separate stage, then run
# a lean runtime stage with only production server dependencies + the Prisma CLI.

# ---------- Stage 1: build the frontend ----------
FROM node:20-slim AS build
ENV NODE_ENV=development
WORKDIR /usr/src/app

# Copy root package files first for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend source (node_modules/dist excluded by .dockerignore)
COPY . .

# Build the Vite frontend
RUN npx vite build

# ---------- Stage 2: runtime ----------
FROM node:20-slim AS runtime

ENV NODE_ENV=development
ENV AUTO_MIGRATE=true
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary

WORKDIR /usr/src/app/server

# Install server production dependencies (Prisma CLI added separately below)
COPY server/package*.json ./
RUN npm ci --omit=dev

# Keep the Prisma CLI available for runtime migrations (migrate deploy / generate)
RUN npm install --no-save prisma

# Copy schema + migrations early for layer caching, then generate the client
COPY server/schema.prisma ./schema.prisma
COPY server/migrations/ ./migrations/
RUN npx prisma generate --schema=./schema.prisma

# Copy the rest of the server application code
COPY server/ ./

# Copy the built frontend into the static assets dir served by Express
COPY --from=build /usr/src/app/dist ../dist

# Make startup script executable
RUN chmod +x /usr/src/app/server/scripts/docker-startup.sh

# Install OpenSSL and utilities needed at runtime (Prisma query engine requires libssl)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl procps curl ca-certificates sqlite3 && \
    rm -rf /var/lib/apt/lists/*

# Create necessary directories with proper permissions
RUN mkdir -p /usr/src/app/server/config && \
    mkdir -p /usr/src/app/server/config/server_logs && \
    chmod 755 /usr/src/app/server/config && \
    chmod 755 /usr/src/app/server/config/server_logs

# Expose the port your app runs on
EXPOSE 4323/tcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4323/health || exit 1

# Command to run the application (direct node, not nodemon)
CMD ["/usr/src/app/server/scripts/docker-startup.sh"]
