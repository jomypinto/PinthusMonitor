import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Activity, 
  Network, 
  Shield, 
  Clock, 
  Cpu, 
  Tag, 
  Edit3, 
  Check, 
  Play, 
  Radio, 
  Wifi, 
  Layers,
  Info
} from 'lucide-react';
import { NetworkDevice } from '../../types/network';
import { Modal } from '../common/Modal';
import { DeviceStatusBadge } from '../common/StatusBadge';
import { nexusApi } from '../../services/api';

interface DeviceDetailModalProps {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onDeviceUpdated: (updated: NetworkDevice) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  isOpen,
  onClose,
  onDeviceUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ports' | 'ping' | 'notes'>('overview');
  const [isPinging, setIsPinging] = useState(false);
  const [pingOutput, setPingOutput] = useState<string[]>([]);
  const [notes, setNotes] = useState(device?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  if (!device) return null;

  const handleRunPing = async () => {
    setIsPinging(true);
    setPingOutput([`Executing ICMP echo probe on ${device.ipAddress}...`]);
    try {
      const res = await nexusApi.triggerPing(device.ipAddress);
      setPingOutput(res.output);
    } catch {
      setPingOutput(['Failed to execute ICMP ping probe']);
    } finally {
      setIsPinging(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await nexusApi.updateDevice(device.id, { notes });
      onDeviceUpdated(res.data);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleAuthorized = async () => {
    const updated = await nexusApi.updateDevice(device.id, { isAuthorized: !device.isAuthorized });
    onDeviceUpdated(updated.data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={device.hostname}
      subtitle={`${device.ipAddress} · ${device.macAddress} · ${device.manufacturer}`}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Quick Header Bar */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 gap-3">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">STATE:</span>
              <DeviceStatusBadge status={device.status} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">RTT:</span>
              <span className="text-slate-200 tabular-nums">{device.latencyMs} ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">LOSS:</span>
              <span className={device.packetLossPercent > 0 ? 'text-rose-400 tabular-nums' : 'text-emerald-400 tabular-nums'}>
                {device.packetLossPercent}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">VLAN:</span>
              <span className="text-cyan-400 font-semibold">{device.vlan}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAuthorized}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                device.isAuthorized
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              {device.isAuthorized ? 'Authorized Device' : 'Mark as Authorized'}
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('ports')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'ports'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Open Ports & Services ({device.openPorts.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('ping');
              if (pingOutput.length === 0) handleRunPing();
            }}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'ping'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ICMP Probe Utility
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'notes'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Operator Notes & Tags
          </button>
        </div>

        {/* Tab Content 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-950/60 rounded border border-slate-800/80 space-y-2.5">
              <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold mb-2">
                Network & Physical Layer
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IP Address:</span>
                <span className="text-slate-200 font-semibold">{device.ipAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">MAC Address:</span>
                <span className="text-slate-200">{device.macAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">OUI Manufacturer:</span>
                <span className="text-slate-200 font-sans">{device.manufacturer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Subnet Scope:</span>
                <span className="text-slate-200">{device.subnet}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Connected Switch Port:</span>
                <span className="text-cyan-400">{device.switchPort || 'Direct Uplink'}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded border border-slate-800/80 space-y-2.5">
              <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold mb-2">
                Device Classification
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Device Type:</span>
                <span className="text-slate-200 font-sans font-medium">{device.deviceType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Operating System:</span>
                <span className="text-slate-200 font-sans truncate max-w-[200px]" title={device.operatingSystem}>
                  {device.operatingSystem}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">SNMP Agent:</span>
                <span className={device.snmpEnabled ? 'text-emerald-400' : 'text-slate-400'}>
                  {device.snmpEnabled ? 'Active (v2c/v3)' : 'Disabled / Timeout'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Last Seen Active:</span>
                <span className="text-slate-200">{device.lastSeen}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Est. Continuous Uptime:</span>
                <span className="text-slate-200 font-sans">
                  {device.uptimeSeconds > 0 
                    ? `${(device.uptimeSeconds / 86400).toFixed(0)} days (${(device.uptimeSeconds / 3600).toFixed(0)} hrs)` 
                    : 'Offline'}
                </span>
              </div>
            </div>

            {device.snmpSysDescr && (
              <div className="col-span-full p-3.5 bg-slate-950/80 rounded border border-slate-800 text-xs">
                <span className="text-slate-400 uppercase font-mono text-[10px] block mb-1">SNMP sysDescr:</span>
                <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                  {device.snmpSysDescr}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Open Ports */}
        {activeTab === 'ports' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Services identified via TCP SYN / service banner probe against {device.ipAddress}:
            </p>

            {device.openPorts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded border border-slate-800">
                No open TCP ports detected during last scan (or host is offline/firewalled).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {device.openPorts.map(port => {
                  const portInfo: Record<number, { name: string; desc: string }> = {
                    22: { name: 'SSH', desc: 'Secure Shell Remote Login' },
                    53: { name: 'DNS', desc: 'Domain Name System Server' },
                    80: { name: 'HTTP', desc: 'World Wide Web Server' },
                    88: { name: 'Kerberos', desc: 'Active Directory Authentication' },
                    135: { name: 'MSRPC', desc: 'Microsoft RPC Endpoint Mapper' },
                    139: { name: 'NetBIOS', desc: 'NetBIOS Session Service' },
                    161: { name: 'SNMP', desc: 'Simple Network Management Protocol' },
                    389: { name: 'LDAP', desc: 'Lightweight Directory Access Protocol' },
                    443: { name: 'HTTPS', desc: 'HTTP over TLS/SSL' },
                    445: { name: 'SMB', desc: 'Microsoft SMB / CIFS File Sharing' },
                    631: { name: 'IPP', desc: 'Internet Printing Protocol' },
                    636: { name: 'LDAPS', desc: 'LDAP over TLS/SSL' },
                    2049: { name: 'NFS', desc: 'Network File System Protocol' },
                    3389: { name: 'RDP', desc: 'Remote Desktop Protocol' },
                    5000: { name: 'UPnP / Flask', desc: 'Synology Web / Flask REST' },
                    5001: { name: 'HTTPS Mgmt', desc: 'Synology DSM Secure Web' },
                    8006: { name: 'Proxmox VE', desc: 'Proxmox Cluster Management Console' },
                    8080: { name: 'HTTP-Alt', desc: 'Alternative Web / Proxy' },
                    9100: { name: 'Raw Print / Exporter', desc: 'HP JetDirect / Prometheus Exporter' },
                    10250: { name: 'Kubelet', desc: 'Kubernetes Node Agent API' }
                  };
                  const info = portInfo[port] || { name: 'TCP Service', desc: 'Custom application port' };

                  return (
                    <div key={port} className="p-3 bg-slate-950/60 rounded border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="font-bold text-cyan-400">PORT {port}</span>
                        <span className="text-emerald-400 text-[10px]">OPEN</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200">{info.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{info.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Ping Probe Utility */}
        {activeTab === 'ping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Execute low-latency ICMP echo probe from collector node ({device.ipAddress}):
              </span>
              <button
                onClick={handleRunPing}
                disabled={isPinging}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors disabled:opacity-50"
              >
                <Play size={13} />
                <span>{isPinging ? 'Pinging...' : 'Repeat Ping'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs text-slate-300 space-y-1">
              {pingOutput.map((line, i) => (
                <div key={i} className={line.includes('loss') || line.includes('Unreachable') ? 'text-amber-400' : ''}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: Notes & Tags */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {device.tags.map(tag => (
                  <span key={tag} className="text-xs font-mono text-slate-300 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Internal Engineering Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Physical location, rack position, switch port drop number, service dependencies..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors disabled:opacity-50"
              >
                <Check size={14} />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
