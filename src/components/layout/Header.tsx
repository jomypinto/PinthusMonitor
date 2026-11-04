import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, RefreshCw, Terminal, Sliders } from 'lucide-react';
import { BackendConfig } from '../../types/api';

interface HeaderProps {
  currentSection: string;
  backendConfig: BackendConfig;
  onRefreshAll: () => void;
  onOpenQuickScan: () => void;
  onNavigateSettings: () => void;
  isRefreshing?: boolean;
}

const SECTION_NAMES_PT: Record<string, string> = {
  'Overview': 'Visão Geral',
  'Network Discovery': 'Deteção de Rede',
  'Asset Inventory': 'Inventário de Ativos',
  'Network Monitoring': 'Monitorização de Rede',
  'Network Connections': 'Ligações de Rede',
  'Traffic Analysis': 'Análise de Tráfego',
  'Events and Alerts': 'Eventos e Alertas',
  'Reports': 'Relatórios',
  'Settings': 'Definições'
};

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  backendConfig,
  onRefreshAll,
  onOpenQuickScan,
  onNavigateSettings,
  isRefreshing = false
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-6 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm text-slate-400 min-w-0">
        <span className="text-slate-500 font-mono text-xs">NEXUS</span>
        <span className="text-slate-600">/</span>
        <span className="font-semibold text-slate-100 truncate">{SECTION_NAMES_PT[currentSection] || currentSection}</span>
      </div>

      {/* Zone 2: Real System Telemetry & Environment Indicator */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
          <span className="text-slate-500">FONTE:</span>
          <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            DADOS REAIS · LINUX HOST DAEMON
          </span>
        </div>

        <div className="text-slate-400 tabular-nums">
          {currentTime}
        </div>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-md transition-colors"
          title="Atualizar telemetria real agora"
          aria-label="Atualizar telemetria"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
        </button>

        <button
          onClick={onOpenQuickScan}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-500/20"
        >
          <Terminal size={14} />
          <span>Executar Varredura Real</span>
        </button>
      </div>
    </header>
  );
};
