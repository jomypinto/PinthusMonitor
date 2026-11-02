import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Server, 
  Radio,
  FileCheck,
  HardDrive
} from 'lucide-react';
import { NetworkDevice, SubnetScanRange, NetworkEvent, LocalServerMetrics } from '../../types/network';
import { exportDevicesToCsv, exportEventsToCsv, exportFullSystemReportJson } from '../../services/exportService';

interface ReportsViewProps {
  devices: NetworkDevice[];
  subnets: SubnetScanRange[];
  events: NetworkEvent[];
  serverMetrics: LocalServerMetrics;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  devices,
  subnets,
  events,
  serverMetrics
}) => {
  const [selectedReportType, setSelectedReportType] = useState<'inventory' | 'subnets' | 'security' | 'health'>('inventory');
  const [reportDateRange, setReportDateRange] = useState<'24h' | '7d' | '30d'>('24h');

  const onlineDevices = devices.filter(d => d.status === 'online');
  const offlineDevices = devices.filter(d => d.status === 'offline');
  const unauthDevices = devices.filter(d => !d.isAuthorized);

  const handleExportCurrent = () => {
    switch (selectedReportType) {
      case 'inventory':
        exportDevicesToCsv(devices);
        break;
      case 'security':
        exportDevicesToCsv(unauthDevices.length > 0 ? unauthDevices : devices);
        break;
      case 'health':
        exportFullSystemReportJson({
          generatedAt: new Date().toISOString(),
          collectorNode: serverMetrics.serverHostname,
          totalDevices: devices.length,
          availability: `${((onlineDevices.length / devices.length) * 100).toFixed(2)}%`,
          devices,
          events,
          metrics: serverMetrics
        });
        break;
      case 'subnets':
        exportFullSystemReportJson({
          subnets,
          deviceCount: devices.length,
          subnetsMapping: subnets.map(s => ({
            ...s,
            devices: devices.filter(d => d.subnet === s.cidr)
          }))
        });
        break;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              Automated Infrastructure Reporting Engine
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              LAN Health, Compliance & Asset Audit Reports
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Export verified operational metrics, subnet IP densities, and hardware asset rosters for compliance and change review.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
            >
              <Printer size={14} />
              <span>Print Preview</span>
            </button>
            <button
              onClick={handleExportCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-md transition-colors shadow-sm shadow-cyan-500/20"
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-mono text-[11px] mr-2">REPORT TEMPLATE:</span>
          {[
            { id: 'inventory', label: 'LAN Asset Inventory Roster' },
            { id: 'subnets', label: 'Subnet Utilization & CIDR Audit' },
            { id: 'security', label: 'Rogue Device & Security Audit' },
            { id: 'health', label: 'System SLA & Health Snapshot' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedReportType(tab.id as any)}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                selectedReportType === tab.id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Report Content Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              NEXUS NETWORK MONITOR · AUDIT DISCLOSURE
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              {selectedReportType === 'inventory' && 'Local Area Network Asset Inventory Specification'}
              {selectedReportType === 'subnets' && 'Subnet Allocation & Address Space Capacity Report'}
              {selectedReportType === 'security' && 'Unauthorized Hardware & Unknown MAC Perimeter Audit'}
              {selectedReportType === 'health' && 'LAN Infrastructure SLA & Uptime Compliance Record'}
            </h3>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            <div>Collector Node: {serverMetrics.serverHostname}</div>
            <div>Date: {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</div>
          </div>
        </div>

        {/* Dynamic Report Content Body */}
        {selectedReportType === 'inventory' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 text-[10px] block">TOTAL HOSTS</span>
                <span className="text-lg font-bold text-slate-100">{devices.length}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 text-[10px] block">ONLINE</span>
                <span className="text-lg font-bold text-emerald-400">{onlineDevices.length}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 text-[10px] block">OFFLINE</span>
                <span className="text-lg font-bold text-rose-400">{offlineDevices.length}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 text-[10px] block">ROUTER & SWITCHES</span>
                <span className="text-lg font-bold text-cyan-400">
                  {devices.filter(d => d.deviceType === 'Router' || d.deviceType === 'Switch').length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2">HOSTNAME</th>
                    <th className="pb-2">IP ADDRESS</th>
                    <th className="pb-2">MAC ADDRESS</th>
                    <th className="pb-2">VENDOR</th>
                    <th className="pb-2">TYPE</th>
                    <th className="pb-2">STATUS</th>
                    <th className="pb-2 text-right">LAST SEEN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {devices.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-2 font-medium text-slate-200">{d.hostname}</td>
                      <td className="py-2 text-cyan-400">{d.ipAddress}</td>
                      <td className="py-2 text-slate-400">{d.macAddress}</td>
                      <td className="py-2 text-slate-300 font-sans">{d.manufacturer}</td>
                      <td className="py-2 text-slate-300 font-sans">{d.deviceType}</td>
                      <td className="py-2 text-emerald-400">{d.status.toUpperCase()}</td>
                      <td className="py-2 text-right text-slate-400">{d.lastSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReportType === 'subnets' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Overview of authorized IP address space utilization across defined VLAN segments:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subnets.map(s => {
                const hostsInSubnet = devices.filter(d => d.subnet === s.cidr);
                const capacity = 254; // /24 default
                const percentUsed = ((hostsInSubnet.length / capacity) * 100).toFixed(1);

                return (
                  <div key={s.id} className="p-4 bg-slate-950/60 rounded border border-slate-800 text-xs font-mono space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100">{s.name}</span>
                      <span className="text-cyan-400">VLAN {s.vlan}</span>
                    </div>
                    <div className="text-slate-400">{s.cidr} · {s.description}</div>
                    
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Allocation Density:</span>
                        <span className="text-slate-200">{hostsInSubnet.length} / {capacity} IPs ({percentUsed}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${percentUsed}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedReportType === 'security' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>
                Perimeter audit identified {unauthDevices.length} host(s) not registered in the authorized device whitelist.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2">HOSTNAME</th>
                    <th className="pb-2">IP ADDRESS</th>
                    <th className="pb-2">MAC ADDRESS</th>
                    <th className="pb-2">VENDOR</th>
                    <th className="pb-2">SECURITY STATUS</th>
                    <th className="pb-2">OPEN PORTS</th>
                    <th className="pb-2 text-right">AUDIT REMARKS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {devices.filter(d => !d.isAuthorized).concat(devices.filter(d => d.isAuthorized).slice(0, 5)).map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-medium text-slate-200">{d.hostname}</td>
                      <td className="py-2.5 text-cyan-400">{d.ipAddress}</td>
                      <td className="py-2.5 text-slate-300">{d.macAddress}</td>
                      <td className="py-2.5 text-slate-300 font-sans">{d.manufacturer}</td>
                      <td className="py-2.5">
                        <span className={d.isAuthorized ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                          {d.isAuthorized ? 'WHITELISTED' : 'ROGUE / UNVERIFIED'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">{d.openPorts.join(', ') || 'None'}</td>
                      <td className="py-2.5 text-right text-slate-400 font-sans text-[11px]">
                        {d.isAuthorized ? 'Baseline verified' : 'Immediate isolation recommended'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReportType === 'health' && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 bg-slate-950/60 rounded border border-slate-800 space-y-3">
              <div className="text-cyan-400 font-bold text-sm">24-Hour SLA Performance Index: 99.82%</div>
              <div className="text-slate-300 leading-relaxed font-sans">
                Monitoring server <span className="font-mono text-cyan-400">{serverMetrics.serverHostname}</span> evaluated 20 monitored targets. 19 nodes maintained continuous reachability (&lt; 2.5ms RTT). One host experienced offline transient during non-business hours.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 block">TOTAL ICMP PROBES</span>
                  <span className="text-slate-100 font-bold">115,200</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 block">PACKET LOSS RATIO</span>
                  <span className="text-emerald-400 font-bold">0.03%</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 block">MAX RECORDED JITTER</span>
                  <span className="text-slate-100 font-bold">18.4 ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
