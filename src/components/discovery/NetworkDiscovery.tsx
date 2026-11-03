import React, { useState } from 'react';
import { 
  Radar, 
  Play, 
  Square, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Server, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Layers,
  ArrowRight,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { SubnetScanRange, DiscoveryScanJob, NetworkDevice } from '../../types/network';
import { StartScanPayload } from '../../types/api';
import { nexusApi } from '../../services/api';
import { DeviceStatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';

interface NetworkDiscoveryProps {
  subnets: SubnetScanRange[];
  devices: NetworkDevice[];
  onRefreshSubnets: () => void;
  onRefreshDevices: () => void;
  onOpenDeviceDetail: (device: NetworkDevice) => void;
}

export const NetworkDiscovery: React.FC<NetworkDiscoveryProps> = ({
  subnets,
  devices,
  onRefreshSubnets,
  onRefreshDevices,
  onOpenDeviceDetail
}) => {
  const [selectedSubnetId, setSelectedSubnetId] = useState<string>(subnets[0]?.id || '');
  const [probeType, setProbeType] = useState<'ARP+ICMP' | 'SYN_SCAN' | 'ICMP_ONLY'>('ARP+ICMP');
  const [rateLimitPps, setRateLimitPps] = useState<number>(150);
  const [scanJob, setScanJob] = useState<DiscoveryScanJob | null>(nexusApi.getActiveScanJob());
  const [isAddSubnetModalOpen, setIsAddSubnetModalOpen] = useState<boolean>(false);

  // New subnet form state
  const [newSubnetName, setNewSubnetName] = useState('');
  const [newSubnetCidr, setNewSubnetCidr] = useState('192.168.30.0/24');
  const [newSubnetVlan, setNewSubnetVlan] = useState(30);
  const [newSubnetDesc, setNewSubnetDesc] = useState('');
  const [newSubnetIsAuthorized, setNewSubnetIsAuthorized] = useState(true);

  const selectedSubnet = subnets.find(s => s.id === selectedSubnetId) || subnets[0];

  const handleStartScan = () => {
    if (!selectedSubnet) return;

    if (!selectedSubnet.isAuthorized) {
      alert('Security policy blocked scan: This CIDR range is marked as unauthorized.');
      return;
    }

    const payload: StartScanPayload = {
      cidr: selectedSubnet.cidr,
      probeType,
      rateLimitPps,
      timeoutMs: 1500
    };

    const initialJob = nexusApi.startDiscoveryScan(
      payload,
      (job) => {
        setScanJob({ ...job });
      },
      (completedJob) => {
        setScanJob({ ...completedJob });
        onRefreshDevices();
      }
    );

    setScanJob(initialJob);
  };

  const handleStopScan = () => {
    nexusApi.stopDiscoveryScan();
    setScanJob(prev => prev ? { ...prev, status: 'cancelled' } : null);
  };

  const handleCreateSubnet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubnetCidr.includes('/')) {
      alert('Please enter a valid CIDR notation (e.g. 192.168.0.0/24)');
      return;
    }

    const newRange: SubnetScanRange = {
      id: `sub-${Date.now()}`,
      name: newSubnetName || `VLAN ${newSubnetVlan}`,
      cidr: newSubnetCidr,
      vlan: Number(newSubnetVlan),
      description: newSubnetDesc || 'User configured authorized LAN segment',
      isAuthorized: newSubnetIsAuthorized,
      probeType,
      rateLimitPps,
      enabled: true,
      lastScanned: undefined
    };

    await nexusApi.saveSubnetRange(newRange);
    onRefreshSubnets();
    setSelectedSubnetId(newRange.id);
    setIsAddSubnetModalOpen(false);
  };

  const handleDeleteSubnet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove this subnet range from authorized inventory?')) {
      await nexusApi.deleteSubnetRange(id);
      onRefreshSubnets();
    }
  };

  const scanProgressPercent = scanJob && scanJob.totalIps > 0 
    ? Math.min(100, Math.round((scanJob.probedIps / scanJob.totalIps) * 100)) 
    : 0;

  // Filter devices belonging to currently selected subnet
  const subnetDevices = devices.filter(d => d.subnet === selectedSubnet?.cidr);

  return (
    <div className="space-y-6">
      {/* Policy & Safety Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              <ShieldCheck size={16} />
              <span>Controlled Network Discovery Engine</span>
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              Authorized Subnet Range Prober & Inventory Collector
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Scans operate locally on the LAN using Scapy ARP requests and low-impact ICMP echo sweeps. 
              Per safety guidelines, probes are strictly bounded to registered subnets with configurable packet-per-second ceilings.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAddSubnetModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
            >
              <Plus size={15} />
              <span>Add Subnet Range</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Subnet Selector & Scan Configuration / Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Authorized Subnets Catalog (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Authorized Subnets</h3>
            <span className="text-xs font-mono text-slate-400">{subnets.length} defined</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
            {subnets.map(subnet => {
              const isSelected = (selectedSubnet?.id === subnet.id);
              const hostCount = devices.filter(d => d.subnet === subnet.cidr).length;

              return (
                <div
                  key={subnet.id}
                  onClick={() => setSelectedSubnetId(subnet.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-100">{subnet.name}</span>
                    <span className="font-mono text-[11px] text-cyan-400 font-medium">VLAN {subnet.vlan}</span>
                  </div>

                  <div className="font-mono text-slate-300 text-xs mb-1">
                    {subnet.cidr}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                    <span>{hostCount} hosts mapped</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">Authorized</span>
                      {subnets.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteSubnet(subnet.id, e)}
                          className="text-slate-400 hover:text-rose-400 ml-1 p-0.5"
                          title="Delete range"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scan Controls & Live Console (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scan Controls Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Target: {selectedSubnet ? `${selectedSubnet.name} (${selectedSubnet.cidr})` : 'Select a range'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Coletor nativo: <span className="font-mono text-cyan-400">Linux Kernel Socket (eth1/eth2)</span> · Motor ICMP e TCP ativo
                </p>
              </div>

              <div className="flex items-center gap-2">
                {scanJob?.status === 'running' ? (
                  <button
                    onClick={handleStopScan}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-100 bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
                  >
                    <Square size={14} />
                    <span>Parar Varredura</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartScan}
                    disabled={!selectedSubnet}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors shadow-sm shadow-cyan-500/20 disabled:opacity-50"
                  >
                    <Play size={14} />
                    <span>Executar Varredura Real</span>
                  </button>
                )}
              </div>
            </div>

            {/* Probe Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">PROBE TECHNIQUE</label>
                <select
                  value={probeType}
                  onChange={(e) => setProbeType(e.target.value as any)}
                  disabled={scanJob?.status === 'running'}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="ARP+ICMP">ARP Request + ICMP Echo (Standard LAN)</option>
                  <option value="SYN_SCAN">TCP SYN Half-Open (Port 80/443/22)</option>
                  <option value="ICMP_ONLY">ICMP Echo Only (Routed / Subnet 3)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">RATE LIMIT (PACKETS/SEC)</label>
                <select
                  value={rateLimitPps}
                  onChange={(e) => setRateLimitPps(Number(e.target.value))}
                  disabled={scanJob?.status === 'running'}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value={50}>50 pps (Stealth / Low Impact)</option>
                  <option value={150}>150 pps (Standard LAN Baseline)</option>
                  <option value={300}>300 pps (Fast Switch Trunk Sweep)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">RESPONSE TIMEOUT</label>
                <div className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300 font-mono">
                  1500 ms (3 retries)
                </div>
              </div>
            </div>

            {/* Live Progress Bar */}
            {scanJob && (
              <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80 mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={scanJob.status === 'running' ? 'text-cyan-400 animate-pulse' : scanJob.status === 'completed' ? 'text-emerald-400' : 'text-slate-400'}>
                      ● {scanJob.status.toUpperCase()}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300">Target IP: {scanJob.currentIp || 'Idle'}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="tabular-nums font-semibold">{scanJob.probedIps}</span> / {scanJob.totalIps} IPs ({scanProgressPercent}%)
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      scanJob.status === 'completed' ? 'bg-emerald-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${scanProgressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>Responsive Hosts Discovered: <strong className="text-emerald-400">{scanJob.discoveredHosts}</strong></span>
                  <span>Elapsed: {scanJob.startTime} {scanJob.endTime ? `to ${scanJob.endTime}` : ''}</span>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Discovery Terminal Logs */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Terminal size={14} className="text-cyan-400" />
                <span>Collector Kernel Probe Log</span>
              </span>
              <span className="text-[11px]">Buffer: 50 lines</span>
            </div>

            <div className="h-44 overflow-y-auto space-y-1 text-[11px] pr-2">
              {scanJob?.logs && scanJob.logs.length > 0 ? (
                scanJob.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-400 select-none">[{log.timestamp}]</span>
                    <span className={
                      log.level === 'success' ? 'text-emerald-400' :
                      log.level === 'warn' ? 'text-amber-400' :
                      log.level === 'error' ? 'text-rose-400' : 'text-slate-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic py-6 text-center">
                  Discovery prober is idle. Select an authorized range above and click &quot;Start ARP Discovery&quot; to begin.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discovered Hosts in Current Subnet */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Hosts Cataloged in {selectedSubnet?.name || 'Selected Subnet'} ({subnetDevices.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspected responsive nodes with hardware MAC & OUI vendor details
            </p>
          </div>
        </div>

        {subnetDevices.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No devices cataloged yet for this subnet. Run an ARP discovery sweep to probe responsive hosts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">HOSTNAME</th>
                  <th className="pb-2 font-medium">IP ADDRESS</th>
                  <th className="pb-2 font-medium">MAC ADDRESS</th>
                  <th className="pb-2 font-medium">MANUFACTURER</th>
                  <th className="pb-2 font-medium">DEVICE TYPE</th>
                  <th className="pb-2 font-medium">STATUS</th>
                  <th className="pb-2 font-medium text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {subnetDevices.map(device => (
                  <tr key={device.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-medium text-slate-200">
                      {device.hostname}
                    </td>
                    <td className="py-2.5 text-cyan-400">{device.ipAddress}</td>
                    <td className="py-2.5 text-slate-400">{device.macAddress}</td>
                    <td className="py-2.5 text-slate-300 font-sans">{device.manufacturer}</td>
                    <td className="py-2.5 text-slate-300 font-sans">{device.deviceType}</td>
                    <td className="py-2.5">
                      <DeviceStatusBadge status={device.status} />
                    </td>
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
        )}
      </div>

      {/* Modal: Add Subnet Range */}
      <Modal
        isOpen={isAddSubnetModalOpen}
        onClose={() => setIsAddSubnetModalOpen(false)}
        title="Register Authorized Subnet Range"
        subtitle="Ensure CIDR is legally authorized within your corporate LAN topology"
      >
        <form onSubmit={handleCreateSubnet} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Subnet Friendly Name</label>
            <input
              type="text"
              placeholder="e.g. Engineering Lab VLAN"
              value={newSubnetName}
              onChange={(e) => setNewSubnetName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">CIDR Notation</label>
              <input
                type="text"
                placeholder="192.168.30.0/24"
                value={newSubnetCidr}
                onChange={(e) => setNewSubnetCidr(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">VLAN ID</label>
              <input
                type="number"
                min="1"
                max="4094"
                value={newSubnetVlan}
                onChange={(e) => setNewSubnetVlan(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Scope Description</label>
            <textarea
              rows={2}
              placeholder="Operational purpose, physical location, switch trunk details..."
              value={newSubnetDesc}
              onChange={(e) => setNewSubnetDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="authCheck"
              checked={newSubnetIsAuthorized}
              onChange={(e) => setNewSubnetIsAuthorized(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="authCheck" className="text-xs text-slate-300 cursor-pointer">
              Confirm this subnet is explicitly authorized for network sweeps
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddSubnetModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
            >
              Save Subnet Policy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
