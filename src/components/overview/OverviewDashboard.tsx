import React from 'react';
import { 
  Server, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Clock, 
  ArrowUpRight,
  ShieldAlert,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { NetworkDevice, LocalServerMetrics, NetworkEvent } from '../../types/network';
import { MetricCard } from '../common/MetricCard';
import { DeviceStatusBadge, SeverityBadge } from '../common/StatusBadge';
import { GENERATE_TIME_SERIES } from '../../services/mockData';

interface OverviewDashboardProps {
  devices: NetworkDevice[];
  serverMetrics: LocalServerMetrics;
  events: NetworkEvent[];
  onNavigate: (section: any) => void;
  onOpenDeviceDetail: (device: NetworkDevice) => void;
  onOpenQuickScan: () => void;
}

const timeSeriesData = GENERATE_TIME_SERIES();

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  devices,
  serverMetrics,
  events,
  onNavigate,
  onOpenDeviceDetail,
  onOpenQuickScan
}) => {
  // Device Counts
  const totalCount = devices.length;
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const degradedCount = devices.filter(d => d.status === 'degraded').length;
  const unknownCount = devices.filter(d => d.status === 'unknown').length;
  
  // Network Availability SLA
  const responsiveCount = onlineCount + degradedCount;
  const availabilityPercent = totalCount > 0 
    ? Number(((responsiveCount / totalCount) * 100).toFixed(1)) 
    : 100;

  // Local Server Metrics
  const cpuPercent = serverMetrics.cpu.utilizationPercent;
  const ramPercent = serverMetrics.memory.percentUsed;
  const eth0 = serverMetrics.interfaces.find(i => i.name.startsWith('eth0')) || serverMetrics.interfaces[0];
  const rxMbps = (eth0.rxBytesPerSec * 8 / 1000000).toFixed(1);
  const txMbps = (eth0.txBytesPerSec * 8 / 1000000).toFixed(1);

  // Status Distribution Data for Pie Chart
  const statusChartData = [
    { name: 'Online', value: onlineCount, color: '#10b981' },
    { name: 'Degraded', value: degradedCount, color: '#f59e0b' },
    { name: 'Offline', value: offlineCount, color: '#f43f5e' },
    { name: 'Unknown / Rogue', value: unknownCount, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  // Device Type Breakdown
  const typeCounts = devices.reduce((acc, d) => {
    acc[d.deviceType] = (acc[d.deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Discovered"
          value={totalCount}
          unit="devices"
          subtext="5 subnets cataloged"
          icon={<Server size={18} />}
          highlightColor="cyan"
        />
        <MetricCard
          label="Online Devices"
          value={onlineCount}
          unit={`/ ${totalCount}`}
          subtext="Nominal ICMP response"
          icon={<CheckCircle2 size={18} />}
          highlightColor="emerald"
        />
        <MetricCard
          label="Offline Devices"
          value={offlineCount}
          unit="hosts"
          subtext="Unresponsive > 3 probes"
          icon={<XCircle size={18} />}
          highlightColor={offlineCount > 0 ? 'rose' : 'default'}
        />
        <MetricCard
          label="Unknown / Rogue"
          value={unknownCount}
          unit="unverified"
          subtext="Pending operator review"
          icon={<HelpCircle size={18} />}
          highlightColor={unknownCount > 0 ? 'amber' : 'default'}
        />
        <MetricCard
          label="LAN Availability"
          value={availabilityPercent}
          unit="%"
          subtext="24-hour moving window"
          icon={<Activity size={18} />}
          progressPercent={availabilityPercent}
          highlightColor="cyan"
        />
      </div>

      {/* Local Monitoring Server Telemetry Cluster */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-medium">
              Collector Node · Local Host Telemetry
            </div>
            <h2 className="text-base font-semibold text-slate-100 mt-0.5">
              {serverMetrics.serverHostname} ({serverMetrics.ipAddress})
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Uptime: {serverMetrics.uptimeHours.toFixed(1)} hrs</span>
            <span className="text-slate-600">·</span>
            <span>Kernel: Linux 6.1.0</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400">Daemon Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[11px]">SERVER CPU UTILIZATION</span>
              <Cpu size={14} className="text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-100">
              {cpuPercent}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {serverMetrics.cpu.cores} Cores · Load Avg: {serverMetrics.cpu.loadAverage.join(', ')}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full ${cpuPercent > 80 ? 'bg-rose-500' : 'bg-cyan-400'}`} 
                style={{ width: `${cpuPercent}%` }} 
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[11px]">SERVER RAM USAGE</span>
              <HardDrive size={14} className="text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-100">
              {ramPercent}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {(serverMetrics.memory.usedBytes / 1073741824).toFixed(1)} GB used of 16.0 GB total
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full ${ramPercent > 80 ? 'bg-amber-500' : 'bg-sky-400'}`} 
                style={{ width: `${ramPercent}%` }} 
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[11px]">INTERFACE eth0 THROUGHPUT</span>
              <Network size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-100">
              ↓{rxMbps} <span className="text-xs font-normal text-slate-400">/ ↑{txMbps} Mb/s</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Rx: {eth0.rxPacketsPerSec} pps · Tx: {eth0.txPacketsPerSec} pps
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 font-mono">
              Link 1000BASE-T Full Duplex
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[11px]">COLLECTOR STORAGE (/dev/nvme0)</span>
              <Clock size={14} className="text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-100">
              {serverMetrics.disk.percentUsed}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {(serverMetrics.disk.usedBytes / 1073741824).toFixed(0)} GB used · Postgres DB
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-slate-500" 
                style={{ width: `${serverMetrics.disk.percentUsed}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Activity / Throughput History Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Network Interface Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">24-hour aggregate throughput across monitored switch trunks</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> Rx Throughput (Mb/s)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Tx Throughput (Mb/s)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="rxMbps" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#rxGrad)" name="Rx Throughput (Mb/s)" />
                <Area type="monotone" dataKey="txMbps" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#txGrad)" name="Tx Throughput (Mb/s)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Status Distribution (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
          <div className="pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Device Status Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Cataloged host health breakdown</p>
          </div>

          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-slate-100">{totalCount}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Hosts</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs font-mono">
            {statusChartData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="tabular-nums font-semibold">
                  {item.value} ({((item.value / totalCount) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Lower Section: Recent Events & Inventory Quick List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Recent Network Events</h3>
              <p className="text-xs text-slate-400 mt-0.5">Audit log from ICMP prober, ARP monitor, and SNMP traps</p>
            </div>
            <button
              onClick={() => onNavigate('Events and Alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>View All Alerts</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {events.slice(0, 5).map(event => (
              <div 
                key={event.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={event.severity} />
                    <span className="font-mono text-slate-300 font-medium">{event.deviceName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{event.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-5">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Devices & Type Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Discovered Asset Types</h3>
              <p className="text-xs text-slate-400 mt-0.5">Classification by SNMP sysDescr & MAC OUI</p>
            </div>
            <button
              onClick={() => onNavigate('Asset Inventory')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>Open Inventory</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {Object.entries(typeCounts).slice(0, 6).map(([type, count]) => (
              <div key={type} className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate">{type}</span>
                <span className="font-mono font-semibold text-cyan-400 tabular-nums">{count}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto p-3 bg-slate-950/80 border border-cyan-500/20 rounded">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-200">Need to discover new devices?</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Configure authorized CIDR ranges and run ARP sweeps.</p>
              </div>
              <button
                onClick={onOpenQuickScan}
                className="px-3 py-1.5 text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 rounded font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Start Sweep
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
