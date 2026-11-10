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
    id: 'real-gw-20',
    hostname: 'gw-vlan20.lan',
    ipAddress: '192.168.20.1',
    macAddress: '00:11:22:33:44:20',
    manufacturer: 'LAN Gateway Router (VLAN 20)',
    deviceType: 'Router',
    operatingSystem: 'RouterOS / Linux Gateway (VLAN 20)',
    lastSeen: 'Agora mesmo',
    status: 'online',
    uptimeSeconds: 3628800,
    latencyMs: 0.52,
    packetLossPercent: 0,
    subnet: '192.168.20.0/24',
    vlan: 20,
    openPorts: [53, 443],
    snmpEnabled: false,
    switchPort: 'eth0 trunk',
    isAuthorized: true,
    tags: ['Gateway', 'VLAN-20', 'Routing'],
    notes: 'Interface de gateway e roteamento da sub-rede 192.168.20.0/24.',
    vulnerabilities: [],
    vulnerabilitySummary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    vulnerabilityRiskScore: 0,
    nistRiskScore: 0.0,
    nistRiskLevel: 'SAFE'
  }
];

export const INITIAL_SERVER_METRICS: LocalServerMetrics = {
  serverHostname: 'nexus-node',
  ipAddress: '192.168.0.13',
  operatingSystem: 'Debian GNU/Linux 12 (bookworm)',
  kernelVersion: 'Linux 6.1.0-21-amd64 x86_64',
  uptimeHours: 360.0,
  collectorVersion: 'nexus-prober-v1.4.2 (Live Linux Kernel)',
  cpu: {
    utilizationPercent: 3.5,
    cores: 4,
    loadAverage: [0.12, 0.08, 0.05],
    temperatureCelsius: 38.0
  },
  memory: {
    totalBytes: 8589934592, // 8.0 GB
    usedBytes: 1717986918,  // ~1.6 GB
    cachedBytes: 1200000000,
    freeBytes: 6871947674,  // ~6.4 GB
    percentUsed: 20.0
  },
  disk: {
    mountPoint: '/',
    totalBytes: 256000000000, // 256 GB
    usedBytes: 32000000000,   // 32 GB
    freeBytes: 224000000000,
    percentUsed: 12.5,
    ioReadBps: 2097152,
    ioWriteBps: 1048576
  },
  interfaces: [
    {
      name: 'eth0',
      ipAddress: '192.168.0.13/24',
      macAddress: '00:15:5d:02:11:4a',
      speedMbps: 1000,
      rxBytesPerSec: 35088691,
      txBytesPerSec: 28411470,
      rxPacketsPerSec: 29269,
      txPacketsPerSec: 24305,
      errors: 0,
      dropped: 0,
      status: 'up'
    }
  ]
};

export const INITIAL_EVENTS: NetworkEvent[] = [
  {
    id: 'evt-audit-01',
    timestamp: '2026-11-06 09:30:00',
    deviceId: 'real-gw-01',
    deviceName: 'router.lan',
    ipAddress: '192.168.0.1',
    eventType: 'snmp_trap',
    severity: 'info',
    description: 'Verificação periódica ICMP ao Gateway LAN 192.168.0.1 concluída com sucesso (RTT: 0.42ms). Rota nominal.',
    acknowledged: true,
    acknowledgedBy: 'system'
  },
  {
    id: 'evt-audit-20',
    timestamp: '2026-11-06 09:25:00',
    deviceId: 'real-ap-20',
    deviceName: 'ap-unifi-office',
    ipAddress: '192.168.20.15',
    eventType: 'snmp_trap',
    severity: 'info',
    description: 'Canal de radiofrequência e enlace do ponto de acesso UniFi 192.168.20.15 validados na VLAN 20.',
    acknowledged: true,
    acknowledgedBy: 'system'
  },
  {
    id: 'evt-nas-01',
    timestamp: '2026-11-06 09:15:00',
    deviceId: 'real-nas-20',
    deviceName: 'nas-storage-01',
    ipAddress: '192.168.20.50',
    eventType: 'host_recovered',
    severity: 'info',
    description: 'Servidor de ficheiros Synology NAS 192.168.20.50 com volume de armazenamento e conectividade operacional.',
    acknowledged: true,
    acknowledgedBy: 'system'
  }
];

export const INITIAL_SUBNETS: SubnetScanRange[] = [
  {
    id: 'real-sub-1',
    name: 'Sub-rede Principal LAN (192.168.0.0/24)',
    cidr: '192.168.0.0/24',
    vlan: 1,
    description: 'Sub-rede física local autorizada (VLAN 1 - Gateway e Nó NEXUS)',
    isAuthorized: true,
    probeType: 'ARP+ICMP',
    rateLimitPps: 150,
    enabled: true,
    lastScanned: 'Recentemente'
  },
  {
    id: 'real-sub-2',
    name: 'Sub-rede VLAN 20 (192.168.20.0/24)',
    cidr: '192.168.20.0/24',
    vlan: 20,
    description: 'Sub-rede autorizada VLAN 20 (Armazenamento NAS e Wi-Fi UniFi)',
    isAuthorized: true,
    probeType: 'ARP+ICMP',
    rateLimitPps: 150,
    enabled: true,
    lastScanned: 'Recentemente'
  }
];

export const INITIAL_TOP_TALKERS: TrafficTalker[] = [
  {
    ipAddress: '192.168.0.13',
    hostname: 'nexus-node',
    macAddress: '00:15:5d:02:11:4a',
    bytesIn: 24500000,
    bytesOut: 18900000,
    totalBytes: 43400000,
    percentage: 42.5,
    primaryProtocol: 'HTTP / Web Console (Port 3000)'
  },
  {
    ipAddress: '192.168.0.1',
    hostname: 'router.lan',
    macAddress: '00:11:22:33:44:01',
    bytesIn: 18200000,
    bytesOut: 12500000,
    totalBytes: 30700000,
    percentage: 30.1,
    primaryProtocol: 'DNS & Gateway Forwarding'
  },
  {
    ipAddress: '192.168.20.50',
    hostname: 'nas-storage-01',
    macAddress: '00:11:32:9F:8B:22',
    bytesIn: 12400000,
    bytesOut: 5600000,
    totalBytes: 18000000,
    percentage: 17.6,
    primaryProtocol: 'SMB / CIFS Storage Backup'
  },
  {
    ipAddress: '192.168.20.15',
    hostname: 'ap-unifi-office',
    macAddress: '74:83:C2:55:A1:09',
    bytesIn: 6800000,
    bytesOut: 3200000,
    totalBytes: 10000000,
    percentage: 9.8,
    primaryProtocol: 'Wi-Fi 6 Wireless Bridge'
  }
];

export const INITIAL_PROTOCOLS: ProtocolStat[] = [
  { protocol: 'HTTP / Web Application (Port 3000)', port: 3000, sharePercent: 52.4, bytesTotal: 28000000, category: 'Web' },
  { protocol: 'DNS Name Resolution (Port 53)', port: 53, sharePercent: 24.1, bytesTotal: 12000000, category: 'Infrastructure' },
  { protocol: 'SMB / CIFS Storage Traffic (Port 445)', port: 445, sharePercent: 14.5, bytesTotal: 7500000, category: 'File Transfer' },
  { protocol: 'ICMP Echo / Diagnostic Probes', port: 1, sharePercent: 9.0, bytesTotal: 4500000, category: 'Management' }
];

export const INITIAL_CONNECTION_LINKS: ConnectionLink[] = [
  { sourceId: 'real-host-01', targetId: 'real-gw-01', linkType: 'gateway', speedMbps: 1000, status: 'up', vlan: 1, sourcePort: 'eth0', targetPort: 'ether1 (LAN-Core)' },
  { sourceId: 'real-gw-01', targetId: 'real-gw-20', linkType: 'trunk', speedMbps: 10000, status: 'up', vlan: 20, sourcePort: 'trunk0', targetPort: 'vlan20' },
  { sourceId: 'real-ap-20', targetId: 'real-gw-20', linkType: 'wireless', speedMbps: 1200, status: 'up', vlan: 20, sourcePort: 'eth0 (PoE)', targetPort: 'ether2 (VLAN-20)' },
  { sourceId: 'real-nas-20', targetId: 'real-gw-20', linkType: 'ethernet', speedMbps: 10000, status: 'up', vlan: 20, sourcePort: 'bond0 (LACP)', targetPort: 'ether3 (Storage-VLAN20)' }
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
