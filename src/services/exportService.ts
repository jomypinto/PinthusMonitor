import { NetworkDevice, NetworkEvent } from '../types/network';

export const exportDevicesToCsv = (devices: NetworkDevice[]): void => {
  const headers = ['Hostname', 'IP Address', 'MAC Address', 'Manufacturer', 'Type', 'Operating System', 'Status', 'Latency (ms)', 'Packet Loss (%)', 'Subnet', 'VLAN', 'Open Ports', 'SNMP', 'Switch Port', 'Authorized', 'Last Seen'];
  
  const rows = devices.map(d => [
    `"${d.hostname}"`,
    `"${d.ipAddress}"`,
    `"${d.macAddress}"`,
    `"${d.manufacturer}"`,
    `"${d.deviceType}"`,
    `"${d.operatingSystem.replace(/"/g, '""')}"`,
    `"${d.status}"`,
    d.latencyMs,
    d.packetLossPercent,
    `"${d.subnet}"`,
    d.vlan,
    `"${d.openPorts.join(', ')}"`,
    d.snmpEnabled ? 'Yes' : 'No',
    `"${d.switchPort || 'N/A'}"`,
    d.isAuthorized ? 'Yes' : 'No',
    `"${d.lastSeen}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `nexus-lan-inventory-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
};

export const exportEventsToCsv = (events: NetworkEvent[]): void => {
  const headers = ['Timestamp', 'Device', 'IP Address', 'Event Type', 'Severity', 'Description', 'Acknowledged', 'Acknowledged By'];
  
  const rows = events.map(e => [
    `"${e.timestamp}"`,
    `"${e.deviceName}"`,
    `"${e.ipAddress}"`,
    `"${e.eventType}"`,
    `"${e.severity.toUpperCase()}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    e.acknowledged ? 'Yes' : 'No',
    `"${e.acknowledgedBy || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `nexus-events-log-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
};

export const exportFullSystemReportJson = (data: any): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadBlob(jsonContent, `nexus-system-audit-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
};

const downloadBlob = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
