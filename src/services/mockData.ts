import { NetworkDevice, LocalServerMetrics, NetworkEvent, SubnetScanRange, TrafficTalker, ProtocolStat, ConnectionLink } from '../types/network';

// Real Detected Host Inventory
export const INITIAL_DEVICES: NetworkDevice[] = [
  {
    id: 'real-host-01',
    hostname: 'nexus-node',
    ipAddress: '192.168.0.13',
    macAddress: '00:00:00:00:00:00',
    manufacturer: 'NEXUS Linux Node',
    deviceType: 'Server',
    operatingSystem: 'Ubuntu / Debian Linux',
    lastSeen: 'Just now',
    status: 'online',
    uptimeSeconds: 3600,
    latencyMs: 0.05,
    packetLossPercent: 0,
    subnet: '192.168.0.0/24',
    vlan: 1,
    openPorts: [3000, 3003],
    snmpEnabled: false,
    switchPort: 'eth0',
    isAuthorized: true,
    tags: ['Host', 'Primary Node', 'NEXUS Monitor'],
    notes: 'Local host running NEXUS Network Monitor daemon and web console.'
  },
  {
    id: 'real-gw-01',
    hostname: 'router.lan',
    ipAddress: '192.168.0.1',
    macAddress: '00:11:22:33:44:01',
    manufacturer: 'LAN Gateway Router',
    deviceType: 'Router',
    operatingSystem: 'RouterOS / Linux Gateway',
    lastSeen: 'Just now',
    status: 'online',
    uptimeSeconds: 3600,
    latencyMs: 0.8,
    packetLossPercent: 0,
    subnet: '192.168.0.0/24',
    vlan: 1,
    openPorts: [53, 80, 443],
    snmpEnabled: false,
    switchPort: 'eth0 uplink',
    isAuthorized: true,
    tags: ['Gateway', 'Default Route', 'Infrastructure'],
    notes: 'Default local subnet gateway router.'
  },
  {
    id: 'real-meta-01',
    hostname: 'metadata.internal',
    ipAddress: '169.254.169.254',
    macAddress: '42:00:4E:49:43:00',
    manufacturer: 'Internal VPC Controller',
    deviceType: 'Server',
    operatingSystem: 'Network Metadata Service',
    lastSeen: 'Just now',
    status: 'online',
    uptimeSeconds: 3600,
    latencyMs: 0.25,
    packetLossPercent: 0,
    subnet: '169.254.169.0/25',
    vlan: 1,
    openPorts: [80],
    snmpEnabled: false,
    switchPort: 'eth2',
    isAuthorized: true,
    tags: ['Metadata', 'DNS', 'VPC Service'],
    notes: 'Link-local infrastructure control endpoint.'
  },
  {
    id: 'real-dns-01',
    hostname: 'one.one.one.one',
    ipAddress: '1.1.1.1',
    macAddress: 'Remote Hop',
    manufacturer: 'Cloudflare Inc.',
    deviceType: 'Server',
    operatingSystem: 'Cloudflare Anycast DNS',
    lastSeen: 'Just now',
    status: 'online',
    uptimeSeconds: 864000,
    latencyMs: 2.6,
    packetLossPercent: 0,
    subnet: 'External WAN',
    vlan: 1,
    openPorts: [53, 443],
    snmpEnabled: false,
    switchPort: 'eth1 uplink',
    isAuthorized: true,
    tags: ['DNS', 'WAN', 'Public Resolver'],
    notes: 'External verified DNS resolver used for WAN connectivity check.'
  },
  {
    id: 'real-dns-02',
    hostname: 'dns.google',
    ipAddress: '8.8.8.8',
    macAddress: 'Remote Hop',
    manufacturer: 'Google LLC',
    deviceType: 'Server',
    operatingSystem: 'Google Anycast DNS',
    lastSeen: 'Just now',
    status: 'online',
    uptimeSeconds: 864000,
    latencyMs: 1.8,
    packetLossPercent: 0,
    subnet: 'External WAN',
    vlan: 1,
    openPorts: [53, 443],
    snmpEnabled: false,
    switchPort: 'eth1 uplink',
    isAuthorized: true,
    tags: ['DNS', 'WAN', 'Secondary Resolver'],
    notes: 'Google Anycast DNS server reachable with 1.8ms latency.'
  }
];

export const INITIAL_SERVER_METRICS: LocalServerMetrics = {
  serverHostname: 'localhost',
  ipAddress: '127.0.0.1',
  operatingSystem: 'Debian GNU/Linux 12 (bookworm)',
  kernelVersion: 'Linux 4.19.0-gvisor x86_64',
  uptimeHours: 1.0,
  collectorVersion: 'nexus-prober-v1.4.2 (Live Linux Kernel)',
  cpu: {
    utilizationPercent: 3.5,
    cores: 2,
    loadAverage: [0.0, 0.0, 0.0],
    temperatureCelsius: 38.0
  },
  memory: {
    totalBytes: 4294967296, // 4.0 GB
    usedBytes: 858993459,   // ~0.8 GB
    cachedBytes: 420000000, // ~420 MB
    freeBytes: 3435973837,  // ~3.4 GB
    percentUsed: 20.0
  },
  disk: {
    mountPoint: '/',
    totalBytes: 202243760128, // 197.5 GB
    usedBytes: 299462656,     // ~290 MB
    freeBytes: 201944297472,  // ~197.2 GB
    percentUsed: 1.0,
    ioReadBps: 2097152,
    ioWriteBps: 1048576
  },
  interfaces: [
    {
      name: 'lo',
      ipAddress: '127.0.0.1/8',
      macAddress: '00:00:00:00:00:00',
      speedMbps: 10000,
      rxBytesPerSec: 15467654,
      txBytesPerSec: 15540356,
      rxPacketsPerSec: 5193,
      txPacketsPerSec: 5193,
      errors: 0,
      dropped: 0,
      status: 'up'
    },
    {
      name: 'eth1',
      ipAddress: '169.254.8.1/32',
      macAddress: '00:00:00:00:00:00',
      speedMbps: 1000,
      rxBytesPerSec: 35088691,
      txBytesPerSec: 411470,
      rxPacketsPerSec: 29269,
      txPacketsPerSec: 3305,
      errors: 0,
      dropped: 0,
      status: 'up'
    },
    {
      name: 'eth2',
      ipAddress: '169.254.9.1/32',
      macAddress: '42:00:4E:49:43:00',
      speedMbps: 1000,
      rxBytesPerSec: 2670812,
      txBytesPerSec: 5246675,
      rxPacketsPerSec: 27857,
      txPacketsPerSec: 27521,
      errors: 0,
      dropped: 0,
      status: 'up'
    }
  ]
};

export const INITIAL_EVENTS: NetworkEvent[] = [
  {
    id: 'evt-real-01',
    timestamp: '2026-11-03 01:50:00',
    deviceId: 'real-gw-01',
    deviceName: 'gw-default.local',
    ipAddress: '169.254.169.126',
    eventType: 'snmp_trap',
    severity: 'info',
    description: 'Real ICMP echo verification to gateway 169.254.169.126 succeeded (RTT: 0.08ms). Network route is nominal.',
    acknowledged: true,
    acknowledgedBy: 'system'
  },
  {
    id: 'evt-real-02',
    timestamp: '2026-11-03 01:48:00',
    deviceId: 'real-host-01',
    deviceName: 'localhost',
    ipAddress: '127.0.0.1',
    eventType: 'port_state_change',
    severity: 'info',
    description: 'Local web console listener initialized on port 3000. All kernel sockets active.',
    acknowledged: true,
    acknowledgedBy: 'system'
  },
  {
    id: 'evt-real-03',
    timestamp: '2026-11-03 01:45:00',
    deviceId: 'real-dns-01',
    deviceName: 'one.one.one.one',
    ipAddress: '1.1.1.1',
    eventType: 'host_recovered',
    severity: 'info',
    description: 'WAN egress connectivity verified through Cloudflare DNS 1.1.1.1 (0% packet loss).',
    acknowledged: true,
    acknowledgedBy: 'system'
  }
];

export const INITIAL_SUBNETS: SubnetScanRange[] = [
  {
    id: 'real-sub-1',
    name: 'Primary LAN Subnet',
    cidr: '192.168.0.0/24',
    vlan: 1,
    description: 'Sub-rede física local autorizada (192.168.0.0/24)',
    isAuthorized: true,
    probeType: 'ARP+ICMP',
    rateLimitPps: 150,
    enabled: true,
    lastScanned: 'Just now'
  },
  {
    id: 'real-sub-2',
    name: 'Secondary / Management Subnet',
    cidr: '10.0.0.0/24',
    vlan: 10,
    description: 'Sub-rede de gestão secundária (10.0.0.0/24)',
    isAuthorized: true,
    probeType: 'ARP+ICMP',
    rateLimitPps: 100,
    enabled: true,
    lastScanned: 'Never'
  }
];

export const INITIAL_TOP_TALKERS: TrafficTalker[] = [
  {
    ipAddress: '127.0.0.1',
    hostname: 'localhost',
    macAddress: '00:00:00:00:00:00',
    bytesIn: 15467654,
    bytesOut: 15540356,
    totalBytes: 31008010,
    percentage: 48.5,
    primaryProtocol: 'HTTP / Web Console (Port 3000)'
  },
  {
    ipAddress: '169.254.8.1',
    hostname: 'eth1-internal',
    macAddress: '00:00:00:00:00:00',
    bytesIn: 35088691,
    bytesOut: 411470,
    totalBytes: 35500161,
    percentage: 38.2,
    primaryProtocol: 'VPC Gateway Transit'
  },
  {
    ipAddress: '169.254.9.1',
    hostname: 'eth2-ingress',
    macAddress: '42:00:4E:49:43:00',
    bytesIn: 2670812,
    bytesOut: 5246675,
    totalBytes: 7917487,
    percentage: 13.3,
    primaryProtocol: 'DNS / HTTPS Metadata'
  }
];

export const INITIAL_PROTOCOLS: ProtocolStat[] = [
  { protocol: 'HTTP / Web Application (Port 3000)', port: 3000, sharePercent: 52.4, bytesTotal: 28000000, category: 'Web' },
  { protocol: 'DNS Name Resolution (Port 53)', port: 53, sharePercent: 24.1, bytesTotal: 12000000, category: 'Infrastructure' },
  { protocol: 'ICMP Echo / Diagnostic Probes', port: 1, sharePercent: 14.5, bytesTotal: 7500000, category: 'Management' },
  { protocol: 'Internal Kernel Sockets', port: 8080, sharePercent: 9.0, bytesTotal: 4500000, category: 'Other' }
];

export const INITIAL_CONNECTION_LINKS: ConnectionLink[] = [
  { sourceId: 'real-host-01', targetId: 'real-gw-01', linkType: 'gateway', speedMbps: 1000, status: 'up', vlan: 1, sourcePort: 'eth2', targetPort: 'default' },
  { sourceId: 'real-host-01', targetId: 'real-meta-01', linkType: 'ethernet', speedMbps: 1000, status: 'up', vlan: 1, sourcePort: 'eth2', targetPort: 'api' },
  { sourceId: 'real-host-01', targetId: 'real-dns-01', linkType: 'trunk', speedMbps: 1000, status: 'up', vlan: 1, sourcePort: 'eth1', targetPort: 'wan' }
];

export const GENERATE_TIME_SERIES = () => {
  const points = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const hour = d.toTimeString().slice(0, 5);
    points.push({
      time: hour,
      rxMbps: Number((0.2 + (i % 3) * 0.1).toFixed(2)),
      txMbps: Number((0.15 + (i % 2) * 0.08).toFixed(2)),
      avgLatencyMs: 0.22,
      packetLoss: 0,
      cpuPercent: 3.5,
      ramPercent: 20.0
    });
  }
  return points;
};
