import { NetworkDevice, LocalServerMetrics, NetworkEvent, SubnetScanRange, DiscoveryScanJob, TrafficTalker, ProtocolStat, ConnectionLink } from '../types/network';
import { ApiResponse, BackendConfig, StartScanPayload, DeviceQueryParams } from '../types/api';
import { INITIAL_DEVICES, INITIAL_SERVER_METRICS, INITIAL_EVENTS, INITIAL_SUBNETS, INITIAL_TOP_TALKERS, INITIAL_PROTOCOLS, INITIAL_CONNECTION_LINKS } from './mockData';

// Local storage keys for prototype state persistence
const STORAGE_KEYS = {
  DEVICES: 'nexus_devices_v1',
  EVENTS: 'nexus_events_v1',
  SUBNETS: 'nexus_subnets_v1',
  BACKEND_CONFIG: 'nexus_backend_config_v1'
};

const getStored = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStored = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error', e);
  }
};

class NexusApiService {
  private config: BackendConfig = getStored<BackendConfig>(STORAGE_KEYS.BACKEND_CONFIG, {
    baseUrl: 'http://127.0.0.1:5000/api/v1',
    useLiveBackend: false,
    collectorPollIntervalMs: 5000,
    status: 'disconnected',
    lastPing: undefined
  });

  private activeScanJob: DiscoveryScanJob | null = null;
  private scanTimer: any = null;

  public getConfig(): BackendConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<BackendConfig>): BackendConfig {
    this.config = { ...this.config, ...newConfig };
    setStored(STORAGE_KEYS.BACKEND_CONFIG, this.config);
    return this.config;
  }

  public async testBackendConnection(url: string): Promise<{ connected: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        this.updateConfig({ status: 'connected', lastPing: new Date().toISOString() });
        return { connected: true, latencyMs, message: `Connected to Flask daemon (${latencyMs}ms)` };
      }
      return { connected: false, latencyMs, message: `Server returned HTTP ${res.status}` };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return { 
        connected: false, 
        latencyMs, 
        message: 'Could not connect to Flask collector at ' + url + '. Ensure backend is running with CORS enabled.' 
      };
    }
  }

  // --- Devices & Inventory ---

  public async getDevices(params?: DeviceQueryParams): Promise<ApiResponse<NetworkDevice[]>> {
    if (this.config.useLiveBackend) {
      try {
        const query = new URLSearchParams(params as any).toString();
        const res = await fetch(`${this.config.baseUrl}/devices?${query}`);
        if (res.ok) {
          const json = await res.json();
          return { success: true, data: json.devices, timestamp: new Date().toISOString(), source: 'live_flask_api' };
        }
      } catch (e) {
        console.warn('Live backend unreachable, falling back to simulated data', e);
      }
    }

    let devices = getStored<NetworkDevice[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);

    // Filter in simulated mode
    if (params?.search) {
      const s = params.search.toLowerCase();
      devices = devices.filter(d => 
        d.hostname.toLowerCase().includes(s) ||
        d.ipAddress.includes(s) ||
        d.macAddress.toLowerCase().includes(s) ||
        d.manufacturer.toLowerCase().includes(s) ||
        d.tags.some(t => t.toLowerCase().includes(s))
      );
    }
    if (params?.status && params.status !== 'all') {
      devices = devices.filter(d => d.status === params.status);
    }
    if (params?.type && params.type !== 'all') {
      devices = devices.filter(d => d.deviceType === params.type);
    }
    if (params?.subnet && params.subnet !== 'all') {
      devices = devices.filter(d => d.subnet === params.subnet);
    }

    if (params?.sortBy) {
      const key = params.sortBy;
      const order = params.sortOrder === 'desc' ? -1 : 1;
      devices = [...devices].sort((a, b) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * order;
        }
        return String(valA).localeCompare(String(valB)) * order;
      });
    }

    return {
      success: true,
      data: devices,
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  public async updateDevice(id: string, updates: Partial<NetworkDevice>): Promise<ApiResponse<NetworkDevice>> {
    const devices = getStored<NetworkDevice[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
    const index = devices.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error(`Device with ID ${id} not found`);
    }
    const updated = { ...devices[index], ...updates };
    devices[index] = updated;
    setStored(STORAGE_KEYS.DEVICES, devices);

    return {
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  public async triggerPing(ipAddress: string): Promise<{ success: boolean; rttMs: number; packetsTransmitted: number; packetsReceived: number; output: string[] }> {
    // Simulated realistic ICMP output
    await new Promise(r => setTimeout(r, 650));
    const isLocal = ipAddress === '192.168.1.15' || ipAddress === '127.0.0.1';
    const isUnreachable = ipAddress === '192.168.1.112';

    if (isUnreachable) {
      return {
        success: false,
        rttMs: 0,
        packetsTransmitted: 4,
        packetsReceived: 0,
        output: [
          `PING ${ipAddress} (${ipAddress}) 56(84) bytes of data.`,
          `From 192.168.1.15 icmp_seq=1 Destination Host Unreachable`,
          `From 192.168.1.15 icmp_seq=2 Destination Host Unreachable`,
          `From 192.168.1.15 icmp_seq=3 Destination Host Unreachable`,
          `From 192.168.1.15 icmp_seq=4 Destination Host Unreachable`,
          `--- ${ipAddress} ping statistics ---`,
          `4 packets transmitted, 0 received, +4 errors, 100% packet loss, time 3042ms`
        ]
      };
    }

    const rtt = isLocal ? 0.08 : Number((0.6 + Math.random() * 1.5).toFixed(2));
    return {
      success: true,
      rttMs: rtt,
      packetsTransmitted: 4,
      packetsReceived: 4,
      output: [
        `PING ${ipAddress} (${ipAddress}) 56(84) bytes of data.`,
        `64 bytes from ${ipAddress}: icmp_seq=1 ttl=64 time=${(rtt * 0.95).toFixed(2)} ms`,
        `64 bytes from ${ipAddress}: icmp_seq=2 ttl=64 time=${(rtt * 1.02).toFixed(2)} ms`,
        `64 bytes from ${ipAddress}: icmp_seq=3 ttl=64 time=${(rtt * 0.98).toFixed(2)} ms`,
        `64 bytes from ${ipAddress}: icmp_seq=4 ttl=64 time=${(rtt * 1.05).toFixed(2)} ms`,
        `--- ${ipAddress} ping statistics ---`,
        `4 packets transmitted, 4 received, 0% packet loss, time 3004ms`,
        `rtt min/avg/max/mdev = ${(rtt * 0.95).toFixed(2)}/${rtt}/${(rtt * 1.05).toFixed(2)}/0.04 ms`
      ]
    };
  }

  // --- Monitoring Server Metrics (Host Local) ---

  public async getServerMetrics(): Promise<ApiResponse<LocalServerMetrics>> {
    // Add subtle real-time jitter so dials move realistically
    const metrics: LocalServerMetrics = JSON.parse(JSON.stringify(INITIAL_SERVER_METRICS));
    const jitter = (Math.random() - 0.5) * 2;
    metrics.cpu.utilizationPercent = Math.max(8, Math.min(45, Number((metrics.cpu.utilizationPercent + jitter).toFixed(1))));
    metrics.memory.percentUsed = Number((metrics.memory.percentUsed + (Math.random() - 0.5) * 0.4).toFixed(1));
    metrics.interfaces[0].rxBytesPerSec += Math.floor((Math.random() - 0.5) * 50000);
    metrics.interfaces[0].txBytesPerSec += Math.floor((Math.random() - 0.5) * 40000);

    return {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  // --- Events and Alerts ---

  public async getEvents(): Promise<ApiResponse<NetworkEvent[]>> {
    const events = getStored<NetworkEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    return {
      success: true,
      data: events,
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  public async acknowledgeEvent(id: string, notes?: string, acknowledgedBy = 'sysadmin'): Promise<ApiResponse<NetworkEvent>> {
    const events = getStored<NetworkEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const index = events.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Event not found');

    const updated: NetworkEvent = {
      ...events[index],
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      resolutionNotes: notes || events[index].resolutionNotes || 'Acknowledged by operator.'
    };
    events[index] = updated;
    setStored(STORAGE_KEYS.EVENTS, events);

    return {
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  // --- Subnet Scan Ranges & Discovery ---

  public async getSubnetRanges(): Promise<ApiResponse<SubnetScanRange[]>> {
    const subnets = getStored<SubnetScanRange[]>(STORAGE_KEYS.SUBNETS, INITIAL_SUBNETS);
    return {
      success: true,
      data: subnets,
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  public async saveSubnetRange(range: SubnetScanRange): Promise<ApiResponse<SubnetScanRange>> {
    const subnets = getStored<SubnetScanRange[]>(STORAGE_KEYS.SUBNETS, INITIAL_SUBNETS);
    const index = subnets.findIndex(s => s.id === range.id);
    if (index >= 0) {
      subnets[index] = range;
    } else {
      subnets.push(range);
    }
    setStored(STORAGE_KEYS.SUBNETS, subnets);
    return {
      success: true,
      data: range,
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  public async deleteSubnetRange(id: string): Promise<void> {
    let subnets = getStored<SubnetScanRange[]>(STORAGE_KEYS.SUBNETS, INITIAL_SUBNETS);
    subnets = subnets.filter(s => s.id !== id);
    setStored(STORAGE_KEYS.SUBNETS, subnets);
  }

  public getActiveScanJob(): DiscoveryScanJob | null {
    return this.activeScanJob;
  }

  public startDiscoveryScan(
    payload: StartScanPayload, 
    onProgress: (job: DiscoveryScanJob) => void,
    onComplete: (job: DiscoveryScanJob) => void
  ): DiscoveryScanJob {
    if (this.activeScanJob && this.activeScanJob.status === 'running') {
      return this.activeScanJob;
    }

    const totalIps = 254; // /24 calculation
    const baseIp = payload.cidr.split('/')[0].split('.').slice(0, 3).join('.');

    this.activeScanJob = {
      id: `job-${Date.now()}`,
      targetCidr: payload.cidr,
      status: 'running',
      totalIps,
      probedIps: 0,
      discoveredHosts: 0,
      startTime: new Date().toLocaleTimeString(),
      currentIp: `${baseIp}.1`,
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `NEXUS Scapy/ARP prober initialized on eth0. Target: ${payload.cidr} (Rate: ${payload.rateLimitPps} pps).`
        },
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: 'Validating authorized subnet policy... OK (Authorized range).'
        }
      ]
    };

    let step = 0;
    const intervalMs = Math.max(80, Math.floor(1000 / (payload.rateLimitPps / 10)));

    this.scanTimer = setInterval(() => {
      if (!this.activeScanJob || this.activeScanJob.status !== 'running') {
        clearInterval(this.scanTimer);
        return;
      }

      step += 12; // Advance in chunks for smooth UX
      const probed = Math.min(totalIps, step);
      this.activeScanJob.probedIps = probed;
      const currentHostNum = Math.min(254, probed);
      this.activeScanJob.currentIp = `${baseIp}.${currentHostNum}`;

      // Simulate discovery events at realistic host IPs
      if (probed >= 1 && probed <= 15 && this.activeScanJob.discoveredHosts === 0) {
        this.activeScanJob.discoveredHosts += 2;
        this.activeScanJob.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: `ARP reply: ${baseIp}.1 -> 00:1B:17:8C:44:A1 (Cisco ISR4431)`
        });
        this.activeScanJob.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: `ARP reply: ${baseIp}.2 -> F8:66:F2:19:80:CC (Cisco Catalyst 3850)`
        });
      } else if (probed >= 20 && probed <= 35 && this.activeScanJob.discoveredHosts < 5) {
        this.activeScanJob.discoveredHosts += 3;
        this.activeScanJob.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: `ARP reply: ${baseIp}.10 -> 00:50:56:B3:7A:14 (Microsoft/VMware)`
        });
        this.activeScanJob.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: `ARP reply: ${baseIp}.20 -> 00:11:32:9C:FE:42 (Synology DS923+)`
        });
      } else if (probed >= 100 && probed <= 120 && this.activeScanJob.discoveredHosts < 12) {
        this.activeScanJob.discoveredHosts += 5;
        this.activeScanJob.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: `ARP reply: ${baseIp}.101 -> E8:6A:64:9F:8B:11 (Lenovo Workstation)`
        });
      } else if (probed >= 235 && this.activeScanJob.discoveredHosts < 19) {
        this.activeScanJob.discoveredHosts += 2;
        this.activeScanJob.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          level: 'warn',
          message: `ARP reply from uncataloged MAC: ${baseIp}.240 -> 48:E7:29:AB:12:EF (Espressif)`
        });
      }

      onProgress({ ...this.activeScanJob });

      if (probed >= totalIps) {
        clearInterval(this.scanTimer);
        this.activeScanJob.status = 'completed';
        this.activeScanJob.endTime = new Date().toLocaleTimeString();
        this.activeScanJob.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `Discovery scan completed. Total probed: ${totalIps} IPs. Discovered: ${this.activeScanJob.discoveredHosts} responsive hosts.`
        });
        onComplete({ ...this.activeScanJob });
      }
    }, intervalMs);

    return { ...this.activeScanJob };
  }

  public stopDiscoveryScan(): void {
    if (this.scanTimer) clearInterval(this.scanTimer);
    if (this.activeScanJob) {
      this.activeScanJob.status = 'cancelled';
      this.activeScanJob.logs.unshift({
        timestamp: new Date().toLocaleTimeString(),
        level: 'warn',
        message: 'Scan interrupted by operator command (SIGINT).'
      });
    }
  }

  // --- Traffic & Connections ---

  public async getTrafficStats(): Promise<{ talkers: TrafficTalker[]; protocols: ProtocolStat[] }> {
    return {
      talkers: INITIAL_TOP_TALKERS,
      protocols: INITIAL_PROTOCOLS
    };
  }

  public async getConnectionLinks(): Promise<ConnectionLink[]> {
    return INITIAL_CONNECTION_LINKS;
  }
}

export const nexusApi = new NexusApiService();
