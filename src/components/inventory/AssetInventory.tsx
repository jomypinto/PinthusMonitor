import React, { useState, useMemo, useCallback } from 'react';
import { 
  Server, 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Router,
  Network,
  Wifi,
  Laptop,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Play,
  LayoutGrid,
  List,
  Activity,
  Clock,
  Cpu,
  Layers,
  Globe,
  Radio,
  SlidersHorizontal,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { NetworkDevice, DeviceType, DeviceStatus } from '../../types/network';
import { DeviceStatusBadge } from '../common/StatusBadge';
import { exportDevicesToCsv } from '../../services/exportService';
import { nexusApi } from '../../services/api';

interface AssetInventoryProps {
  devices: NetworkDevice[];
  onOpenDeviceDetail: (device: NetworkDevice) => void;
  onRefreshDevices: () => void;
}

export const AssetInventory: React.FC<AssetInventoryProps> = ({
  devices: initialDevices,
  onOpenDeviceDetail,
  onRefreshDevices
}) => {
  // Local state for immediate responsiveness and live ping test overrides
  const [deviceList, setDeviceList] = useState<NetworkDevice[]>(initialDevices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [subnetFilter, setSubnetFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof NetworkDevice>('ipAddress');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 12 : 10;

  // Real-time ping testing feedback state
  const [pingingDeviceId, setPingingDeviceId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { rtt: number; success: boolean; time: string }>>({});
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Batch probe progress state
  const [isBatchProbing, setIsBatchProbing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentHost: string } | null>(null);

  // Automated NIST CVE Lookup state
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [isCveLookingUp, setIsCveLookingUp] = useState(false);
  const [cveLookupSummary, setCveLookupSummary] = useState<{
    message: string;
    timestamp: string;
    maxScore: number;
    vulnerableCount: number;
    cleanCount: number;
  } | null>(null);
  const [individualCveScanId, setIndividualCveScanId] = useState<string | null>(null);

  // Sync when parent prop changes
  React.useEffect(() => {
    setDeviceList(initialDevices);
  }, [initialDevices]);

  // Automated NIST CVE Lookup trigger
  const handleAutomatedCveLookup = async (targetDeviceId?: string) => {
    if (targetDeviceId) {
      setIndividualCveScanId(targetDeviceId);
    } else {
      setIsCveLookingUp(true);
    }

    try {
      const res = await nexusApi.automatedCveLookup(targetDeviceId);
      if (res && res.data) {
        setDeviceList(res.data);
        setCveLookupSummary({
          message: targetDeviceId
            ? `Lookup NIST concluído para o nó selecionado: CVSS Score ${(res.data.find(d => d.id === targetDeviceId)?.nistRiskScore || 0).toFixed(1)} (${res.data.find(d => d.id === targetDeviceId)?.nistRiskLevel || 'SAFE'}).`
            : `Lookup automatizado NIST/CVE concluído: ${res.totalAudited} ativos auditados contra NVD. ${res.vulnerableCount} com CVEs detetadas (Score Máximo: ${res.maxRiskScore} CVSS).`,
          timestamp: new Date().toLocaleTimeString(),
          maxScore: res.maxRiskScore,
          vulnerableCount: res.vulnerableCount,
          cleanCount: res.cleanCount
        });
        onRefreshDevices();
      }
    } catch (err: any) {
      setCveLookupSummary({
        message: `Falha no lookup NIST: ${err.message || 'Erro de comunicação'}`,
        timestamp: new Date().toLocaleTimeString(),
        maxScore: 0,
        vulnerableCount: 0,
        cleanCount: 0
      });
    } finally {
      setIsCveLookingUp(false);
      setIndividualCveScanId(null);
    }
  };

  // Copy IP to clipboard helper
  const handleCopyIp = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Run single real ping probe via backend API
  const handlePingDevice = async (device: NetworkDevice, e: React.MouseEvent) => {
    e.stopPropagation();
    setPingingDeviceId(device.id);

    try {
      const res = await nexusApi.triggerPing(device.ipAddress);
      const isUp = res.success;
      const rtt = res.rttMs || (isUp ? 0.3 : 0);

      setPingResults(prev => ({
        ...prev,
        [device.id]: {
          rtt,
          success: isUp,
          time: new Date().toLocaleTimeString()
        }
      }));

      // Update in local state
      setDeviceList(prev => prev.map(d => {
        if (d.id === device.id) {
          return {
            ...d,
            latencyMs: rtt,
            status: isUp ? (rtt > 45 ? 'degraded' : 'online') : 'offline',
            packetLossPercent: isUp ? 0 : 100,
            lastSeen: 'Agora mesmo'
          };
        }
        return d;
      }));
    } catch {
      setPingResults(prev => ({
        ...prev,
        [device.id]: {
          rtt: 0,
          success: false,
          time: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setPingingDeviceId(null);
    }
  };

  // Run sequential batch ping probe on all devices currently in view
  const handleBatchProbeAll = async () => {
    if (isBatchProbing || deviceList.length === 0) return;
    setIsBatchProbing(true);

    const total = deviceList.length;
    for (let i = 0; i < total; i++) {
      const dev = deviceList[i];
      setBatchProgress({ current: i + 1, total, currentHost: `${dev.hostname} (${dev.ipAddress})` });

      try {
        const res = await nexusApi.triggerPing(dev.ipAddress);
        const isUp = res.success;
        const rtt = res.rttMs || (isUp ? 0.3 : 0);

        setPingResults(prev => ({
          ...prev,
          [dev.id]: { rtt, success: isUp, time: new Date().toLocaleTimeString() }
        }));

        setDeviceList(prev => prev.map(d => {
          if (d.id === dev.id) {
            return {
              ...d,
              latencyMs: rtt,
              status: isUp ? (rtt > 45 ? 'degraded' : 'online') : 'offline',
              packetLossPercent: isUp ? 0 : 100,
              lastSeen: 'Agora mesmo'
            };
          }
          return d;
        }));
      } catch {
        // ignore individual failures during batch sweep
      }
    }

    setIsBatchProbing(false);
    setBatchProgress(null);
    onRefreshDevices();
  };

  // Device category counts & health breakdown
  const categoryStats = useMemo(() => {
    const categories: Record<string, { total: number; online: number; degraded: number; offline: number }> = {
      'Router': { total: 0, online: 0, degraded: 0, offline: 0 },
      'Server': { total: 0, online: 0, degraded: 0, offline: 0 },
      'Switch': { total: 0, online: 0, degraded: 0, offline: 0 },
      'Access Point': { total: 0, online: 0, degraded: 0, offline: 0 },
      'Workstation': { total: 0, online: 0, degraded: 0, offline: 0 },
      'Printer': { total: 0, online: 0, degraded: 0, offline: 0 },
      'NAS / Storage': { total: 0, online: 0, degraded: 0, offline: 0 },
      'IoT / Embedded': { total: 0, online: 0, degraded: 0, offline: 0 }
    };

    deviceList.forEach(d => {
      const cat = categories[d.deviceType] || { total: 0, online: 0, degraded: 0, offline: 0 };
      cat.total += 1;
      if (d.status === 'online') cat.online += 1;
      else if (d.status === 'degraded') cat.degraded += 1;
      else cat.offline += 1;
      categories[d.deviceType] = cat;
    });

    return categories;
  }, [deviceList]);

  // Overall KPI counts
  const totalAssets = deviceList.length;
  const onlineAssets = deviceList.filter(d => d.status === 'online').length;
  const degradedAssets = deviceList.filter(d => d.status === 'degraded').length;
  const offlineAssets = deviceList.filter(d => d.status === 'offline').length;
  const uncatalogedAssets = deviceList.filter(d => !d.isAuthorized).length;

  // NIST Risk distribution counts
  const criticalRiskAssets = deviceList.filter(d => (d.nistRiskLevel === 'CRITICAL' || (d.nistRiskScore || 0) >= 9.0)).length;
  const highRiskAssets = deviceList.filter(d => (d.nistRiskLevel === 'HIGH' || ((d.nistRiskScore || 0) >= 7.0 && (d.nistRiskScore || 0) < 9.0))).length;
  const mediumRiskAssets = deviceList.filter(d => (d.nistRiskLevel === 'MEDIUM' || ((d.nistRiskScore || 0) >= 4.0 && (d.nistRiskScore || 0) < 7.0))).length;
  const safeRiskAssets = deviceList.filter(d => (!d.nistRiskScore || d.nistRiskScore === 0 || d.nistRiskLevel === 'SAFE')).length;

  const averageLatency = useMemo(() => {
    const responsive = deviceList.filter(d => d.status === 'online' && d.latencyMs > 0);
    if (responsive.length === 0) return 0;
    const sum = responsive.reduce((acc, d) => acc + d.latencyMs, 0);
    return Number((sum / responsive.length).toFixed(1));
  }, [deviceList]);

  // Subnets & Types for Filter
  const availableSubnets = useMemo(() => {
    return Array.from(new Set(deviceList.map(d => d.subnet)));
  }, [deviceList]);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(deviceList.map(d => d.deviceType)));
  }, [deviceList]);

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    return deviceList.filter(device => {
      const q = search.toLowerCase();
      const matchesSearch = 
        device.hostname.toLowerCase().includes(q) ||
        device.ipAddress.includes(q) ||
        device.macAddress.toLowerCase().includes(q) ||
        device.manufacturer.toLowerCase().includes(q) ||
        device.operatingSystem.toLowerCase().includes(q) ||
        (device.cpeMatch && device.cpeMatch.toLowerCase().includes(q)) ||
        device.tags.some(t => t.toLowerCase().includes(q));

      const matchesStatus = 
        statusFilter === 'all' 
          ? true 
          : statusFilter === 'uncataloged' 
            ? !device.isAuthorized 
            : device.status === statusFilter;

      const matchesType = typeFilter === 'all' || device.deviceType === typeFilter;
      const matchesSubnet = subnetFilter === 'all' || device.subnet === subnetFilter;

      const matchesRisk = 
        riskFilter === 'all'
          ? true
          : riskFilter === 'CRITICAL'
            ? (device.nistRiskLevel === 'CRITICAL' || (device.nistRiskScore || 0) >= 9.0)
            : riskFilter === 'HIGH'
              ? (device.nistRiskLevel === 'HIGH' || ((device.nistRiskScore || 0) >= 7.0 && (device.nistRiskScore || 0) < 9.0))
              : riskFilter === 'MEDIUM'
                ? (device.nistRiskLevel === 'MEDIUM' || ((device.nistRiskScore || 0) >= 4.0 && (device.nistRiskScore || 0) < 7.0))
                : (device.nistRiskLevel === 'SAFE' || !device.nistRiskScore || device.nistRiskScore === 0);

      return matchesSearch && matchesStatus && matchesType && matchesSubnet && matchesRisk;
    }).sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';

      if (sortBy === 'ipAddress') {
        const ipA = (a.ipAddress.split('.').map(Number));
        const ipB = (b.ipAddress.split('.').map(Number));
        for (let i = 0; i < 4; i++) {
          if (ipA[i] !== ipB[i]) {
            return (ipA[i] - ipB[i]) * order;
          }
        }
        return 0;
      }

      if (sortBy === 'nistRiskScore') {
        const scoreA = a.nistRiskScore ?? 0;
        const scoreB = b.nistRiskScore ?? 0;
        return (scoreA - scoreB) * order;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * order;
      }
      return String(valA).localeCompare(String(valB)) * order;
    });
  }, [deviceList, search, statusFilter, typeFilter, subnetFilter, riskFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage) || 1;
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: keyof NetworkDevice) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Helper to format uptime cleanly
  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'Indisponível';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Helper to pick category icon
  const getCategoryIcon = (type: DeviceType) => {
    switch (type) {
      case 'Router':
      case 'Firewall':
        return <Router size={16} className="text-cyan-400" />;
      case 'Server':
      case 'Virtual Machine':
        return <Server size={16} className="text-indigo-400" />;
      case 'Switch':
        return <Network size={16} className="text-amber-400" />;
      case 'Access Point':
        return <Wifi size={16} className="text-emerald-400" />;
      case 'Workstation':
        return <Laptop size={16} className="text-blue-400" />;
      case 'Printer':
        return <Printer size={16} className="text-slate-400" />;
      case 'NAS / Storage':
        return <HardDrive size={16} className="text-purple-400" />;
      default:
        return <Radio size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Painel de Inventário de Ativos & Matriz de Estado
              </h1>
              <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                Segmento Local: 192.168.0.0/24
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Identificação completa de hardware, interfaces físicas, nós de rede e servidores locais com diagnóstico contínuo de conectividade e tempo de resposta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-cyan-400 font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Grade de Cards"
              >
                <LayoutGrid size={14} />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-slate-800 text-cyan-400 font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Tabela Técnica"
              >
                <List size={14} />
                <span>Tabela</span>
              </button>
            </div>

            {/* Batch Ping Probe Button */}
            <button
              onClick={handleBatchProbeAll}
              disabled={isBatchProbing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-md transition-colors shadow-sm"
              title="Testar ping em tempo real para todos os ativos listados"
            >
              {isBatchProbing ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-slate-950" />
                  <span>Sondando ({batchProgress?.current}/{batchProgress?.total})...</span>
                </>
              ) : (
                <>
                  <Activity size={13} />
                  <span>Sondar Todos os Ativos</span>
                </>
              )}
            </button>

            {/* Automated NIST CVE Lookup Button */}
            <button
              onClick={() => handleAutomatedCveLookup()}
              disabled={isCveLookingUp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-100 rounded-md transition-colors shadow-sm border border-rose-500/40"
              title="Executar lookup automatizado de vulnerabilidades contra bases públicas NIST NVD e MITRE"
            >
              {isCveLookingUp ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-slate-100" />
                  <span>Consultando NIST NVD...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={13} className="text-rose-200" />
                  <span>Automated NIST CVE Lookup</span>
                </>
              )}
            </button>

            {/* Export Action */}
            <button
              onClick={() => exportDevicesToCsv(filteredDevices)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
            >
              <Download size={13} />
              <span>Exportar CSV</span>
            </button>

            {/* Refresh Action */}
            <button
              onClick={onRefreshDevices}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
              title="Recarregar do daemon do sistema"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* NIST CVE Lookup Banner */}
        {cveLookupSummary && (
          <div className="mt-4 p-3 bg-slate-950/90 border border-slate-700 rounded-md flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <div className={`p-1 rounded ${cveLookupSummary.maxScore >= 9.0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <ShieldCheck size={14} />
              </div>
              <div>
                <span className="text-slate-200 font-medium">{cveLookupSummary.message}</span>
                <span className="ml-2 text-slate-400 text-[10px]">({cveLookupSummary.timestamp})</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-[11px]">
                Score Máx: <strong className={cveLookupSummary.maxScore >= 9.0 ? 'text-rose-400' : 'text-amber-400'}>{cveLookupSummary.maxScore.toFixed(1)} CVSS</strong>
              </span>
              <button 
                onClick={() => setCveLookupSummary(null)} 
                className="text-slate-400 hover:text-slate-200 text-xs px-1"
                title="Fechar"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Batch Probe Live Banner */}
        {isBatchProbing && batchProgress && (
          <div className="mt-4 p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span className="text-cyan-200 font-mono">
                Sondagem de ICMP em curso ({batchProgress.current} de {batchProgress.total}): {batchProgress.currentHost}
              </span>
            </div>
            <span className="font-mono text-cyan-400 tabular-nums">
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* 2. Top Metric KPI Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Assets */}
        <div 
          onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-800/80 border-cyan-500/60 ring-1 ring-cyan-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Total de Ativos</span>
            <Server size={15} className="text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-100">{totalAssets}</span>
            <span className="text-[11px] text-slate-400">equipamentos</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono truncate">
            {availableSubnets.length} sub-redes mapeadas
          </div>
        </div>

        {/* Online Assets */}
        <div 
          onClick={() => { setStatusFilter('online'); setCurrentPage(1); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            statusFilter === 'online'
              ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-emerald-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span className="font-medium">Operacionais (Online)</span>
            <CheckCircle2 size={15} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-300">{onlineAssets}</span>
            <span className="text-[11px] text-emerald-400/80 font-mono">
              ({totalAssets > 0 ? Math.round((onlineAssets / totalAssets) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Latência média: <span className="text-emerald-300 tabular-nums">{averageLatency}ms</span>
          </div>
        </div>

        {/* Degraded Assets */}
        <div 
          onClick={() => { setStatusFilter('degraded'); setCurrentPage(1); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            statusFilter === 'degraded'
              ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-amber-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span className="font-medium">Em Alerta (Degradado)</span>
            <AlertTriangle size={15} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-300">{degradedAssets}</span>
            <span className="text-[11px] text-amber-400/80">atenção</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            RTT &gt; 45ms ou perda de pacotes
          </div>
        </div>

        {/* Offline Assets */}
        <div 
          onClick={() => { setStatusFilter('offline'); setCurrentPage(1); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            statusFilter === 'offline'
              ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-rose-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span className="font-medium">Inacessíveis (Offline)</span>
            <XCircle size={15} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-300">{offlineAssets}</span>
            <span className="text-[11px] text-rose-400/80">sem resposta</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Falha no ICMP Echo
          </div>
        </div>

        {/* Rogue / Uncataloged */}
        <div 
          onClick={() => { setStatusFilter('uncataloged'); setCurrentPage(1); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all col-span-2 md:col-span-1 ${
            statusFilter === 'uncataloged'
              ? 'bg-purple-950/30 border-purple-500/60 ring-1 ring-purple-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-purple-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-purple-400 text-xs">
            <span className="font-medium">Não Catalogados</span>
            <ShieldAlert size={15} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-purple-300">{uncatalogedAssets}</span>
            <span className="text-[11px] text-purple-400/80">auditoria</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Detetados na tabela ARP
          </div>
        </div>
      </div>

      {/* 3. Category Distribution & Health Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-medium text-slate-300 uppercase tracking-wider font-mono text-[11px]">
            Distribuição & Saúde por Categoria de Ativo
          </span>
          <span className="text-slate-400 text-[11px]">
            Clique numa categoria para filtrar
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Object.entries(categoryStats).filter(([_, stats]) => stats.total > 0).map(([catName, stats]) => {
            const isSelected = typeFilter === catName;
            const healthRatio = stats.total > 0 ? (stats.online / stats.total) * 100 : 0;
            return (
              <div
                key={catName}
                onClick={() => {
                  setTypeFilter(isSelected ? 'all' : catName);
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-500/80 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(catName as DeviceType)}
                    <span className="font-medium text-slate-200 truncate">{catName}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px] font-semibold">{stats.total}</span>
                </div>

                {/* Mini health bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${(stats.online / stats.total) * 100}%` }} 
                    className="bg-emerald-500 h-full" 
                  />
                  <div 
                    style={{ width: `${(stats.degraded / stats.total) * 100}%` }} 
                    className="bg-amber-500 h-full" 
                  />
                  <div 
                    style={{ width: `${(stats.offline / stats.total) * 100}%` }} 
                    className="bg-rose-500 h-full" 
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                  <span>{stats.online}/{stats.total} online</span>
                  <span className="text-emerald-400">{Math.round(healthRatio)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Search and Multi-Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Universal Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por hostname, IP, MAC, fabricante, OS ou tags..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Quick Status Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {[
              { id: 'all', label: 'Todos', count: totalAssets },
              { id: 'online', label: 'Online', count: onlineAssets },
              { id: 'degraded', label: 'Degradado', count: degradedAssets },
              { id: 'offline', label: 'Offline', count: offlineAssets },
              { id: 'uncataloged', label: 'Não Autorizados', count: uncatalogedAssets }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  statusFilter === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1.5 text-[11px] font-mono text-slate-400 tabular-nums">
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter size={13} />
            <span className="font-mono text-[11px] uppercase">Filtros Avançados:</span>
          </div>

          {/* Device Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
          >
            <option value="all">Todas as Categorias</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Subnet Dropdown */}
          <select
            value={subnetFilter}
            onChange={(e) => { setSubnetFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-mono"
          >
            <option value="all">Todas as Sub-redes</option>
            {availableSubnets.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* NIST Risk Level Dropdown */}
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-rose-500 text-xs font-mono"
          >
            <option value="all">Todos os Riscos NIST</option>
            <option value="CRITICAL">NIST Crítico (CVSS 9.0 - 10.0) ({criticalRiskAssets})</option>
            <option value="HIGH">NIST Alto (CVSS 7.0 - 8.9) ({highRiskAssets})</option>
            <option value="MEDIUM">NIST Médio (CVSS 4.0 - 6.9) ({mediumRiskAssets})</option>
            <option value="SAFE">NIST Seguro / 0 CVEs ({safeRiskAssets})</option>
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400 text-[11px] font-mono uppercase">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value as keyof NetworkDevice)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-mono"
            >
              <option value="ipAddress">Endereço IP</option>
              <option value="nistRiskScore">Risco NIST / CVSS</option>
              <option value="latencyMs">Latência (RTT)</option>
              <option value="hostname">Hostname</option>
              <option value="uptimeSeconds">Uptime</option>
              <option value="manufacturer">Fabricante</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono"
              title={sortOrder === 'asc' ? 'Ordem Ascendente' : 'Ordem Descendente'}
            >
              {sortOrder === 'asc' ? 'ASC' : 'DESC'}
            </button>
          </div>

          {(search || statusFilter !== 'all' || typeFilter !== 'all' || subnetFilter !== 'all' || riskFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTypeFilter('all');
                setSubnetFilter('all');
                setRiskFilter('all');
                setCurrentPage(1);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* 5. Content Presentation: Grid View vs. Table View */}
      {viewMode === 'grid' ? (
        /* GRID VIEW (Rich Asset Status Cards) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedDevices.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-lg">
              <Server size={32} className="mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-300">Nenhum ativo de rede encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de pesquisa ou execute uma nova varredura de rede.</p>
            </div>
          ) : (
            paginatedDevices.map(device => {
              const isPinging = pingingDeviceId === device.id;
              const pingResult = pingResults[device.id];
              const isLocalHost = device.ipAddress === '192.168.0.13';
              const isGateway = device.ipAddress === '192.168.0.1';

              return (
                <div
                  key={device.id}
                  onClick={() => onOpenDeviceDetail(device)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          {getCategoryIcon(device.deviceType)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-slate-100 truncate group-hover:text-cyan-400 transition-colors">
                              {device.hostname}
                            </span>
                            {isLocalHost && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                                HOST
                              </span>
                            )}
                            {isGateway && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                                GW
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span>{device.deviceType}</span>
                            <span>·</span>
                            <span className="text-slate-400 truncate max-w-[120px]">{device.manufacturer}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        <DeviceStatusBadge status={device.status} />
                      </div>
                    </div>

                    {/* Network Coordinates */}
                    <div className="mt-3.5 p-2.5 rounded bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">ENDEREÇO IP:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyan-400 font-semibold">{device.ipAddress}</span>
                          <button
                            onClick={(e) => handleCopyIp(device.ipAddress, e)}
                            className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                            title="Copiar IP"
                          >
                            {copiedIp === device.ipAddress ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">MAC ADDRESS:</span>
                        <span className="text-slate-300">{device.macAddress}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">SEGMENTO / VLAN:</span>
                        <span className="text-slate-400">{device.subnet} (VLAN {device.vlan})</span>
                      </div>
                    </div>

                    {/* Performance & Health Metrics */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Latência (RTT):</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className={`font-semibold tabular-nums ${
                            device.status === 'offline' 
                              ? 'text-rose-400' 
                              : device.latencyMs > 45 
                                ? 'text-amber-400' 
                                : 'text-emerald-400'
                          }`}>
                            {device.status === 'offline' ? 'Inacessível' : `${device.latencyMs} ms`}
                          </span>
                        </div>
                      </div>

                      {/* Latency Bar */}
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            device.status === 'offline'
                              ? 'bg-rose-500 w-full'
                              : device.latencyMs < 10
                                ? 'bg-emerald-400'
                                : device.latencyMs < 30
                                  ? 'bg-emerald-500'
                                  : device.latencyMs < 60
                                    ? 'bg-amber-400'
                                    : 'bg-rose-400'
                          }`}
                          style={{
                            width: device.status === 'offline' 
                              ? '100%' 
                              : `${Math.min(100, Math.max(5, (device.latencyMs / 60) * 100))}%`
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-400">
                        <div>
                          <span className="text-slate-400">Uptime: </span>
                          <span className="text-slate-200">{formatUptime(device.uptimeSeconds)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400">Perda: </span>
                          <span className={device.packetLossPercent > 0 ? 'text-amber-400 font-semibold' : 'text-slate-200'}>
                            {device.packetLossPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Firmware & CVE Posture Tag */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[150px]" title={device.firmwareVersion || device.operatingSystem}>
                          {device.firmwareVersion || device.operatingSystem}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {device.firmwareUpdateStatus === 'update_available' && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                              Update
                            </span>
                          )}
                          {device.firmwareUpdateStatus === 'critical_update' && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono border border-rose-500/20">
                              Crítico
                            </span>
                          )}
                          {(device.vulnerabilities?.length || 0) > 0 ? (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30">
                              {device.vulnerabilities?.length} CVE{device.vulnerabilities?.length! > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-emerald-400">
                              0 CVEs
                            </span>
                          )}
                        </div>
                      </div>

                      {/* NIST CVSS Risk Score Block */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            (device.nistRiskLevel === 'CRITICAL' || (device.nistRiskScore || 0) >= 9.0)
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : (device.nistRiskLevel === 'HIGH' || (device.nistRiskScore || 0) >= 7.0)
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : (device.nistRiskLevel === 'MEDIUM' || (device.nistRiskScore || 0) >= 4.0)
                                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                                  : (device.nistRiskLevel === 'LOW' || (device.nistRiskScore || 0) > 0)
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            CVSS {device.nistRiskScore !== undefined ? device.nistRiskScore.toFixed(1) : '0.0'} · {device.nistRiskLevel || 'SAFE'}
                          </span>
                          {device.cveLookupStatus === 'synced' && (
                            <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-0.5" title="Sincronizado com feed NIST NVD">
                              <ShieldCheck size={11} />
                              NIST Sync
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {device.compliance && (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                              device.compliance.grade === 'A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              device.compliance.grade === 'B' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                              device.compliance.grade === 'C' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`} title={`CIS Benchmark ${device.compliance.benchmarkName} (${device.compliance.complianceScore}%)`}>
                              CIS {device.compliance.grade} ({device.compliance.complianceScore}%)
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[90px]" title={device.cpeMatch || 'CPE'}>
                            {device.cpeMatch ? device.cpeMatch.split(':')[4] || device.cpeMatch : 'Sem CPE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => handlePingDevice(device, e)}
                      disabled={isPinging}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded text-xs font-mono transition-colors disabled:opacity-50"
                      title="Disparar sonda de ICMP em tempo real para este ativo"
                    >
                      {isPinging ? (
                        <>
                          <RefreshCw size={12} className="animate-spin text-cyan-400" />
                          <span>Sondando...</span>
                        </>
                      ) : (
                        <>
                          <Activity size={12} className="text-cyan-400" />
                          <span>Testar Ping</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutomatedCveLookup(device.id);
                      }}
                      disabled={individualCveScanId === device.id}
                      className="p-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-rose-300 border border-slate-800 hover:border-rose-700 rounded text-xs font-mono transition-colors flex items-center gap-1 disabled:opacity-50"
                      title="Executar Automated NIST CVE Lookup para este ativo"
                    >
                      {individualCveScanId === device.id ? (
                        <RefreshCw size={12} className="animate-spin text-rose-400" />
                      ) : (
                        <ShieldAlert size={12} className="text-rose-400" />
                      )}
                      <span>CVE</span>
                    </button>

                    <button
                      onClick={() => onOpenDeviceDetail(device)}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs font-medium transition-colors"
                    >
                      Inspecionar
                    </button>
                  </div>

                  {/* Live Ping Feedback Result Banner */}
                  {pingResult && (
                    <div className={`mt-2 p-1.5 rounded text-[11px] font-mono flex items-center justify-between ${
                      pingResult.success 
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' 
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                    }`}>
                      <span>Ping: {pingResult.rtt}ms {pingResult.success ? '(OK)' : '(Timeout)'}</span>
                      <span className="text-slate-400 text-[10px]">{pingResult.time}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE VIEW (Dense Technical Equipment List) */
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] select-none">
                  <th 
                    onClick={() => handleSort('hostname')} 
                    className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ATIVO / HOSTNAME</span>
                      <ArrowUpDown size={12} className={sortBy === 'hostname' ? 'text-cyan-400' : 'text-slate-600'} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('ipAddress')} 
                    className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>IP / SUB-REDE</span>
                      <ArrowUpDown size={12} className={sortBy === 'ipAddress' ? 'text-cyan-400' : 'text-slate-600'} />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">MAC ADDRESS</th>
                  <th 
                    onClick={() => handleSort('manufacturer')} 
                    className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>FABRICANTE</span>
                      <ArrowUpDown size={12} className={sortBy === 'manufacturer' ? 'text-cyan-400' : 'text-slate-600'} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('deviceType')} 
                    className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>CATEGORIA</span>
                      <ArrowUpDown size={12} className={sortBy === 'deviceType' ? 'text-cyan-400' : 'text-slate-600'} />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">FIRMWARE & CVEs</th>
                  <th 
                    onClick={() => handleSort('nistRiskScore')} 
                    className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>RISCO NIST / CVSS</span>
                      <ArrowUpDown size={12} className={sortBy === 'nistRiskScore' ? 'text-cyan-400' : 'text-slate-600'} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('latencyMs')} 
                    className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ESTADO / RTT</span>
                      <ArrowUpDown size={12} className={sortBy === 'latencyMs' ? 'text-cyan-400' : 'text-slate-600'} />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">UPTIME</th>
                  <th className="py-3 px-4 font-medium text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedDevices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                      Nenhum dispositivo encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedDevices.map(device => {
                    const isPinging = pingingDeviceId === device.id;
                    const isLocalHost = device.ipAddress === '192.168.0.13';

                    return (
                      <tr 
                        key={device.id} 
                        onClick={() => onOpenDeviceDetail(device)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0">{getCategoryIcon(device.deviceType)}</span>
                            <span className="truncate max-w-[160px]">{device.hostname}</span>
                            {isLocalHost && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                LOCAL
                              </span>
                            )}
                            {!device.isAuthorized && (
                              <span title="Dispositivo não catalogado / suspeito" className="text-amber-400">
                                <ShieldAlert size={14} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-cyan-400 font-semibold">{device.ipAddress}</span>
                            <button
                              onClick={(e) => handleCopyIp(device.ipAddress, e)}
                              className="text-slate-400 hover:text-slate-200 p-0.5"
                              title="Copiar IP"
                            >
                              {copiedIp === device.ipAddress ? (
                                <Check size={11} className="text-emerald-400" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans">VLAN {device.vlan}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{device.macAddress}</td>
                        <td className="py-3 px-4 text-slate-300 font-sans">{device.manufacturer}</td>
                        <td className="py-3 px-4 text-slate-300 font-sans">{device.deviceType}</td>
                        <td className="py-3 px-4 font-sans">
                          <div className="text-slate-200 text-xs font-medium truncate max-w-[150px]" title={device.firmwareVersion || device.operatingSystem}>
                            {device.firmwareVersion || device.operatingSystem}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {device.firmwareUpdateStatus === 'update_available' && (
                              <span className="text-[10px] text-amber-400 font-mono">Update</span>
                            )}
                            {device.firmwareUpdateStatus === 'critical_update' && (
                              <span className="text-[10px] text-rose-400 font-mono font-bold">Crítico</span>
                            )}
                            {device.firmwareUpdateStatus === 'up_to_date' && (
                              <span className="text-[10px] text-emerald-400 font-mono">Em dia</span>
                            )}
                            {(device.vulnerabilities?.length || 0) > 0 ? (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                                {device.vulnerabilities?.length} CVE{device.vulnerabilities?.length! > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">0 CVEs</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                              (device.nistRiskLevel === 'CRITICAL' || (device.nistRiskScore || 0) >= 9.0)
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : (device.nistRiskLevel === 'HIGH' || (device.nistRiskScore || 0) >= 7.0)
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : (device.nistRiskLevel === 'MEDIUM' || (device.nistRiskScore || 0) >= 4.0)
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                                    : (device.nistRiskLevel === 'LOW' || (device.nistRiskScore || 0) > 0)
                                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {device.nistRiskScore !== undefined ? device.nistRiskScore.toFixed(1) : '0.0'} {device.nistRiskLevel || 'SAFE'}
                            </span>
                            {device.compliance && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                device.compliance.grade === 'A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                device.compliance.grade === 'B' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                                device.compliance.grade === 'C' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`} title={`CIS Benchmark: ${device.compliance.benchmarkName} (${device.compliance.complianceScore}%)`}>
                                CIS {device.compliance.grade} ({device.compliance.complianceScore}%)
                              </span>
                            )}
                          </div>
                          {device.cpeMatch && (
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[170px] mt-0.5" title={device.cpeMatch}>
                              {device.cpeMatch}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <DeviceStatusBadge status={device.status} />
                            {device.status === 'online' && (
                              <span className="text-[11px] text-slate-400 tabular-nums">
                                {device.latencyMs}ms
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">
                          {formatUptime(device.uptimeSeconds)}
                        </td>
                        <td className="py-3 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => handlePingDevice(device, e)}
                              disabled={isPinging}
                              className="p-1 px-2 text-xs text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded font-mono border border-slate-800 transition-colors"
                              title="Testar ping em tempo real"
                            >
                              {isPinging ? <RefreshCw size={12} className="animate-spin text-cyan-400" /> : 'Ping'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutomatedCveLookup(device.id);
                              }}
                              disabled={individualCveScanId === device.id}
                              className="p-1 px-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded font-mono border border-slate-800 transition-colors flex items-center gap-1"
                              title="Executar Automated NIST CVE Lookup para este ativo"
                            >
                              {individualCveScanId === device.id ? (
                                <RefreshCw size={11} className="animate-spin text-rose-400" />
                              ) : (
                                <ShieldAlert size={11} />
                              )}
                              <span>CVE</span>
                            </button>
                            <button
                              onClick={() => onOpenDeviceDetail(device)}
                              className="px-2.5 py-1 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded font-medium transition-colors"
                            >
                              Inspecionar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Mostrando <span className="font-semibold text-slate-200 tabular-nums">{paginatedDevices.length}</span> de{' '}
              <span className="font-semibold text-slate-200 tabular-nums">{filteredDevices.length}</span> ativos
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-xs text-slate-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View Pagination Footer if in Grid Mode */}
      {viewMode === 'grid' && totalPages > 1 && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-400">
          <div>
            Mostrando <span className="font-semibold text-slate-200 tabular-nums">{paginatedDevices.length}</span> de{' '}
            <span className="font-semibold text-slate-200 tabular-nums">{filteredDevices.length}</span> ativos
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-xs text-slate-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
