import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Server, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Radio,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { LocalServerMetrics, NetworkDevice } from '../../types/network';
import { GENERATE_TIME_SERIES } from '../../services/mockData';
import { DeviceStatusBadge } from '../common/StatusBadge';

interface NetworkMonitoringProps {
  serverMetrics: LocalServerMetrics;
  devices: NetworkDevice[];
  timeSeriesData?: any[];
  onOpenDeviceDetail: (device: NetworkDevice) => void;
}

export const NetworkMonitoring: React.FC<NetworkMonitoringProps> = ({
  serverMetrics,
  devices,
  timeSeriesData = [],
  onOpenDeviceDetail
}) => {
  const [selectedInterface, setSelectedInterface] = useState<string>('eth0');
  const [activeSection, setActiveSection] = useState<'both' | 'local' | 'remote'>('both');

  const iface = serverMetrics.interfaces.find(i => i.name.startsWith(selectedInterface)) || serverMetrics.interfaces[0];

  return (
    <div className="space-y-6">
      {/* Section Header with Clear Distinction Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              Metric Domain Separation
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              Host Prober Infrastructure & Remote Telemetry
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Distinguishing metrics generated on the local NEXUS node from ICMP/SNMP collected across remote LAN devices.
            </p>
          </div>

          {/* Segmented Tab */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setActiveSection('both')}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                activeSection === 'both' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unified View
            </button>
            <button
              onClick={() => setActiveSection('local')}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                activeSection === 'local' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Local Collector Node
            </button>
            <button
              onClick={() => setActiveSection('remote')}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                activeSection === 'remote' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Remote Devices
            </button>
          </div>
        </div>
      </div>

      {/* DOMAIN 1: LOCAL MONITORING SERVER METRICS */}
      {(activeSection === 'both' || activeSection === 'local') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            <Server size={15} />
            <span>Local Monitoring Server Metrics (Self-Telemetry)</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-normal">Host: {serverMetrics.serverHostname} ({serverMetrics.ipAddress})</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CPU & Memory Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Server CPU & Memory Load</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{serverMetrics.cpu.cores} Cores · Linux psutil Collector</p>
                </div>
                <div className="text-xs font-mono text-cyan-400 font-semibold">
                  {serverMetrics.cpu.utilizationPercent}% CPU
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="cpuPercent" stroke="#06b6d4" strokeWidth={2} dot={false} name="CPU %" />
                    <Line type="monotone" dataKey="ramPercent" stroke="#38bdf8" strokeWidth={2} dot={false} name="RAM %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-800">
                <div className="text-slate-400">
                  Load Avg: <span className="text-slate-200">{serverMetrics.cpu.loadAverage.join(', ')}</span>
                </div>
                <div className="text-slate-400 text-right">
                  Temp: <span className="text-emerald-400">{serverMetrics.cpu.temperatureCelsius}°C</span>
                </div>
              </div>
            </div>

            {/* Disk I/O & Filesystem Usage */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Storage & Filesystem</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{serverMetrics.disk.mountPoint}</p>
                </div>
                <HardDrive size={16} className="text-slate-400" />
              </div>

              <div className="space-y-4 my-auto">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400">NVMe SSD Utilization</span>
                    <span className="text-slate-100 font-bold">{serverMetrics.disk.percentUsed}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${serverMetrics.disk.percentUsed}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                    <span>{(serverMetrics.disk.usedBytes / 1073741824).toFixed(0)} GB used</span>
                    <span>{(serverMetrics.disk.freeBytes / 1073741824).toFixed(0)} GB free</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">I/O Throughput</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Disk Read Rate:</span>
                    <span className="text-cyan-400">{(serverMetrics.disk.ioReadBps / 1048576).toFixed(1)} MB/s</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Disk Write Rate:</span>
                    <span className="text-emerald-400">{(serverMetrics.disk.ioWriteBps / 1048576).toFixed(1)} MB/s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Interface Deep Dive */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Local NICs</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Physical and tap prober sockets</p>
                </div>
                <select
                  value={selectedInterface}
                  onChange={(e) => setSelectedInterface(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-cyan-400 font-mono focus:outline-none"
                >
                  {serverMetrics.interfaces.map(i => (
                    <option key={i.name} value={i.name.split(' ')[0]}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 my-auto text-xs font-mono">
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Interface IP:</span>
                    <span className="text-slate-200">{iface.ipAddress}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>MAC Hardware:</span>
                    <span className="text-slate-200">{iface.macAddress}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Link Status:</span>
                    <span className="text-emerald-400 font-semibold uppercase">{iface.status} ({iface.speedMbps} Mbps)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">RX THROUGHPUT</span>
                    <span className="text-slate-100 font-bold tabular-nums">
                      {(iface.rxBytesPerSec * 8 / 1000000).toFixed(2)} Mb/s
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{iface.rxPacketsPerSec} pps</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">TX THROUGHPUT</span>
                    <span className="text-slate-100 font-bold tabular-nums">
                      {(iface.txBytesPerSec * 8 / 1000000).toFixed(2)} Mb/s
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{iface.txPacketsPerSec} pps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOMAIN 2: REMOTE NETWORK DEVICE METRICS */}
      {(activeSection === 'both' || activeSection === 'remote') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
            <Radio size={15} />
            <span>Remote LAN Device Metrics & Availability History</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-normal">Aggregated from periodic ICMP echo probes and SNMP poller</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latency History */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Average LAN Round-Trip Latency</h3>
                  <p className="text-xs text-slate-400 mt-0.5">24-hour mean ICMP response across all online nodes</p>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold">
                  1.24 ms avg
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="avgLatencyMs" stroke="#10b981" strokeWidth={2} fill="url(#latencyGrad)" name="Latency (ms)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Packet Loss History */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Packet Loss & Transmission Errors</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ICMP drop occurrences over 24 hours</p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Target SLA: 99.9%
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={[0, 2]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} />
                    <Bar dataKey="packetLoss" fill="#f43f5e" name="Drop Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Key Infrastructure Nodes Availability RTT Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">Core Infrastructure Response Times</h3>
              <span className="text-xs font-mono text-slate-400">Polled every 15s</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {devices.slice(0, 8).map(dev => (
                <div 
                  key={dev.id}
                  onClick={() => onOpenDeviceDetail(dev)}
                  className="p-3 bg-slate-950/60 rounded border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-slate-200 font-semibold truncate">{dev.hostname}</span>
                    <DeviceStatusBadge status={dev.status} showIcon={false} />
                  </div>
                  <div className="font-mono text-[11px] text-cyan-400 mb-2">{dev.ipAddress}</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
                    <span>RTT: <strong className="text-slate-200">{dev.latencyMs}ms</strong></span>
                    <span>Loss: <strong className={dev.packetLossPercent > 0 ? 'text-rose-400' : 'text-emerald-400'}>{dev.packetLossPercent}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
