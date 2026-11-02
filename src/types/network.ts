export type DeviceStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export type DeviceType = 
  | 'Server'
  | 'Router'
  | 'Switch'
  | 'Firewall'
  | 'Access Point'
  | 'Workstation'
  | 'NAS / Storage'
  | 'Printer'
  | 'IoT / Embedded'
  | 'Virtual Machine';

export interface NetworkDevice {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  manufacturer: string;
  deviceType: DeviceType;
  operatingSystem: string;
  lastSeen: string;
  status: DeviceStatus;
  uptimeSeconds: number;
  latencyMs: number;
  packetLossPercent: number;
  subnet: string;
  vlan: number;
  openPorts: number[];
  snmpEnabled: boolean;
  snmpSysDescr?: string;
  switchPort?: string;
  switchHostname?: string;
  notes?: string;
  isAuthorized: boolean;
  tags: string[];
}

export interface LocalServerMetrics {
  serverHostname: string;
  ipAddress: string;
  operatingSystem: string;
  kernelVersion: string;
  uptimeHours: number;
  collectorVersion: string;
  cpu: {
    utilizationPercent: number;
    cores: number;
    loadAverage: [number, number, number]; // 1m, 5m, 15m
    temperatureCelsius: number;
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    cachedBytes: number;
    percentUsed: number;
  };
  disk: {
    mountPoint: string;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percentUsed: number;
    ioReadBps: number;
    ioWriteBps: number;
  };
  interfaces: {
    name: string;
    ipAddress: string;
    macAddress: string;
    speedMbps: number;
    rxBytesPerSec: number;
    txBytesPerSec: number;
    rxPacketsPerSec: number;
    txPacketsPerSec: number;
    errors: number;
    dropped: number;
    status: 'up' | 'down';
  }[];
}

export type EventSeverity = 'critical' | 'warning' | 'info';

export interface NetworkEvent {
  id: string;
  timestamp: string;
  deviceId?: string;
  deviceName: string;
  ipAddress: string;
  eventType: 
    | 'host_down'
    | 'host_recovered'
    | 'high_latency'
    | 'packet_loss'
    | 'new_mac_detected'
    | 'ip_conflict'
    | 'port_state_change'
    | 'snmp_trap'
    | 'rogue_device'
    | 'threshold_exceeded';
  severity: EventSeverity;
  description: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolutionNotes?: string;
}

export interface SubnetScanRange {
  id: string;
  name: string;
  cidr: string;
  vlan: number;
  description: string;
  isAuthorized: boolean;
  probeType: 'ARP+ICMP' | 'SYN_SCAN' | 'ICMP_ONLY';
  rateLimitPps: number;
  enabled: boolean;
  lastScanned?: string;
}

export interface DiscoveryScanJob {
  id: string;
  targetCidr: string;
  status: 'idle' | 'running' | 'completed' | 'cancelled' | 'failed';
  totalIps: number;
  probedIps: number;
  discoveredHosts: number;
  startTime?: string;
  endTime?: string;
  currentIp?: string;
  logs: {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
  }[];
}

export interface TrafficTalker {
  ipAddress: string;
  hostname: string;
  macAddress: string;
  bytesIn: number;
  bytesOut: number;
  totalBytes: number;
  percentage: number;
  primaryProtocol: string;
}

export interface ProtocolStat {
  protocol: string;
  port: number;
  sharePercent: number;
  bytesTotal: number;
  category: 'Infrastructure' | 'Web' | 'File Transfer' | 'Management' | 'Other';
}

export interface ConnectionLink {
  sourceId: string;
  targetId: string;
  linkType: 'ethernet' | 'trunk' | 'wireless' | 'gateway';
  speedMbps: number;
  status: 'up' | 'down' | 'degraded';
  vlan: number;
  sourcePort?: string;
  targetPort?: string;
}
