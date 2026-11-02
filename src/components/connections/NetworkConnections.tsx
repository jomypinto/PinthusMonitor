import React, { useState } from 'react';
import { 
  Network, 
  Server, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Cpu, 
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { NetworkDevice, ConnectionLink } from '../../types/network';
import { DeviceStatusBadge } from '../common/StatusBadge';

interface NetworkConnectionsProps {
  devices: NetworkDevice[];
  connectionLinks: ConnectionLink[];
  onOpenDeviceDetail: (device: NetworkDevice) => void;
}

export const NetworkConnections: React.FC<NetworkConnectionsProps> = ({
  devices,
  connectionLinks,
  onOpenDeviceDetail
}) => {
  const [selectedVlan, setSelectedVlan] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'topology' | 'ports' | 'arp'>('topology');

  // Filter links
  const filteredLinks = connectionLinks.filter(link => {
    if (selectedVlan !== 'all' && link.vlan !== Number(selectedVlan)) return false;
    return true;
  });

  // Find device by ID
  const getDevice = (id: string) => devices.find(d => d.id === id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              Layer 2 & Layer 3 Connectivity Matrix
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              LAN Topology, Switch Port Maps & ARP Table
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Physical interconnections discovered via LLDP/CDP SNMP mibs, spanning tree root topology, and ARP prober cache.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('topology')}
                className={`px-3 py-1.5 font-medium rounded transition-colors ${
                  activeTab === 'topology' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Topology Graph
              </button>
              <button
                onClick={() => setActiveTab('ports')}
                className={`px-3 py-1.5 font-medium rounded transition-colors ${
                  activeTab === 'ports' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Switch Port Neighbors
              </button>
              <button
                onClick={() => setActiveTab('arp')}
                className={`px-3 py-1.5 font-medium rounded transition-colors ${
                  activeTab === 'arp' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Prober ARP Cache ({devices.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: VISUAL TOPOLOGY GRAPH / HIERARCHY */}
      {activeTab === 'topology' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-400">
              <span className="text-slate-200 font-semibold">Hierarchical Network Map:</span>
              <span>Gateway → Distribution Stack → Access Layer → Hosts</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> 10G Fiber Trunk
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> 1G Cat6 Copper
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> 802.11ax Wireless
              </span>
            </div>
          </div>

          {/* Structured Network Tree Flow */}
          <div className="space-y-8 py-2">
            {/* Level 1: Core Gateway */}
            <div className="flex flex-col items-center">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-2">Core Edge & Gateway</div>
              <div 
                onClick={() => onOpenDeviceDetail(getDevice('dev-001')!)}
                className="w-72 p-3 bg-slate-950 border-2 border-cyan-500/60 rounded-lg shadow-lg shadow-cyan-500/10 cursor-pointer hover:border-cyan-400 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-cyan-400 font-bold">gw-core-01.lan</span>
                  <DeviceStatusBadge status="online" showIcon={false} />
                </div>
                <div className="text-[11px] font-mono text-slate-300">192.168.1.1 · Cisco ISR4431</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Default Route / WAN Ingress</div>
              </div>
              <div className="w-0.5 h-8 bg-cyan-500/60" />
            </div>

            {/* Level 2: Core Distribution Switch */}
            <div className="flex flex-col items-center">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-2">L3 Distribution Switch Stack</div>
              <div 
                onClick={() => onOpenDeviceDetail(getDevice('dev-002')!)}
                className="w-80 p-3 bg-slate-950 border border-slate-700 hover:border-cyan-500/50 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-slate-100 font-bold">sw-core-stack01.lan</span>
                  <DeviceStatusBadge status="online" showIcon={false} />
                </div>
                <div className="text-[11px] font-mono text-slate-300">192.168.1.2 · Cisco Catalyst 3850 Stack</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">VLANs: 1 (Mgmt), 10 (Corp), 20 (DMZ), 50 (IoT)</div>
              </div>
              <div className="w-0.5 h-8 bg-slate-700" />
            </div>

            {/* Level 3: Access Switches & Critical Infrastructure Cluster */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              <div 
                onClick={() => onOpenDeviceDetail(getDevice('dev-003')!)}
                className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <div className="text-[10px] font-mono uppercase text-cyan-400 mb-1">Floor 1 Access Switch</div>
                <div className="text-xs font-mono font-bold text-slate-200">sw-access-floor1.lan</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">192.168.1.3 · UniFi 48 PoE</div>
                <div className="text-[10px] text-emerald-400 mt-1 font-mono">48 Ports · 1G Trunk Up</div>
              </div>

              <div 
                onClick={() => onOpenDeviceDetail(getDevice('dev-005')!)}
                className="p-3 bg-slate-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-lg cursor-pointer transition-colors"
              >
                <div className="text-[10px] font-mono uppercase text-emerald-400 mb-1">Local Collector Host</div>
                <div className="text-xs font-mono font-bold text-slate-200">nexus-monitor-node.lan</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">192.168.1.15 · Debian 12</div>
                <div className="text-[10px] text-emerald-400 mt-1 font-mono">NEXUS Daemon / Scapy Node</div>
              </div>

              <div 
                onClick={() => onOpenDeviceDetail(getDevice('dev-004')!)}
                className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Domain & DNS</div>
                <div className="text-xs font-mono font-bold text-slate-200">srv-dc-ad01.lan</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">192.168.1.10 · Win2022</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Active Directory / Port 53</div>
              </div>

              <div 
                onClick={() => onOpenDeviceDetail(getDevice('dev-007')!)}
                className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Hypervisor Cluster</div>
                <div className="text-xs font-mono font-bold text-slate-200">pve-cluster-node01.lan</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">192.168.1.25 · Proxmox VE</div>
                <div className="text-[10px] text-cyan-400 mt-1 font-mono">10GbE SFP+ Fiber Ingress</div>
              </div>
            </div>

            {/* Level 4: Edge Endpoints (Workstations, IoT, WiFi APs) */}
            <div className="pt-2 text-center">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-3">
                Discovered Endpoints & Leaf Nodes ({devices.length - 6} Hosts)
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                {devices.slice(6).map(d => (
                  <button
                    key={d.id}
                    onClick={() => onOpenDeviceDetail(d)}
                    className="px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded text-xs font-mono text-slate-300 flex items-center gap-2 transition-colors"
                  >
                    <span className={d.status === 'online' ? 'text-emerald-400' : d.status === 'degraded' ? 'text-amber-400' : 'text-rose-400'}>
                      ●
                    </span>
                    <span>{d.hostname.split('.')[0]}</span>
                    <span className="text-slate-400 text-[10px]">({d.ipAddress.split('.').slice(2).join('.')})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SWITCH PORT NEIGHBORS */}
      {activeTab === 'ports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Physical Switch Port Interconnections</h3>
            <p className="text-xs text-slate-400 mt-0.5">Port allocation table mapped from Cisco & UniFi SNMP ifTable MIBs</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">SOURCE NODE</th>
                  <th className="pb-2">PORT</th>
                  <th className="pb-2">LINK TYPE</th>
                  <th className="pb-2">SPEED</th>
                  <th className="pb-2">VLAN</th>
                  <th className="pb-2">TARGET NODE</th>
                  <th className="pb-2">TARGET PORT</th>
                  <th className="pb-2">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLinks.map((link, idx) => {
                  const src = getDevice(link.sourceId);
                  const tgt = getDevice(link.targetId);

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-200">{src?.hostname || link.sourceId}</td>
                      <td className="py-2.5 text-cyan-400">{link.sourcePort || 'eth0'}</td>
                      <td className="py-2.5 text-slate-300 font-sans uppercase text-[11px]">{link.linkType}</td>
                      <td className="py-2.5 text-slate-200">{link.speedMbps >= 1000 ? `${link.speedMbps / 1000} Gbps` : `${link.speedMbps} Mbps`}</td>
                      <td className="py-2.5 text-cyan-400">VLAN {link.vlan}</td>
                      <td className="py-2.5 font-semibold text-slate-200">{tgt?.hostname || link.targetId}</td>
                      <td className="py-2.5 text-cyan-400">{link.targetPort || 'eth0'}</td>
                      <td className="py-2.5">
                        <span className={link.status === 'up' ? 'text-emerald-400' : 'text-amber-400'}>
                          {link.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ARP CACHE TABLE */}
      {activeTab === 'arp' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="pb-3 mb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Kernel ARP Prober Neighbor Table (/proc/net/arp)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Active IP to MAC hardware mappings resolved on interface eth0</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">FLAG: 0x2 (Completed)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">IP ADDRESS</th>
                  <th className="pb-2">HW TYPE</th>
                  <th className="pb-2">FLAGS</th>
                  <th className="pb-2">HW ADDRESS (MAC)</th>
                  <th className="pb-2">RESOLVED HOSTNAME</th>
                  <th className="pb-2">DEVICE INTERFACE</th>
                  <th className="pb-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {devices.map(device => (
                  <tr key={device.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-cyan-400 font-semibold">{device.ipAddress}</td>
                    <td className="py-2.5 text-slate-400">0x1 (Ethernet)</td>
                    <td className="py-2.5 text-emerald-400">{device.status === 'offline' ? '0x0 (Incomplete)' : '0x2 (Reach)'}</td>
                    <td className="py-2.5 text-slate-200">{device.macAddress}</td>
                    <td className="py-2.5 text-slate-300">{device.hostname}</td>
                    <td className="py-2.5 text-slate-400">eth0</td>
                    <td className="py-2.5 text-right font-sans">
                      <button
                        onClick={() => onOpenDeviceDetail(device)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
