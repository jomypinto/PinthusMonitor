import React from 'react';
import { Cpu, HardDrive, Network, Radio, AlertCircle } from 'lucide-react';
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
  const eth0 = metrics.interfaces.find(i => i.name.startsWith('eth0')) || metrics.interfaces[0];
  const rxMbps = (eth0.rxBytesPerSec * 8 / 1000000).toFixed(1);
  const txMbps = (eth0.txBytesPerSec * 8 / 1000000).toFixed(1);

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400">
      {/* Simulation / Environment Transparency Notice */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
          <AlertCircle size={13} className="shrink-0" />
          <span>Notice:</span>
        </span>
        <span className="text-slate-300">
          {backendConfig.useLiveBackend 
            ? 'Operating in live Flask REST mode connected to local Scapy daemon.' 
            : 'Phase 1 Prototype view with simulated enterprise network telemetry.'}
        </span>
        <button
          onClick={onOpenSettings}
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1"
        >
          {backendConfig.useLiveBackend ? 'Daemon Settings' : 'Connect Local Flask Backend'}
        </button>
      </div>

      {/* Local Host Quick Gauges */}
      <div className="flex items-center gap-5 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 uppercase text-[10px]">Local Node:</span>
          <span className="text-slate-200">{metrics.serverHostname}</span>
        </div>

        <div className="flex items-center gap-1.5" title={`Load avg: ${metrics.cpu.loadAverage.join(', ')}`}>
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
          <span className="text-slate-400">eth0</span>
          <span className="text-slate-200 tabular-nums">↓{rxMbps} / ↑{txMbps} Mb/s</span>
        </div>
      </div>
    </div>
  );
};
