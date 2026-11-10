import React from 'react';
import { 
  LayoutDashboard, 
  Radar, 
  Server, 
  Activity, 
  Network, 
  BarChart3, 
  BellRing, 
  FileText, 
  Settings, 
  ShieldAlert,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

import { LocalServerMetrics } from '../../types/network';

export type NavSection = 
  | 'Overview'
  | 'Network Discovery'
  | 'Asset Inventory'
  | 'Firmware & Vulnerabilities'
  | 'Compliance Policies'
  | 'Network Monitoring'
  | 'Network Connections'
  | 'Traffic Analysis'
  | 'Events and Alerts'
  | 'Reports'
  | 'Settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  unacknowledgedAlertsCount: number;
  totalDevicesCount: number;
  vulnerableDevicesCount?: number;
  nonCompliantCount?: number;
  serverMetrics?: LocalServerMetrics;
}

const NAV_ITEMS: { name: NavSection; label: string; icon: React.ReactNode; countKey?: 'alerts' | 'devices' | 'vulnerabilities' | 'compliance' }[] = [
  { name: 'Overview', label: 'Visão Geral', icon: <LayoutDashboard size={18} /> },
  { name: 'Network Discovery', label: 'Deteção de Rede', icon: <Radar size={18} /> },
  { name: 'Asset Inventory', label: 'Inventário de Ativos', icon: <Server size={18} />, countKey: 'devices' },
  { name: 'Firmware & Vulnerabilities', label: 'Firmware e CVEs', icon: <ShieldAlert size={18} />, countKey: 'vulnerabilities' },
  { name: 'Compliance Policies', label: 'Políticas & Compliance', icon: <ShieldCheck size={18} />, countKey: 'compliance' },
  { name: 'Network Monitoring', label: 'Monitorização de Rede', icon: <Activity size={18} /> },
  { name: 'Network Connections', label: 'Topologia de Rede', icon: <Network size={18} /> },
  { name: 'Traffic Analysis', label: 'Análise de Tráfego', icon: <BarChart3 size={18} /> },
  { name: 'Events and Alerts', label: 'Eventos e Alertas', icon: <BellRing size={18} />, countKey: 'alerts' },
  { name: 'Reports', label: 'Relatórios', icon: <FileText size={18} /> },
  { name: 'Settings', label: 'Definições', icon: <Settings size={18} /> }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  unacknowledgedAlertsCount,
  totalDevicesCount,
  vulnerableDevicesCount = 0,
  nonCompliantCount = 0,
  serverMetrics
}) => {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand & Wordmark */}
      <div className="h-14 px-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-7 h-7 rounded bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm tracking-tighter">
          NX
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
            NEXUS <span className="text-xs font-mono font-normal text-cyan-400">LAN</span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Infrastructure Monitor</div>
        </div>
      </div>

      {/* Primary Navigation Items */}
      <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = currentSection === item.name;
          return (
            <button
              key={item.name}
              onClick={() => onSelectSection(item.name)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.countKey === 'alerts' && unacknowledgedAlertsCount > 0 && (
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                  {unacknowledgedAlertsCount}
                </span>
              )}

              {item.countKey === 'devices' && (
                <span className="text-[11px] font-mono text-slate-400">
                  {totalDevicesCount}
                </span>
              )}

              {item.countKey === 'vulnerabilities' && (vulnerableDevicesCount || 0) > 0 && (
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  {vulnerableDevicesCount}
                </span>
              )}

              {item.countKey === 'compliance' && (nonCompliantCount || 0) > 0 && (
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                  {nonCompliantCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Local Monitoring Host Specs */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Collector Host</span>
            <span className="font-mono text-[10px] text-emerald-400">ONLINE</span>
          </div>
          <div className="font-mono text-slate-200 font-medium truncate">
            {serverMetrics?.serverHostname && serverMetrics.serverHostname !== 'localhost'
              ? serverMetrics.serverHostname
              : 'nexus-node (192.168.0.13)'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/80">
            <span>{serverMetrics?.ipAddress && serverMetrics.ipAddress !== '127.0.0.1' ? serverMetrics.ipAddress : '192.168.0.13'}</span>
            <span>
              {serverMetrics?.interfaces?.find(i => i.name !== 'lo')?.name || 'eth0'}:{' '}
              {serverMetrics?.interfaces?.find(i => i.name !== 'lo')?.speedMbps
                ? `${serverMetrics.interfaces.find(i => i.name !== 'lo')!.speedMbps} Mbps`
                : '1 Gbps'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
