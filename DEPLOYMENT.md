# NEXUS Network Monitor — Linux On-Premises Deployment Guide

This document details the production deployment architecture of **NEXUS Network Monitor** on bare-metal or virtualized Linux servers (Debian, Ubuntu, Rocky Linux, RHEL) within private local area networks (LAN).

---

## 1. Architectural Overview

```
                      +------------------------------------------+
                      |        Physical Host (e.g. 192.168.0.13) |
                      |           Interface: eth0                |
                      +--------------------+---------------------+
                                           |
                    network_mode: "host"   |  cap_add: [NET_RAW]
                                           v
+--------------------------------------------------------------------------+
| Container: nexus-monitor-app (User: nexus, non-root)                     |
|                                                                          |
|  +-----------------------+              +-----------------------------+  |
|  | Express Backend       | <--------->  | React Single Page App       |  |
|  | (server.ts on Node 20)|              | (Vite compiled in /app/dist)|  |
|  +-----------+-----------+              +-----------------------------+  |
|              |                                                           |
|              +---> Local Kernel Metrics (/proc/net/dev, /proc/meminfo)   |
|              +---> Real ICMP Ping & ARP Probing (arp-scan, ping)         |
|              +---> Discovery Engine (Bounded to authorized CIDRs)        |
+--------------+-----------------------------------------------------------+
               |                               |
       (./data volume)                 (./logs volume)
               v                               v
       /app/data (JSON Store)          /app/logs (Log files)
```

---

## 2. Dockerfile Structure & Build Strategy

The project utilizes a **multi-stage build** based on `node:20-bookworm-slim` to achieve optimal security, minimal attack surface, and low image size while providing the native Linux networking utilities required for live network discovery.

```dockerfile
# Stage 1: Build Frontend Assets
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build  # Produces optimized static assets in /app/dist

# Stage 2: Production Execution Environment
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# 1. Native networking tools for ICMP, ARP, and interface inspection
RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping \
    iproute2 \
    procps \
    arp-scan \
    libcap2-bin \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. Grant CAP_NET_RAW capability to ping binary for non-root execution
RUN setcap cap_net_raw+ep /bin/ping 2>/dev/null || chmod u+s /bin/ping

# 3. Create unprivileged system user 'nexus'
RUN groupadd -r nexus && useradd -r -g nexus -s /bin/bash -m nexus

# 4. Production dependencies and build artifacts
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# 5. Global tsx runtime for TypeScript backend execution
RUN npm install -g tsx

# 6. Persistent directories and access control
RUN mkdir -p /app/data /app/logs && chown -R nexus:nexus /app

USER nexus
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
EXPOSE 3000

# 7. Container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

CMD ["tsx", "server.ts"]
```

### Key Security & Operational Highlights
1. **Zero Root Privilege in Production**: The application executes under user `nexus` (UID/GID created on container assembly).
2. **Linux Capabilities over Root**: Instead of running as root to send ICMP echo packets, the container utilizes `libcap2-bin` (`setcap cap_net_raw+ep /bin/ping`) combined with `cap_add: [NET_RAW]` in Docker Compose.
3. **No Dev Dependencies**: Compilers, dev libraries, and Vite dev tools remain in Stage 1, leaving Stage 2 clean.

---

## 3. Docker Compose Configuration & Volume Mappings

The `docker-compose.yml` file configures the service runtime, host networking, security capabilities, and persistent volume mounts.

```yaml
version: '3.8'

services:
  nexus-monitor:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nexus-monitor-app
    restart: unless-stopped

    # Host network stack binding
    network_mode: "host"

    # Minimal kernel capabilities required for network telemetry
    cap_add:
      - NET_RAW

    environment:
      - PORT=3000
      - NODE_ENV=production
      - HOST=0.0.0.0
      - NEXUS_AUTHORIZED_CIDRS=${NEXUS_AUTHORIZED_CIDRS:-192.168.0.0/24}
      - NEXUS_DEFAULT_INTERFACE=${NEXUS_DEFAULT_INTERFACE:-eth0}
      - NEXUS_MAX_SCAN_PPS=${NEXUS_MAX_SCAN_PPS:-100}
      - NEXUS_PING_TIMEOUT_MS=${NEXUS_PING_TIMEOUT_MS:-1000}
      - DB_ENABLED=${DB_ENABLED:-false}

    volumes:
      # Persistent storage for device inventory, scan states, and network node records
      - ./data:/app/data
      # Application execution and security audit logs
      - ./logs:/app/logs

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Deep Dive: Network & Volume Strategy

| Configuration | Setting | Rationale |
| :--- | :--- | :--- |
| **`network_mode`** | `"host"` | Bypasses Docker's virtual NAT bridge. Without host mode, ARP broadcasts cannot reach the physical switch/LAN segment, and `/proc/net/dev` would only report Docker's virtual veth interface rather than the host's physical network adapter (`eth0`). |
| **`cap_add`** | `NET_RAW` | Allows unprivileged user `nexus` to open raw sockets for ICMP echo requests and layer-2 ARP frames without requiring full Docker `--privileged` mode. |
| **Volume: `./data:/app/data`** | Host-mounted directory | Stores active device inventories, discovered host metadata, custom user labels, and monitoring state. Persists across container restarts and image updates. |
| **Volume: `./logs:/app/logs`** | Host-mounted directory | Persists access logs, security boundary violation alerts (e.g. attempts to scan non-authorized CIDRs), and error logs on the host filesystem. |
| **Log Rotation** | `max-size: 10m`, `max-file: 3` | Prevents disk exhaustion on headless monitoring appliances. |

---

## 4. Environment Variables Sequence for Real Network Discovery

To safely connect the backend to your physical LAN without creating network storms or exceeding security boundaries, configure the following variables in `.env`:

### Variable Sequence & Reference Table

| Variable | Recommended Production Value | Description & Discovery Engine Role |
| :--- | :--- | :--- |
| `PORT` | `3000` | The TCP listening port on the host network interface. |
| `NODE_ENV` | `production` | Enables production optimizations and disables debug hot-reloading. |
| `HOST` | `0.0.0.0` | Binds Express to all network interfaces on the host. |
| `NEXUS_AUTHORIZED_CIDRS` | `192.168.0.0/24,10.0.0.0/24` | **Security boundary constraint.** A comma-separated list of allowed subnets. The backend will reject any scan request aimed outside these ranges with `403 Forbidden`. |
| `NEXUS_DEFAULT_INTERFACE` | `eth0` (or `enp3s0`, `ens18`) | The primary host network interface used for collecting throughput metrics, RX/TX bytes, and broadcast ARP discovery. |
| `NEXUS_MAX_SCAN_PPS` | `100` | **Rate limiter (Packets Per Second).** Prevents the discovery engine from saturating switches or triggering intrusion detection alerts during CIDR sweeps. |
| `NEXUS_PING_TIMEOUT_MS` | `1000` | Timeout per host probe in milliseconds. Balances discovery speed with tolerance for slower Wi-Fi or IoT devices. |
| `DB_ENABLED` | `false` (default) / `true` | Controls whether metrics are persisted to JSON/disk (`false`) or to an external/internal PostgreSQL database (`true`). |
| `DB_HOST` | `127.0.0.1` | PostgreSQL database host address (when `DB_ENABLED=true`). |
| `DB_PORT` | `5432` | PostgreSQL database port. |
| `DB_NAME` | `nexus_db` | Database name. |
| `DB_USER` | `nexus_admin` | Database username. |
| `DB_PASSWORD` | `<secure_random_string>` | Database password. |

---

## 5. Deployment Runbook (Step-by-Step)

### Prerequisites on the Host Server (`192.168.0.13`)
* **OS**: Debian 12 (Bookworm), Ubuntu 22.04/24.04 LTS, or Rocky Linux 9.
* **Engine**: Docker Engine 24.0+ and Docker Compose v2.20+.
* **Hardware Requirements**: Minimum 1 vCPU, 1 GB RAM, 5 GB disk storage.

### Step 1: Prepare Directories and Permissions
```bash
# Create application root directory
sudo mkdir -p /opt/nexus-monitor
sudo chown -R $USER:$USER /opt/nexus-monitor
cd /opt/nexus-monitor

# Copy or extract application files here
# Ensure data and logs directories exist with write permissions
mkdir -p data logs
chmod 775 data logs
```

### Step 2: Configure Environment Variables
```bash
cp .env.example .env
nano .env
```
Ensure your target subnet is specified:
```env
PORT=3000
NODE_ENV=production
HOST=0.0.0.0
NEXUS_AUTHORIZED_CIDRS="192.168.0.0/24"
NEXUS_DEFAULT_INTERFACE="eth0"
NEXUS_MAX_SCAN_PPS=100
NEXUS_PING_TIMEOUT_MS=1000
DB_ENABLED=false
```

### Step 3: Build and Launch Container
```bash
# Build the production image and start the service in background
docker compose up -d --build
```

### Step 4: Validate Deployment & Health
```bash
# 1. Check container running state
docker compose ps

# 2. View live startup logs
docker compose logs -f nexus-monitor

# 3. Query the local health endpoint
curl -s http://127.0.0.1:3000/api/health | jq .
```

Expected output:
```json
{
  "status": "online",
  "app": "NEXUS Network Monitor",
  "version": "1.0.0",
  "source": "live_linux_system",
  "uptime_seconds": 42
}
```

### Step 5: Verify Hardware & Network Interface Telemetry
```bash
# Query the live interface counters from /proc/net/dev
curl -s http://127.0.0.1:3000/api/system/metrics | jq .network
```

---

## 6. Maintenance & Operations

* **Stop service**: `docker compose down`
* **Restart service**: `docker compose restart`
* **Update application after git pull**:
  ```bash
  git pull origin main
  docker compose up -d --build
  ```
* **Backup persistent data**:
  ```bash
  tar -czvf nexus-data-backup-$(date +%F).tar.gz data/
  ```
