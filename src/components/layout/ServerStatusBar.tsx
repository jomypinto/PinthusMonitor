import React from 'react';
import { Cpu, HardDrive, Network, CheckCircle2 } from 'lucide-react';
import { LocalServerMetrics } from '../../types/network';
import { BackendConfig } from '../../types/api';

interface ServerStatusBarProps {
  metrics: LocalServerMetrics;
  backendConfig: BackendConfig;
  onOpenSettings: () => void;
}

export const ServerStatusBar: React.FC<ServerStatusBarProps> = ({
  metrics,
  backendConfig,
  onOpenSettings
}) => {
  const primaryIface = metrics.interfaces.find(i => !i.name.startsWith('lo')) || metrics.interfaces[0] || {
    rxBytesPerSec: 0,
    txBytesPerSec: 0,
    name: 'eth0'
  };

  const rxKbps = ((primaryIface.rxBytesPerSec * 8) / 1000).toFixed(0);
  const txKbps = ((primaryIface.txBytesPerSec * 8) / 1000).toFixed(0);

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400">
      {/* Real Data Certification Indicator */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-semibold">
          <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
          <span>DADOS REAIS:</span>
        </span>
        <span className="text-slate-300 font-medium">
          Coleta direta do kernel Linux host (/proc/net/dev, psutil, ping e os sockets).
        </span>
        <button
          onClick={onOpenSettings}
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1"
        >
          Configurações do Coletor
        </button>
      </div>

      {/* Local Host Real Telemetry Gauges */}
      <div className="flex items-center gap-5 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 uppercase text-[10px]">Host:</span>
          <span className="text-slate-200">{metrics.serverHostname}</span>
        </div>

        <div className="flex items-center gap-1.5" title={`Cores: ${metrics.cpu.cores} | Load: ${metrics.cpu.loadAverage.join(', ')}`}>
          <Cpu size={13} className="text-cyan-400" />
          <span className="text-slate-400">CPU</span>
          <span className="text-slate-200 tabular-nums">{metrics.cpu.utilizationPercent}%</span>
        </div>

        <div className="flex items-center gap-1.5">
          <HardDrive size={13} className="text-sky-400" />
          <span className="text-slate-400">RAM</span>
          <span className="text-slate-200 tabular-nums">{metrics.memory.percentUsed}%</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Network size={13} className="text-emerald-400" />
          <span className="text-slate-400">{primaryIface.name}</span>
          <span className="text-slate-200 tabular-nums">Rx {rxKbps} Kb/s</span>
        </div>
      </div>
    </div>
  );
};
