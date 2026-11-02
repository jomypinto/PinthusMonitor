import React, { useState } from 'react';
import { 
  BarChart3, 
  ArrowDownUp, 
  Layers, 
  Radio, 
  Download, 
  TrendingUp, 
  Activity, 
  ShieldCheck,
  Server
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { TrafficTalker, ProtocolStat, NetworkDevice } from '../../types/network';
import { GENERATE_TIME_SERIES } from '../../services/mockData';

interface TrafficAnalysisProps {
  talkers: TrafficTalker[];
  protocols: ProtocolStat[];
  devices: NetworkDevice[];
  timeSeriesData?: any[];
  onOpenDeviceDetail: (device: NetworkDevice) => void;
}

export const TrafficAnalysis: React.FC<TrafficAnalysisProps> = ({
  talkers,
  protocols,
  devices,
  timeSeriesData = [],
  onOpenDeviceDetail
}) => {
  const [protocolCategory, setProtocolCategory] = useState<string>('all');

  const filteredProtocols = protocols.filter(p => {
    if (protocolCategory === 'all') return true;
    return p.category === protocolCategory;
  });

  const totalCapturedBytes = talkers.reduce((acc, t) => acc + t.totalBytes, 0);

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const COLORS = ['#06b6d4', '#10b981', '#38bdf8', '#f59e0b', '#a855f7', '#64748b', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              Packet Inspection & NetFlow / IPFIX Telemetry
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              LAN Traffic Analysis & Bandwidth Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Passive flow metering captured across span mirror port <span className="font-mono text-slate-300">eth1</span> · Total accounted: <span className="font-mono text-cyan-400 font-semibold">{formatBytes(totalCapturedBytes)}</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">UNICAST RATIO</span>
              <span className="text-emerald-400 font-bold">96.8%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">MULTICAST</span>
              <span className="text-cyan-400 font-bold">2.4%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">BROADCAST (ARP)</span>
              <span className="text-amber-400 font-bold">0.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bandwidth Timeline & Protocol Shares Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandwidth Ingress / Egress Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Aggregate Bandwidth Profile (24h)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bitrate over time across local LAN trunks</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Ingress Rx (Mb/s)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Egress Tx (Mb/s)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficRx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trafficTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="rxMbps" stroke="#06b6d4" strokeWidth={2} fill="url(#trafficRx)" name="Rx (Mb/s)" />
                <Area type="monotone" dataKey="txMbps" stroke="#10b981" strokeWidth={2} fill="url(#trafficTx)" name="Tx (Mb/s)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Share Chart (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Top Application Protocols</h3>
              <p className="text-xs text-slate-400 mt-0.5">By percentage of bytes transferred</p>
            </div>
          </div>

          <div className="space-y-3 my-auto">
            {protocols.map((proto, idx) => (
              <div key={proto.protocol} className="text-xs">
                <div className="flex justify-between font-mono mb-1">
                  <span className="text-slate-200 truncate">{proto.protocol}</span>
                  <span className="text-cyan-400 font-semibold tabular-nums">{proto.sharePercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${proto.sharePercent}%`, 
                      backgroundColor: COLORS[idx % COLORS.length] 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Bandwidth Talkers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Top Bandwidth Consumers (Top Talkers)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Nodes generating the highest volume of inbound and outbound frames</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Sampling Window: 24 Hours</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2">DEVICE HOSTNAME</th>
                <th className="pb-2">IP ADDRESS</th>
                <th className="pb-2">MAC ADDRESS</th>
                <th className="pb-2">INBOUND (RX)</th>
                <th className="pb-2">OUTBOUND (TX)</th>
                <th className="pb-2">TOTAL VOLUME</th>
                <th className="pb-2">PRIMARY PROTOCOL</th>
                <th className="pb-2 text-right">SHARE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {talkers.map(talker => {
                const dev = devices.find(d => d.ipAddress === talker.ipAddress);

                return (
                  <tr 
                    key={talker.ipAddress}
                    onClick={() => dev && onOpenDeviceDetail(dev)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-semibold text-slate-200">{talker.hostname}</td>
                    <td className="py-2.5 text-cyan-400">{talker.ipAddress}</td>
                    <td className="py-2.5 text-slate-400">{talker.macAddress}</td>
                    <td className="py-2.5 text-slate-300">{formatBytes(talker.bytesIn)}</td>
                    <td className="py-2.5 text-slate-300">{formatBytes(talker.bytesOut)}</td>
                    <td className="py-2.5 font-bold text-slate-100">{formatBytes(talker.totalBytes)}</td>
                    <td className="py-2.5 text-slate-400 font-sans">{talker.primaryProtocol}</td>
                    <td className="py-2.5 text-right text-cyan-400 font-bold tabular-nums">
                      {talker.percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
