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
import { NetworkTopologyCanvas } from '../topology/NetworkTopologyCanvas';

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
                Mapa de Topologia Interativo
              </button>
              <button
                onClick={() => setActiveTab('ports')}
                className={`px-3 py-1.5 font-medium rounded transition-colors ${
                  activeTab === 'ports' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Portas & Vizinhos Físicos
              </button>
              <button
                onClick={() => setActiveTab('arp')}
                className={`px-3 py-1.5 font-medium rounded transition-colors ${
                  activeTab === 'arp' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tabela ARP ({devices.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: VISUAL TOPOLOGY GRAPH / HIERARCHY */}
      {activeTab === 'topology' && (
        <NetworkTopologyCanvas
          devices={devices}
          connectionLinks={connectionLinks}
          onOpenDeviceDetail={onOpenDeviceDetail}
        />
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
