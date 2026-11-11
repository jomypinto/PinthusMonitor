import { DeviceComplianceSummary } from './compliance';

export type DeviceStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export type DeviceType = 
  | 'Server'
  | 'Router'
  | 'Switch'
  | 'Firewall'
  | 'Access Point'
  | 'AccessPoint'
  | 'Workstation'
  | 'NAS / Storage'
  | 'Storage'
  | 'Printer'
  | 'IoT / Embedded'
  | 'IoT'
  | 'Camera'
  | 'VoIP'
  | 'Virtual Machine';

export type NistRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export type FirmwareUpdateStatus = 'up_to_date' | 'update_available' | 'critical_update' | 'unknown';

export interface FirmwarePackageInfo {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  deviceType: string;
  currentVersion: string;
  latestVersion: string;
  updateStatus: FirmwareUpdateStatus;
  packageName: string;
  downloadSizeMb: number;
  sha256: string;
  vendorCdn: string;
  releaseDate: string;
  rebootRequired: boolean;
  estimatedDowntimeSeconds: number;
  releaseNotes: string;
  resolvedCves: string[];
  improvements: string[];
}

export interface VulnerabilityItem {
  cveId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  score: number; // CVSS v3.1 base score, e.g. 9.8
  title: string;
  description: string;
  affectedVersions: string;
  fixedVersion?: string;
  patchAvailable: boolean;
  attackVector?: string;
  cvssVector?: string;
  publishedDate?: string;
  advisoryUrl?: string;
  nistUrl?: string;
  cpe?: string;
  mitigationNotes?: string;
}

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

  // Firmware & Security Posture
  firmwareVersion?: string;
  latestFirmwareVersion?: string;
  firmwareUpdateStatus?: FirmwareUpdateStatus;
  firmwareReleaseDate?: string;
  vulnerabilities?: VulnerabilityItem[];
  vulnerabilitySummary?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  vulnerabilityRiskScore?: number; // 0-100
  nistRiskScore?: number; // 0.0 - 10.0 CVSS scale
  nistRiskLevel?: NistRiskLevel;
  cpeMatch?: string;
  lastSecurityScan?: string;
  cveLookupStatus?: 'synced' | 'pending' | 'scanning' | 'clean' | 'error';

  // Compliance Policy & CIS Benchmarks
  compliance?: DeviceComplianceSummary;

  // Uptime & Connectivity Monitoring
  outageCount?: number;
  lastOutage?: string | null;
  availabilitySla?: number; // e.g. 99.95
}

export interface ConnectivityIncident {
  id: string;
  timestamp: string;
  deviceName: string;
  ipAddress: string;
  subnet: string;
  vlan?: number;
  eventType: 'host_unreachable' | 'packet_loss_spike' | 'host_recovered' | 'connectivity_batch_audit' | 'high_latency';
  severity: 'critical' | 'warning' | 'info';
  durationMinutes?: number;
  packetLossPercent?: number;
  latencyMs?: number;
  description: string;
  acknowledged?: boolean;
}

export interface SubnetHealthSummary {
  cidr: string;
  name: string;
  vlan: number;
  totalDevices: number;
  onlineDevices: number;
  degradedDevices: number;
  offlineDevices: number;
  avgLatencyMs: number;
  avgPacketLoss: number;
  uptimeSlaPercent: number;
  outagesCount: number;
  lastTestedAt?: string;
}

export * from './compliance';

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
    | 'host_unreachable'
    | 'host_recovered'
    | 'high_latency'
    | 'packet_loss'
    | 'packet_loss_spike'
    | 'connectivity_batch_audit'
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

export type SubnetConfig = SubnetScanRange;

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
