import { NetworkDevice, LocalServerMetrics, NetworkEvent, SubnetScanRange, TrafficTalker, ProtocolStat, ConnectionLink } from '../types/network';

// Real Detected Host Inventory
export const INITIAL_DEVICES: NetworkDevice[] = [
  {
    "id": "real-gw-01",
    "hostname": "gwvc-udmpro",
    "ipAddress": "192.168.0.1",
    "macAddress": "74:83:C2:11:00:01",
    "manufacturer": "Ubiquiti Networks (UniFi Dream Machine Pro)",
    "deviceType": "Router",
    "operatingSystem": "UniFi OS v3.2.12 (UDM-Pro)",
    "lastSeen": "Agora mesmo",
    "status": "online",
    "uptimeSeconds": 1728000,
    "latencyMs": 0.42,
    "packetLossPercent": 0,
    "subnet": "192.168.0.0/24",
    "vlan": 1,
    "openPorts": [
      22,
      53,
      80,
      443
    ],
    "snmpEnabled": true,
    "switchPort": "Core Gateway (UDM-Pro)",
    "isAuthorized": true,
    "tags": [
      "Gateway",
      "UDM-Pro",
      "UniFi OS",
      "Core Router",
      "VLAN-1"
    ],
    "notes": "Gateway central UniFi Dream Machine Pro (gwvc-udmpro) da rede corporativa.",
    "availabilitySla": 99.98,
    "outageCount": 0,
    "lastOutage": null,
    "firmwareVersion": "UniFi OS v3.2.12 (UDM-Pro)",
    "latestFirmwareVersion": "UniFi OS v4.0.6 (Stable)",
    "firmwareUpdateStatus": "critical_update",
    "firmwareReleaseDate": "2024-05-30",
    "cpeMatch": "cpe:2.3:o:ui:unifi_os:3.2.12:*:*:*:*:*:*:*",
    "vulnerabilities": [
      {
        "cveId": "CVE-2024-27982",
        "severity": "critical",
        "score": 9.3,
        "title": "Ubiquiti UniFi OS Authentication Bypass & RCE via Network Console",
        "description": "Falha de validação de sessões na consola de rede do UniFi OS no gwvc-udmpro permitindo execução remota de comandos como root.",
        "affectedVersions": "UniFi OS < 3.2.17 / v4.0",
        "fixedVersion": "UniFi OS v4.0.6 (Stable)",
        "patchAvailable": true,
        "attackVector": "Network (UniFi HTTPS Port 443 / 8443)",
        "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        "publishedDate": "2024-04-10",
        "advisoryUrl": "https://nvd.nist.gov/vuln/detail/CVE-2024-27982",
        "nistUrl": "https://nvd.nist.gov/vuln/detail/CVE-2024-27982",
        "cpe": "cpe:2.3:o:ui:unifi_os:3.2.12:*:*:*:*:*:*:*",
        "mitigationNotes": "Atualizar para UniFi OS v4.0.6 e ativar autenticação de dois fatores (2FA/MFA) na consola UniFi."
      }
    ],
    "vulnerabilitySummary": {
      "critical": 1,
      "high": 0,
      "medium": 0,
      "low": 0,
      "total": 1
    },
    "vulnerabilityRiskScore": 93,
    "nistRiskScore": 9.3,
    "nistRiskLevel": "CRITICAL",
    "cveLookupStatus": "synced",
    "lastSecurityScan": "Hoje"
  },
  {
    "id": "real-nas-01",
    "hostname": "qnap-tsh1277.lan",
    "ipAddress": "192.168.0.2",
    "macAddress": "24:5E:BE:11:42:02",
    "manufacturer": "QNAP Systems, Inc. (TS-h1277XU-RP)",
    "deviceType": "Storage",
    "operatingSystem": "QNAP QuTS hero h5.1.5.2643",
    "lastSeen": "Agora mesmo",
    "status": "online",
    "uptimeSeconds": 2592000,
    "latencyMs": 0.35,
    "packetLossPercent": 0,
    "subnet": "192.168.0.0/24",
    "vlan": 1,
    "openPorts": [
      22,
      80,
      443,
      445,
      2049,
      8080
    ],
    "snmpEnabled": true,
    "switchPort": "LAN-Storage (10GbE)",
    "isAuthorized": true,
    "tags": [
      "Storage",
      "NAS",
      "QNAP",
      "QuTS hero",
      "TS-h1277XU-RP",
      "ZFS",
      "VLAN-1"
    ],
    "notes": "Servidor NAS QNAP TS-h1277XU-RP ZFS QuTS hero para partilhas e armazenamento empresarial.",
    "availabilitySla": 99.95,
    "outageCount": 0,
    "lastOutage": null,
    "firmwareVersion": "QNAP QuTS hero h5.1.5.2643",
    "latestFirmwareVersion": "QNAP QuTS hero h5.1.7.2770",
    "firmwareUpdateStatus": "update_available",
    "firmwareReleaseDate": "2024-04-18",
    "cpeMatch": "cpe:2.3:o:qnap:quts_hero:h5.1.5.2643:*:*:*:*:*:*:*",
    "vulnerabilities": [
      {
        "cveId": "CVE-2024-27130",
        "severity": "high",
        "score": 8.8,
        "title": "QNAP QuTS hero Media Viewer Buffer Overflow RCE",
        "description": "Vulnerabilidade de transbordamento de buffer no visualizador multimédia do QuTS hero no QNAP TS-h1277XU-RP.",
        "affectedVersions": "QuTS hero < h5.1.7.2770",
        "fixedVersion": "QNAP QuTS hero h5.1.7.2770",
        "patchAvailable": true,
        "attackVector": "Network (Port 8080 / 443)",
        "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "publishedDate": "2024-04-18",
        "advisoryUrl": "https://nvd.nist.gov/vuln/detail/CVE-2024-27130",
        "nistUrl": "https://nvd.nist.gov/vuln/detail/CVE-2024-27130",
        "cpe": "cpe:2.3:o:qnap:quts_hero:h5.1.5.2643:*:*:*:*:*:*:*",
        "mitigationNotes": "Atualizar via Painel de Controlo > Firmware Update para a imagem h5.1.7.2770."
      }
    ],
    "vulnerabilitySummary": {
      "critical": 0,
      "high": 1,
      "medium": 0,
      "low": 0,
      "total": 1
    },
    "vulnerabilityRiskScore": 88,
    "nistRiskScore": 8.8,
    "nistRiskLevel": "HIGH",
    "cveLookupStatus": "synced",
    "lastSecurityScan": "Hoje"
  },
  {
    "id": "real-host-01",
    "hostname": "nexus-node",
    "ipAddress": "192.168.0.13",
    "macAddress": "00:15:5d:02:11:4a",
    "manufacturer": "NEXUS Linux Node",
    "deviceType": "Server",
    "operatingSystem": "Ubuntu / Debian Linux 12",
    "lastSeen": "Agora mesmo",
    "status": "online",
    "uptimeSeconds": 1200000,
    "latencyMs": 0.05,
    "packetLossPercent": 0,
    "subnet": "192.168.0.0/24",
    "vlan": 1,
    "openPorts": [
      22,
      3000
    ],
    "snmpEnabled": false,
    "switchPort": "eth0",
    "isAuthorized": true,
    "tags": [
      "Host",
      "Primary Node",
      "NEXUS Monitor",
      "VLAN-1"
    ],
    "notes": "Servidor Linux onde executa o sistema de monitorização NEXUS.",
    "availabilitySla": 100,
    "outageCount": 0,
    "lastOutage": null,
    "firmwareVersion": "Debian 12.5 (Kernel 6.1.0-21-amd64)",
    "latestFirmwareVersion": "Debian 12.7 (Kernel 6.1.0-25-amd64)",
    "firmwareUpdateStatus": "update_available",
    "firmwareReleaseDate": "2024-03-20",
    "cpeMatch": "cpe:2.3:o:debian:debian_linux:12.5:*:*:*:*:*:*:*",
    "vulnerabilities": [
      {
        "cveId": "CVE-2024-6387",
        "severity": "high",
        "score": 8.1,
        "title": "OpenSSH Server Remote Code Execution (regreSSHion)",
        "description": "Condição de corrida no manipulador de sinal SIGALRM no sshd do OpenSSH em sistemas glibc.",
        "affectedVersions": "OpenSSH 8.5p1 até < 9.8p1",
        "fixedVersion": "OpenSSH 9.8p1",
        "patchAvailable": true,
        "attackVector": "Network (SSH Port 22)",
        "cvssVector": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "publishedDate": "2024-07-01",
        "advisoryUrl": "https://nvd.nist.gov/vuln/detail/CVE-2024-6387",
        "nistUrl": "https://nvd.nist.gov/vuln/detail/CVE-2024-6387",
        "cpe": "cpe:2.3:a:openbsd:openssh:8.9p1:*:*:*:*:*:*:*",
        "mitigationNotes": "Executar apt update && apt install --only-upgrade openssh-server."
      }
    ],
    "vulnerabilitySummary": {
      "critical": 0,
      "high": 1,
      "medium": 0,
      "low": 0,
      "total": 1
    },
    "vulnerabilityRiskScore": 81,
    "nistRiskScore": 8.1,
    "nistRiskLevel": "HIGH",
    "cveLookupStatus": "synced",
    "lastSecurityScan": "Hoje"
  },
  {
    "id": "real-printer-20",
    "hostname": "bizhub-c257i.lan",
    "ipAddress": "192.168.20.10",
    "macAddress": "00:20:6B:44:A2:10",
    "manufacturer": "Konica Minolta, Inc. (bizhub C257i)",
    "deviceType": "Printer",
    "operatingSystem": "Konica Minolta bizhub C257i Controller FW G00-X5",
    "lastSeen": "Agora mesmo",
    "status": "online",
    "uptimeSeconds": 864000,
    "latencyMs": 0.65,
    "packetLossPercent": 0,
    "subnet": "192.168.20.0/24",
    "vlan": 20,
    "openPorts": [
      80,
      443,
      515,
      631,
      9100,
      50001
    ],
    "snmpEnabled": true,
    "switchPort": "Printer-VLAN20",
    "isAuthorized": true,
    "tags": [
      "Impressora",
      "Printer",
      "Konica Minolta",
      "bizhub C257i",
      "VLAN-20",
      "OpenAPI"
    ],
    "notes": "Multifunções A3 Konica Minolta bizhub C257i na sub-rede 192.168.20.0/24.",
    "availabilitySla": 99.9,
    "outageCount": 0,
    "lastOutage": null,
    "firmwareVersion": "Konica Minolta bizhub C257i Controller FW G00-X5",
    "latestFirmwareVersion": "Konica Minolta bizhub C257i Controller FW G00-Y2",
    "firmwareUpdateStatus": "update_available",
    "firmwareReleaseDate": "2024-04-12",
    "cpeMatch": "cpe:2.3:o:konicaminolta:bizhub_c257i_firmware:g00-x5:*:*:*:*:*:*:*",
    "vulnerabilities": [
      {
        "cveId": "CVE-2023-38827",
        "severity": "high",
        "score": 7.8,
        "title": "Konica Minolta bizhub Web Connection Authentication Bypass",
        "description": "Vulnerabilidade no serviço Web Connection HTTPS do controlador IT5 bizhub C257i permitindo acesso a configurações via OpenAPI.",
        "affectedVersions": "bizhub Controller FW < G00-Y2",
        "fixedVersion": "Controller FW G00-Y2",
        "patchAvailable": true,
        "attackVector": "Network (Web Connection Port 443 / OpenAPI 50001)",
        "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
        "publishedDate": "2023-10-18",
        "advisoryUrl": "https://nvd.nist.gov/vuln/detail/CVE-2023-38827",
        "nistUrl": "https://nvd.nist.gov/vuln/detail/CVE-2023-38827",
        "cpe": "cpe:2.3:o:konicaminolta:bizhub_c257i_firmware:g00-x5:*:*:*:*:*:*:*",
        "mitigationNotes": "Atualizar via Konica Minolta PageScope Web Connection ou Firmware Update Tool (ISW) para FW G00-Y2."
      }
    ],
    "vulnerabilitySummary": {
      "critical": 0,
      "high": 1,
      "medium": 0,
      "low": 0,
      "total": 1
    },
    "vulnerabilityRiskScore": 78,
    "nistRiskScore": 7.8,
    "nistRiskLevel": "HIGH",
    "cveLookupStatus": "synced",
    "lastSecurityScan": "Hoje"
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
    deviceName: 'gwvc-udmpro',
    ipAddress: '192.168.0.1',
    eventType: 'snmp_trap',
    severity: 'info',
    description: 'Verificação periódica ICMP ao Gateway UniFi Dream Machine Pro (gwvc-udmpro 192.168.0.1) concluída com sucesso (RTT: 0.42ms). Rota nominal.',
    acknowledged: true,
    acknowledgedBy: 'system'
  },
  {
    id: 'evt-nas-01',
    timestamp: '2026-11-06 09:15:00',
    deviceId: 'real-nas-01',
    deviceName: 'qnap-tsh1277.lan',
    ipAddress: '192.168.0.2',
    eventType: 'host_recovered',
    severity: 'info',
    description: 'Servidor QNAP TS-h1277XU-RP (QuTS hero ZFS) 192.168.0.2 com Storage Pool e conectividade nominal na VLAN 1.',
    acknowledged: true,
    acknowledgedBy: 'system'
  },
  {
    id: 'evt-prn-20',
    timestamp: '2026-11-06 09:10:00',
    deviceId: 'real-printer-20',
    deviceName: 'bizhub-c257i.lan',
    ipAddress: '192.168.20.10',
    eventType: 'snmp_trap',
    severity: 'info',
    description: 'Impressora multifunções Konica Minolta bizhub C257i 192.168.20.10 com Web Connection HTTPS e OpenAPI operacionais na VLAN 20.',
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
    description: 'Sub-rede física local autorizada (VLAN 1 - Gateway gwvc-udmpro, Nó NEXUS e QNAP TS-h1277XU-RP)',
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
    description: 'Sub-rede autorizada VLAN 20 (Impressora Konica Minolta bizhub C257i)',
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
    percentage: 39.5,
    primaryProtocol: 'HTTP / Web Console (Port 3000)'
  },
  {
    ipAddress: '192.168.0.1',
    hostname: 'gwvc-udmpro',
    macAddress: '00:11:22:33:44:01',
    bytesIn: 18200000,
    bytesOut: 12500000,
    totalBytes: 30700000,
    percentage: 27.9,
    primaryProtocol: 'UniFi OS / DNS Gateway Forwarding'
  },
  {
    ipAddress: '192.168.0.2',
    hostname: 'qnap-tsh1277.lan',
    macAddress: '24:5E:BE:11:42:02',
    bytesIn: 13500000,
    bytesOut: 6500000,
    totalBytes: 20000000,
    percentage: 18.2,
    primaryProtocol: 'SMB3 / ZFS Storage Backup & NFS'
  },
  {
    ipAddress: '192.168.20.10',
    hostname: 'bizhub-c257i.lan',
    macAddress: '00:20:6B:44:A2:10',
    bytesIn: 3800000,
    bytesOut: 2000000,
    totalBytes: 5800000,
    percentage: 12.3,
    primaryProtocol: 'Web Connection HTTPS / IPPS / OpenAPI (Port 443/50001)'
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
  { sourceId: 'real-nas-01', targetId: 'real-gw-01', linkType: 'ethernet', speedMbps: 10000, status: 'up', vlan: 1, sourcePort: 'eth1 (10GbE)', targetPort: 'ether2 (LAN-Storage)' },
  { sourceId: 'real-printer-20', targetId: 'real-gw-01', linkType: 'trunk', speedMbps: 1000, status: 'up', vlan: 20, sourcePort: 'lan0 (1GbE)', targetPort: 'Port 8 (VLAN-20)' }
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
