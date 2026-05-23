# ─────────────────────────────────────────────
# Stage 1: Base
# ─────────────────────────────────────────────
ARG NODE_VERSION=20.14.0
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /app

# Install OS-level deps needed by native modules (bcrypt, ssh2, canvas, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    openssl

# ─────────────────────────────────────────────
# Stage 2: Dependencies
# ─────────────────────────────────────────────
FROM base AS deps

COPY package.json ./

# Install ALL deps (including dev) for potential build step
RUN npm install --ignore-scripts=false

# ─────────────────────────────────────────────
# Stage 3: Production dependencies only
# ─────────────────────────────────────────────
FROM base AS prod-deps

COPY package.json ./

RUN npm install --omit=dev --ignore-scripts=false

# ─────────────────────────────────────────────
# Stage 4: Production image
# ─────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS production

ARG BUILD_DATE
ARG GIT_COMMIT
ARG GIT_REF

# OCI standard labels
LABEL org.opencontainers.image.title="BritBooks API"
LABEL org.opencontainers.image.description="BritBooks marketplace API"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.ref.name="${GIT_REF}"
LABEL org.opencontainers.image.source="https://github.com/Structurezz/britbooks-api"
LABEL org.opencontainers.image.licenses="ISC"

WORKDIR /app

# Install runtime OS deps only
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    dumb-init \
 && addgroup -g 1001 -S nodejs \
 && adduser -S britbooks -u 1001 -G nodejs

# Copy production node_modules from prod-deps stage
COPY --from=prod-deps --chown=britbooks:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=britbooks:nodejs src/ ./src/
COPY --chown=britbooks:nodejs public/ ./public/
COPY --chown=britbooks:nodejs package.json ./

# Create required directories with correct ownership
RUN mkdir -p src/ftp-root/staging/incoming/products \
             src/ftp-root/staging/outgoing/orders \
             src/ftp-root/staging/outgoing/error-logs \
             logs \
 && chown -R britbooks:nodejs src/ftp-root logs

# Drop root privileges
USER britbooks

# Expose API port (override with PORT env var)
EXPOSE 3000

# Health check — hits the /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

# Use dumb-init to handle signals properly (PID 1 problem)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/main.js"]
