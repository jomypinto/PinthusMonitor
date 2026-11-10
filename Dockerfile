# ========================================================
# NEXUS Network Monitor - Multi-Stage Production Dockerfile
# Target: On-Premises Linux Host / Edge Server
# ========================================================

# Stage 1: Build Frontend Assets
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json ./

# Install full dependencies deterministically for building
RUN npm ci

# Copy source code
COPY . .

# Compile TypeScript and Vite production bundle to /app/dist
RUN npm run build

# ========================================================
# Stage 2: Production Execution Environment
# ========================================================
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install native Linux networking and monitoring tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping \
    iproute2 \
    procps \
    arp-scan \
    libcap2-bin \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Grant CAP_NET_RAW capability to ping binary for non-root execution
RUN setcap cap_net_raw+ep /bin/ping 2>/dev/null || chmod u+s /bin/ping

# Create non-root system user for security
RUN groupadd -r nexus && useradd -r -g nexus -s /bin/bash -m nexus

# Copy package manifest and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and backend scripts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Install tsx globally in container for running typescript server directly
RUN npm install -g tsx

# Create storage and log directories and set ownership
RUN mkdir -p /app/data /app/logs && chown -R nexus:nexus /app

USER nexus

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Periodic healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD sh -c "curl -f http://127.0.0.1:\${PORT:-3000}/api/health" || exit 1

CMD ["tsx", "server.ts"]
