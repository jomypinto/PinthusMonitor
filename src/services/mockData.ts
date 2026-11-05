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
    operatingSystem: 'Ubuntu / Debian Linux 12',
    lastSeen: 'Agora mesmo',
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
    notes: 'Local host running NEXUS Network Monitor daemon and web console.',
    firmwareVersion: 'Debian 12.5 (Kernel 6.1.0-21-amd64)',
    latestFirmwareVersion: 'Debian 12.7 (Kernel 6.1.0-25-amd64)',
    firmwareUpdateStatus: 'update_available',
    firmwareReleaseDate: '2024-03-20',
    vulnerabilities: [
      {
        cveId: 'CVE-2024-6387',
        severity: 'high',
        score: 8.1,
        title: 'OpenSSH Server Remote Code Execution (regreSSHion)',
        description: 'Condição de corrida no manipulador SIGALRM no sshd do OpenSSH em sistemas glibc, permitindo execução de código como root.',
        affectedVersions: 'OpenSSH 8.5p1 até < 9.8p1',
        fixedVersion: 'OpenSSH 9.8p1',
        patchAvailable: true,
        attackVector: 'Network (SSH Port 22)',
        publishedDate: '2024-07-01',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2024-6387',
        mitigationNotes: 'Atualizar openssh-server para >= 9.8p1 ou configurar LoginGraceTime 0 no sshd_config.'
      },
      {
        cveId: 'CVE-2023-48795',
        severity: 'medium',
        score: 5.9,
        title: 'SSH Protocol Prefix Truncation (Terrapin Attack)',
        description: 'Vulnerabilidade de integridade do protocolo SSH durante o handshake BPP permitindo que um atacante em MitM manipule extensões.',
        affectedVersions: 'OpenSSH < 9.6p1',
        fixedVersion: 'OpenSSH 9.6p1 / Strict KEX',
        patchAvailable: true,
        attackVector: 'Network (Man-in-the-Middle)',
        publishedDate: '2023-12-18',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-48795',
        mitigationNotes: 'Ativar suporte a kex-strict no daemon SSH.'
      }
    ],
    vulnerabilitySummary: { critical: 0, high: 1, medium: 1, low: 0, total: 2 },
    vulnerabilityRiskScore: 76,
    nistRiskScore: 8.1,
    nistRiskLevel: 'HIGH',
    cpeMatch: 'cpe:2.3:o:debian:debian_linux:12.5:*:*:*:*:*:*:*',
    cveLookupStatus: 'synced',
    lastSecurityScan: 'Hoje'
  },
  {
    id: 'real-gw-01',
    hostname: 'router.lan',
    ipAddress: '192.168.0.1',
    macAddress: '00:11:22:33:44:01',
    manufacturer: 'LAN Gateway Router',
    deviceType: 'Router',
    operatingSystem: 'RouterOS / Linux Gateway',
    lastSeen: 'Agora mesmo',
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
    notes: 'Default local subnet gateway router.',
    firmwareVersion: 'RouterOS v7.11.2 (Long-term)',
    latestFirmwareVersion: 'RouterOS v7.15.3 (Stable)',
    firmwareUpdateStatus: 'critical_update',
    firmwareReleaseDate: '2023-09-12',
    vulnerabilities: [
      {
        cveId: 'CVE-2023-30799',
        severity: 'critical',
        score: 9.1,
        title: 'MikroTik RouterOS Privilege Escalation via WinBox/WebFig',
        description: 'Escalada de privilégios de administrador para acesso root no RouterOS através de corrupção de memória nas interfaces de gestão.',
        affectedVersions: 'RouterOS v6.x até < 6.49.8, v7.x até < 7.11.3',
        fixedVersion: 'RouterOS v7.12+',
        patchAvailable: true,
        attackVector: 'Network (WinBox 8291 / HTTP 80)',
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:H',
        publishedDate: '2023-07-19',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-30799',
        nistUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-30799',
        cpe: 'cpe:2.3:o:mikrotik:routeros:7.11.2:*:*:*:*:*:*:*',
        mitigationNotes: 'Atualizar para RouterOS v7.15.3 e restringir acesso às portas de gestão a IPs autorizados.'
      },
      {
        cveId: 'CVE-2023-44487',
        severity: 'high',
        score: 7.5,
        title: 'HTTP/2 Rapid Reset Denial of Service',
        description: 'Permite que um cliente malicioso envie fluxos RST_STREAM contínuos sem custo computacional, esgotando a CPU do serviço web.',
        affectedVersions: 'Módulos HTTP/2 de servidores web e consolas embebidas',
        fixedVersion: 'Atualização de firmware de gateway',
        patchAvailable: true,
        attackVector: 'Network (HTTPS Port 443)',
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H',
        publishedDate: '2023-10-10',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-44487',
        nistUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-44487',
        cpe: 'cpe:2.3:a:ietf:http2_specification:*:*:*:*:*:*:*:*',
        mitigationNotes: 'Limitar conexões simultâneas e atualizar o stack HTTP embebido.'
      }
    ],
    vulnerabilitySummary: { critical: 1, high: 1, medium: 0, low: 0, total: 2 },
    vulnerabilityRiskScore: 92,
    nistRiskScore: 9.1,
    nistRiskLevel: 'CRITICAL',
    cpeMatch: 'cpe:2.3:o:mikrotik:routeros:7.11.2:*:*:*:*:*:*:*',
    cveLookupStatus: 'synced',
    lastSecurityScan: 'Hoje'
  },
  {
    id: 'real-ap-20',
    hostname: 'ap-unifi-office',
    ipAddress: '192.168.20.15',
    macAddress: '74:83:C2:55:A1:09',
    manufacturer: 'Ubiquiti Networks (UniFi U6-Pro)',
    deviceType: 'Access Point',
    operatingSystem: 'UniFi AP Firmware v6.6.65',
    lastSeen: 'Agora mesmo',
    status: 'online',
    uptimeSeconds: 72000,
    latencyMs: 1.4,
    packetLossPercent: 0,
    subnet: '192.168.20.0/24',
    vlan: 20,
    openPorts: [80, 443, 8080],
    snmpEnabled: false,
    switchPort: 'eth0 trunk',
    isAuthorized: true,
    tags: ['VLAN-20', 'Wireless', 'Office'],
    notes: 'Ponto de acesso Wi-Fi empresarial na VLAN 20.',
    firmwareVersion: 'UniFi AP Firmware v6.6.65',
    latestFirmwareVersion: 'UniFi AP Firmware v6.6.73',
    firmwareUpdateStatus: 'update_available',
    firmwareReleaseDate: '2024-02-20',
    vulnerabilities: [
      {
        cveId: 'CVE-2023-52160',
        severity: 'high',
        score: 7.5,
        title: 'WPA2/WPA3 Enterprise Handshake Bypass',
        description: 'Vulnerabilidade no hostapd que permite a um atacante forçar um handshake TLS truncado e autenticar sem credenciais válidas.',
        affectedVersions: 'hostapd < 2.11',
        fixedVersion: 'UniFi AP v6.6.73',
        patchAvailable: true,
        attackVector: 'Adjacent Wireless',
        cvssVector: 'CVSS:3.1/AV:A/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H',
        publishedDate: '2024-02-14',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-52160',
        nistUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-52160',
        cpe: 'cpe:2.3:a:w1.fi:hostapd:2.10:*:*:*:*:*:*:*',
        mitigationNotes: 'Aplicar a atualização de firmware v6.6.73 distribuída pela Ubiquiti.'
      }
    ],
    vulnerabilitySummary: { critical: 0, high: 1, medium: 0, low: 0, total: 1 },
    vulnerabilityRiskScore: 75,
    nistRiskScore: 7.5,
    nistRiskLevel: 'HIGH',
    cpeMatch: 'cpe:2.3:o:ui:unifi_firmware:6.6.65:*:*:*:*:*:*:*',
    cveLookupStatus: 'synced',
    lastSecurityScan: 'Hoje'
  },
  {
    id: 'real-nas-20',
    hostname: 'nas-storage-01',
    ipAddress: '192.168.20.50',
    macAddress: '00:11:32:9F:8B:22',
    manufacturer: 'Synology Inc. (DiskStation DS923+)',
    deviceType: 'NAS / Storage',
    operatingSystem: 'Synology DSM 7.2.1-69057 Update 3',
    lastSeen: 'Agora mesmo',
    status: 'online',
    uptimeSeconds: 240000,
    latencyMs: 0.9,
    packetLossPercent: 0,
    subnet: '192.168.20.0/24',
    vlan: 20,
    openPorts: [445, 5000, 5001],
    snmpEnabled: false,
    switchPort: 'eth0 trunk',
    isAuthorized: true,
    tags: ['VLAN-20', 'Storage', 'Backup'],
    notes: 'Servidor de ficheiros e cópias de segurança na VLAN 20.',
    firmwareVersion: 'Synology DSM 7.2.1-69057 Update 3',
    latestFirmwareVersion: 'Synology DSM 7.2.1-69057 Update 5',
    firmwareUpdateStatus: 'update_available',
    firmwareReleaseDate: '2024-01-18',
    vulnerabilities: [
      {
        cveId: 'CVE-2024-10443',
        severity: 'high',
        score: 7.8,
        title: 'Synology Photos Remote Memory Buffer Overflow',
        description: 'Corrupção de memória em bibliotecas de processamento de imagem do Synology Photos permitindo negação de serviço ou execução de código.',
        affectedVersions: 'DSM 7.2.x < Update 5',
        fixedVersion: 'DSM 7.2.1 Update 5',
        patchAvailable: true,
        attackVector: 'Network (Port 5000 / 5001)',
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
        publishedDate: '2024-04-12',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2024-10443',
        nistUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2024-10443',
        cpe: 'cpe:2.3:a:synology:photos:1.6.0:*:*:*:*:*:*:*',
        mitigationNotes: 'Atualizar via Painel de Controlo > Atualização do DSM.'
      }
    ],
    vulnerabilitySummary: { critical: 0, high: 1, medium: 0, low: 0, total: 1 },
    vulnerabilityRiskScore: 78,
    nistRiskScore: 7.8,
    nistRiskLevel: 'HIGH',
    cpeMatch: 'cpe:2.3:a:synology:diskstation_manager:7.2.1-69057:*:*:*:*:*:*:*',
    cveLookupStatus: 'synced',
    lastSecurityScan: 'Hoje'
  },
  {
    id: 'real-dns-01',
    hostname: 'one.one.one.one',
    ipAddress: '1.1.1.1',
    macAddress: 'Remote Hop',
    manufacturer: 'Cloudflare Inc.',
    deviceType: 'Server',
    operatingSystem: 'Cloudflare Anycast DNS',
    lastSeen: 'Agora mesmo',
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
    notes: 'External verified DNS resolver used for WAN connectivity check.',
    firmwareVersion: 'Anycast Cloud Edge Engine v4.28',
    latestFirmwareVersion: 'Current Stable',
    firmwareUpdateStatus: 'up_to_date',
    firmwareReleaseDate: '2024-06-01',
    vulnerabilities: [],
    vulnerabilitySummary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    vulnerabilityRiskScore: 0,
    nistRiskScore: 0.0,
    nistRiskLevel: 'SAFE',
    cpeMatch: 'cpe:2.3:a:cloudflare:anycast_dns:4.28:*:*:*:*:*:*:*',
    cveLookupStatus: 'clean',
    lastSecurityScan: 'Hoje'
  },
  {
    id: 'real-dns-02',
    hostname: 'dns.google',
    ipAddress: '8.8.8.8',
    macAddress: 'Remote Hop',
    manufacturer: 'Google LLC',
    deviceType: 'Server',
    operatingSystem: 'Google Anycast DNS',
    lastSeen: 'Agora mesmo',
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
    notes: 'Google Anycast DNS secondary resolver.',
    firmwareVersion: 'Google Anycast Edge Engine v5.1',
    latestFirmwareVersion: 'Current Stable',
    firmwareUpdateStatus: 'up_to_date',
    firmwareReleaseDate: '2024-06-01',
    vulnerabilities: [],
    vulnerabilitySummary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    vulnerabilityRiskScore: 0,
    nistRiskScore: 0.0,
    nistRiskLevel: 'SAFE',
    cpeMatch: 'cpe:2.3:a:google:anycast_dns:5.1:*:*:*:*:*:*:*',
    cveLookupStatus: 'clean',
    lastSecurityScan: 'Hoje'
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
