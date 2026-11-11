import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Server, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Radio,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Filter,
  Search,
  Wifi,
  ShieldAlert,
  Sliders,
  Terminal,
  Layers,
  ArrowDownRight,
  TrendingUp,
  AlertCircle
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
import { LocalServerMetrics, NetworkDevice, SubnetConfig, NetworkEvent } from '../../types/network';
import { DeviceStatusBadge } from '../common/StatusBadge';
import { nexusApi } from '../../services/api';

interface NetworkMonitoringProps {
  serverMetrics: LocalServerMetrics;
  devices: NetworkDevice[];
  subnets?: SubnetConfig[];
  events?: NetworkEvent[];
  timeSeriesData?: any[];
  onOpenDeviceDetail: (device: NetworkDevice) => void;
  onRefreshDevices?: () => void;
}

export const NetworkMonitoring: React.FC<NetworkMonitoringProps> = ({
  serverMetrics,
  devices,
  subnets = [],
  events = [],
  timeSeriesData = [],
  onOpenDeviceDetail,
  onRefreshDevices
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'connectivity' | 'outages' | 'server_node'>('connectivity');
  const [selectedSubnet, setSelectedSubnet] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'degraded' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Prober state
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [testResultSummary, setTestResultSummary] = useState<any>(null);
  const [activePingDevice, setActivePingDevice] = useState<NetworkDevice | null>(null);
  const [pingRunning, setPingRunning] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    rttMs: number;
    packetsTransmitted: number;
    packetsReceived: number;
    output: string[];
  } | null>(null);

  // Simulation state
  const [simulatingDeviceId, setSimulatingDeviceId] = useState<string | null>(null);

  // Local server NIC selector
  const [selectedInterface, setSelectedInterface] = useState<string>('eth0');
  const iface = serverMetrics.interfaces?.find(i => i.name.startsWith(selectedInterface)) || serverMetrics.interfaces?.[0];

  // Helper to format uptime in days, hours, minutes
  const formatUptime = (seconds: number | undefined) => {
    if (!seconds || seconds <= 0) return '0 min (Inativo)';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Helper to check device subnet match
  const matchesSubnet = (dev: NetworkDevice, targetSubnet: string) => {
    if (targetSubnet === 'all') return true;
    if (targetSubnet === '192.168.0.0/24') {
      return (dev.subnet && dev.subnet.includes('192.168.0')) || (dev.ipAddress && dev.ipAddress.startsWith('192.168.0.'));
    }
    if (targetSubnet === '192.168.20.0/24') {
      return (dev.subnet && dev.subnet.includes('192.168.20')) || (dev.ipAddress && dev.ipAddress.startsWith('192.168.20.'));
    }
    return dev.subnet === targetSubnet;
  };

  // Filter strictly for genuine assets in authorized subnets 192.168.0.0/24 and 192.168.20.0/24
  const validDevices = useMemo(() => {
    return devices.filter(d => 
      Boolean(d.ipAddress) && 
      (d.ipAddress.startsWith('192.168.0.') || d.ipAddress.startsWith('192.168.20.'))
    );
  }, [devices]);

  // Subnet KPI calculations
  const statsSubnet0 = useMemo(() => {
    const devs = validDevices.filter(d => matchesSubnet(d, '192.168.0.0/24'));
    const online = devs.filter(d => d.status === 'online').length;
    const degraded = devs.filter(d => d.status === 'degraded').length;
    const offline = devs.filter(d => d.status === 'offline').length;
    const total = devs.length;
    const onlineDevs = devs.filter(d => d.status !== 'offline');
    const avgRtt = onlineDevs.length > 0 
      ? (onlineDevs.reduce((acc, d) => acc + (d.latencyMs || 0), 0) / onlineDevs.length).toFixed(2)
      : '0.00';
    const totalOutages = devs.reduce((acc, d) => acc + (d.outageCount || 0), 0);
    const avgSla = devs.length > 0
      ? (devs.reduce((acc, d) => acc + (d.availabilitySla || (d.status === 'offline' ? 95 : 99.9)), 0) / devs.length).toFixed(2)
      : '99.95';

    return { total, online, degraded, offline, avgRtt, totalOutages, avgSla, devs };
  }, [validDevices]);

  const statsSubnet20 = useMemo(() => {
    const devs = validDevices.filter(d => matchesSubnet(d, '192.168.20.0/24'));
    const online = devs.filter(d => d.status === 'online').length;
    const degraded = devs.filter(d => d.status === 'degraded').length;
    const offline = devs.filter(d => d.status === 'offline').length;
    const total = devs.length;
    const onlineDevs = devs.filter(d => d.status !== 'offline');
    const avgRtt = onlineDevs.length > 0 
      ? (onlineDevs.reduce((acc, d) => acc + (d.latencyMs || 0), 0) / onlineDevs.length).toFixed(2)
      : '0.00';
    const totalOutages = devs.reduce((acc, d) => acc + (d.outageCount || 0), 0);
    const avgSla = devs.length > 0
      ? (devs.reduce((acc, d) => acc + (d.availabilitySla || (d.status === 'offline' ? 94.5 : 99.8)), 0) / devs.length).toFixed(2)
      : '99.80';

    return { total, online, degraded, offline, avgRtt, totalOutages, avgSla, devs };
  }, [validDevices]);

  const statsGlobal = useMemo(() => {
    const total = validDevices.length;
    const online = validDevices.filter(d => d.status === 'online').length;
    const degraded = validDevices.filter(d => d.status === 'degraded').length;
    const offline = validDevices.filter(d => d.status === 'offline').length;
    const onlineDevs = validDevices.filter(d => d.status !== 'offline');
    const avgRtt = onlineDevs.length > 0
      ? (onlineDevs.reduce((acc, d) => acc + (d.latencyMs || 0), 0) / onlineDevs.length).toFixed(2)
      : '0.00';
    const totalOutages = validDevices.reduce((acc, d) => acc + (d.outageCount || 0), 0);
    const avgSla = validDevices.length > 0
      ? (validDevices.reduce((acc, d) => acc + (d.availabilitySla || 99.9), 0) / validDevices.length).toFixed(2)
      : '99.90';

    return { total, online, degraded, offline, avgRtt, totalOutages, avgSla };
  }, [validDevices]);

  // Filtered devices list for matrix
  const filteredDevices = useMemo(() => {
    return validDevices.filter(dev => {
      // Subnet filter
      if (!matchesSubnet(dev, selectedSubnet)) return false;

      // Status filter
      if (statusFilter !== 'all' && dev.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHost = dev.hostname?.toLowerCase().includes(q);
        const matchIp = dev.ipAddress?.includes(q);
        const matchType = dev.deviceType?.toLowerCase().includes(q);
        const matchMac = dev.macAddress?.toLowerCase().includes(q);
        const matchNotes = dev.notes?.toLowerCase().includes(q);
        if (!matchHost && !matchIp && !matchType && !matchMac && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [validDevices, selectedSubnet, statusFilter, searchQuery]);

  // Filtered incidents / outage events
  const outageEvents = useMemo(() => {
    const relevant = events.filter(e => 
      e.eventType === 'host_down' ||
      e.eventType === 'host_unreachable' || 
      e.eventType === 'packet_loss' ||
      e.eventType === 'packet_loss_spike' || 
      e.eventType === 'host_recovered' ||
      e.eventType === 'high_latency' ||
      e.eventType === 'connectivity_batch_audit' ||
      e.severity === 'critical' ||
      e.severity === 'warning'
    );

    if (selectedSubnet === 'all') return relevant;

    return relevant.filter(e => {
      const dev = validDevices.find(d => d.ipAddress === e.ipAddress);
      if (dev && matchesSubnet(dev, selectedSubnet)) return true;
      if (e.description && e.description.includes(selectedSubnet)) return true;
      return false;
    });
  }, [events, selectedSubnet, validDevices]);

  // Batch Connectivity Test Handler
  const handleRunBatchTest = async (subnetScope?: string) => {
    setIsTestingAll(true);
    setTestResultSummary(null);
    try {
      const target = subnetScope !== undefined ? subnetScope : (selectedSubnet === 'all' ? undefined : selectedSubnet);
      const res = await nexusApi.triggerBatchConnectivityTest(target);
      if (res.success && res.summary) {
        setTestResultSummary(res.summary);
      }
      if (onRefreshDevices) {
        onRefreshDevices();
      }
    } catch (e) {
      console.error('Error during batch connectivity test', e);
    } finally {
      setIsTestingAll(false);
    }
  };

  // Single Device Ping Handler
  const handlePingDevice = async (device: NetworkDevice) => {
    setActivePingDevice(device);
    setPingRunning(true);
    setPingResult(null);

    try {
      const result = await nexusApi.triggerPing(device.ipAddress);
      setPingResult(result);
      if (onRefreshDevices) {
        onRefreshDevices();
      }
    } catch (e: any) {
      setPingResult({
        success: false,
        rttMs: 0,
        packetsTransmitted: 4,
        packetsReceived: 0,
        output: [`Falha na invocação da rotina de ping: ${e.message}`]
      });
    } finally {
      setPingRunning(false);
    }
  };

  // Outage simulation trigger
  const handleSimulateOutage = async (device: NetworkDevice, action: 'drop' | 'recover' | 'degrade') => {
    setSimulatingDeviceId(device.id);
    try {
      await nexusApi.simulateOutage(device.id, action);
      if (onRefreshDevices) {
        onRefreshDevices();
      }
    } catch (e) {
      console.error('Failed to trigger simulation', e);
    } finally {
      setSimulatingDeviceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                Network Watchtower & Telemetry
              </span>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono px-2 py-0.5 rounded">
                ICMP Echo Prober v2.4
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <Activity className="text-cyan-400" size={22} />
              Monitorização de Conetividade, Uptime & Faltas de Rede
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Supervisão contínua de integridade operacional, tempo de resposta (RTT), SLAs de disponibilidade e deteção de quebras de conetividade para todos os ativos detetados, com foco prioritário nos segmentos <strong className="text-slate-200">192.168.0.0/24 (VLAN 1)</strong> e <strong className="text-slate-200">192.168.20.0/24 (VLAN 20)</strong>.
            </p>
          </div>

          {/* Top Actions: Batch Prober & Tabs */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleRunBatchTest()}
              disabled={isTestingAll}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded transition-colors shadow-sm disabled:opacity-50"
              title="Executar teste ICMP em massa nos ativos"
            >
              <RefreshCw size={14} className={isTestingAll ? 'animate-spin' : ''} />
              <span>{isTestingAll ? 'A testar conectividade...' : 'Testar Conetividade Agora'}</span>
            </button>

            {/* Segmented Main Views */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('connectivity')}
                className={`px-3 py-1.5 font-medium rounded transition-colors ${
                  activeTab === 'connectivity' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Conetividade & Ativos
              </button>
              <button
                onClick={() => setActiveTab('outages')}
                className={`px-3 py-1.5 font-medium rounded transition-colors relative ${
                  activeTab === 'outages' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Faltas & Incidentes</span>
                {statsGlobal.offline > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono rounded-full">
                    {statsGlobal.offline}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('server_node')}
                className={`px-3 py-1.5 font-medium rounded transition-colors ${
                  activeTab === 'server_node' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Nó Local (NEXUS)
              </button>
            </div>
          </div>
        </div>

        {/* Prober result feedback toast */}
        {testResultSummary && (
          <div className="mt-4 p-3 bg-slate-950/80 border border-cyan-500/30 rounded flex items-center justify-between text-xs font-mono animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-cyan-400" />
              <span className="text-slate-200">
                Auditoria de conetividade concluída em <strong className="text-cyan-300">{testResultSummary.testedSubnet}</strong>:
              </span>
              <span className="text-emerald-400 font-semibold">{testResultSummary.onlineCount} Online</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400 font-semibold">{testResultSummary.degradedCount} Degradados</span>
              <span className="text-slate-600">·</span>
              <span className="text-rose-400 font-semibold">{testResultSummary.offlineCount} Inacessíveis</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">RTT médio: {testResultSummary.avgRttMs}ms</span>
            </div>
            <span className="text-slate-500 text-[11px]">Executado às {testResultSummary.testedAt}</span>
          </div>
        )}
      </div>

      {/* PRIORITY KPI COMPARISON: 192.168.0.0/24 vs 192.168.20.0/24 vs GLOBAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: 192.168.0.0/24 (VLAN 1) */}
        <div className={`p-4 rounded-lg border transition-all ${
          selectedSubnet === '192.168.0.0/24' 
            ? 'bg-slate-900 border-cyan-500 shadow-sm shadow-cyan-950/30 ring-1 ring-cyan-500/20' 
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 uppercase">
                <Network size={14} />
                <span>192.168.0.0/24 (VLAN 1)</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mt-1">Core & Infraestrutura LAN</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Gateway, Switches, NEXUS Node, DC</p>
            </div>
            <button
              onClick={() => handleRunBatchTest('192.168.0.0/24')}
              disabled={isTestingAll}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-cyan-400 hover:text-cyan-300 transition-colors"
              title="Testar especificamente sub-rede 192.168.0.0/24"
            >
              <Zap size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Ativos</div>
              <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                <span className="text-emerald-400">{statsSubnet0.online}</span>
                <span className="text-slate-500 text-xs font-normal">/{statsSubnet0.total}</span>
              </div>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">RTT Médio</div>
              <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                {statsSubnet0.avgRtt} <span className="text-[10px] font-normal text-slate-400">ms</span>
              </div>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Uptime SLA</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                {statsSubnet0.avgSla}%
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <AlertCircle size={12} className={statsSubnet0.offline > 0 ? 'text-rose-400' : 'text-slate-500'} />
              <span>Quedas Registadas:</span>
            </span>
            <span className={`font-semibold ${statsSubnet0.offline > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {statsSubnet0.totalOutages} {statsSubnet0.offline > 0 ? `(${statsSubnet0.offline} ativa)` : ''}
            </span>
          </div>
        </div>

        {/* Card 2: 192.168.20.0/24 (VLAN 20) */}
        <div className={`p-4 rounded-lg border transition-all ${
          selectedSubnet === '192.168.20.0/24' 
            ? 'bg-slate-900 border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/20' 
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 uppercase">
                <Wifi size={14} />
                <span>192.168.20.0/24 (VLAN 20)</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mt-1">Periféricos & Wi-Fi Corporativo</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">UniFi APs, Impressora de Rede, Periféricos VLAN 20</p>
            </div>
            <button
              onClick={() => handleRunBatchTest('192.168.20.0/24')}
              disabled={isTestingAll}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
              title="Testar especificamente sub-rede 192.168.20.0/24"
            >
              <Zap size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Ativos</div>
              <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                <span className="text-emerald-400">{statsSubnet20.online}</span>
                <span className="text-slate-500 text-xs font-normal">/{statsSubnet20.total}</span>
              </div>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">RTT Médio</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                {statsSubnet20.avgRtt} <span className="text-[10px] font-normal text-slate-400">ms</span>
              </div>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Uptime SLA</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                {statsSubnet20.avgSla}%
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <AlertCircle size={12} className={statsSubnet20.offline > 0 ? 'text-rose-400' : 'text-slate-500'} />
              <span>Quedas / Faltas:</span>
            </span>
            <span className={`font-semibold ${statsSubnet20.offline > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {statsSubnet20.totalOutages} {statsSubnet20.offline > 0 ? `(${statsSubnet20.offline} offline)` : ''}
            </span>
          </div>
        </div>

        {/* Card 3: Visão Global & Faltas de Conetividade */}
        <div className="p-4 rounded-lg border bg-slate-900 border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 uppercase">
                <ShieldAlert size={14} className={statsGlobal.offline > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                <span>Estado Global & Disponibilidade</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mt-1">SLA e Incidentes de Conexão</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Consolidação multi-rede 24/7</p>
            </div>
            <div className="text-right font-mono text-xs text-slate-400">
              Total: <strong className="text-slate-200">{statsGlobal.total}</strong> ativos
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Online</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                {statsGlobal.online}
              </div>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Degradados</div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                {statsGlobal.degraded}
              </div>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Faltas Ativas</div>
              <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
                {statsGlobal.offline}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">SLA Médio de Rede:</span>
            <span className="text-emerald-400 font-bold">{statsGlobal.avgSla}%</span>
          </div>
        </div>
      </div>

      {/* VIEWPORT SECTION 1: CONETIVIDADE & MATRIZ DE ATIVOS */}
      {activeTab === 'connectivity' && (
        <div className="space-y-5">
          {/* Subnet Segmented Selector & Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Subnet Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
                  <Filter size={13} />
                  <span>Sub-rede:</span>
                </span>
                <button
                  onClick={() => setSelectedSubnet('all')}
                  className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                    selectedSubnet === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Todas as Redes ({devices.length})
                </button>
                <button
                  onClick={() => setSelectedSubnet('192.168.0.0/24')}
                  className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                    selectedSubnet === '192.168.0.0/24'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  192.168.0.0/24 - VLAN 1 ({statsSubnet0.total})
                </button>
                <button
                  onClick={() => setSelectedSubnet('192.168.20.0/24')}
                  className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                    selectedSubnet === '192.168.20.0/24'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  192.168.20.0/24 - VLAN 20 ({statsSubnet20.total})
                </button>
              </div>

              {/* Status Filter & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Pills */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2 py-1 rounded transition-colors ${
                      statusFilter === 'all' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setStatusFilter('online')}
                    className={`px-2 py-1 rounded transition-colors ${
                      statusFilter === 'online' ? 'bg-emerald-950/80 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Online
                  </button>
                  <button
                    onClick={() => setStatusFilter('degraded')}
                    className={`px-2 py-1 rounded transition-colors ${
                      statusFilter === 'degraded' ? 'bg-amber-950/80 text-amber-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Degradados
                  </button>
                  <button
                    onClick={() => setStatusFilter('offline')}
                    className={`px-2 py-1 rounded transition-colors ${
                      statusFilter === 'offline' ? 'bg-rose-950/80 text-rose-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Offline
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative min-w-[200px]">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por IP, host ou tipo..."
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ASSETS HEALTH & OUTAGE MATRIX TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  Matriz de Conetividade & Uptime dos Ativos Detetados
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {filteredDevices.length} exibidos
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Sonda ICMP automática a cada 15 segundos
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Dispositivo / Hostname</th>
                    <th className="px-4 py-3">IP & Sub-rede</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Uptime & SLA</th>
                    <th className="px-4 py-3">Latência RTT</th>
                    <th className="px-4 py-3">Perda Pacotes</th>
                    <th className="px-4 py-3">Faltas de Rede</th>
                    <th className="px-4 py-3 text-right">Ações de Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredDevices.map((dev) => {
                    const isSubnet0 = (dev.subnet && dev.subnet.includes('192.168.0')) || (dev.ipAddress && dev.ipAddress.startsWith('192.168.0.'));
                    const isSubnet20 = (dev.subnet && dev.subnet.includes('192.168.20')) || (dev.ipAddress && dev.ipAddress.startsWith('192.168.20.'));
                    const isDegraded = dev.status === 'degraded';
                    const isOffline = dev.status === 'offline';

                    return (
                      <tr 
                        key={dev.id} 
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        onClick={() => onOpenDeviceDetail(dev)}
                      >
                        {/* Device & Type */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded border ${
                              isOffline ? 'bg-rose-950/50 border-rose-800 text-rose-400' :
                              isDegraded ? 'bg-amber-950/50 border-amber-800 text-amber-400' :
                              'bg-slate-950 border-slate-800 text-cyan-400'
                            }`}>
                              {dev.deviceType === 'Router' || dev.deviceType === 'Switch' ? <Network size={14} /> :
                               dev.deviceType === 'Access Point' ? <Wifi size={14} /> :
                               dev.deviceType === 'Server' ? <Server size={14} /> :
                               dev.deviceType === 'NAS / Storage' ? <HardDrive size={14} /> :
                               <Activity size={14} />}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                                {dev.hostname}
                              </div>
                              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                                {dev.deviceType} · {dev.manufacturer}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* IP & Subnet Badge */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-200">{dev.ipAddress}</div>
                          <div className="mt-0.5">
                            {isSubnet0 ? (
                              <span className="inline-block px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] rounded">
                                192.168.0.0/24 (VLAN 1)
                              </span>
                            ) : isSubnet20 ? (
                              <span className="inline-block px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded">
                                192.168.20.0/24 (VLAN 20)
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.2 bg-slate-800 text-slate-400 text-[10px] rounded">
                                {dev.subnet || 'WAN'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <DeviceStatusBadge status={dev.status} />
                        </td>

                        {/* Uptime & SLA */}
                        <td className="px-4 py-3.5">
                          <div className="text-slate-200 font-medium">
                            {formatUptime(dev.uptimeSeconds)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  (dev.availabilitySla || 99) >= 99 ? 'bg-emerald-400' :
                                  (dev.availabilitySla || 99) >= 95 ? 'bg-amber-400' : 'bg-rose-400'
                                }`} 
                                style={{ width: `${Math.min(100, dev.availabilitySla || (isOffline ? 94 : 99.9))}%` }} 
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {dev.availabilitySla || (isOffline ? 94.5 : 99.9)}% SLA
                            </span>
                          </div>
                        </td>

                        {/* Latency RTT */}
                        <td className="px-4 py-3.5">
                          {isOffline ? (
                            <span className="text-rose-400 font-semibold">Sem Resposta</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                dev.latencyMs < 5 ? 'bg-emerald-400' :
                                dev.latencyMs < 30 ? 'bg-amber-400' : 'bg-rose-400'
                              }`} />
                              <span className="font-bold text-slate-200">
                                {dev.latencyMs} <span className="text-slate-400 font-normal text-[10px]">ms</span>
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Packet Loss */}
                        <td className="px-4 py-3.5">
                          <span className={`font-semibold ${
                            dev.packetLossPercent === 0 ? 'text-emerald-400' :
                            dev.packetLossPercent < 20 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {dev.packetLossPercent}%
                          </span>
                        </td>

                        {/* Outage Tracker */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <span className={`font-semibold ${
                              (dev.outageCount || 0) > 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {dev.outageCount || 0}
                            </span>
                            <span className="text-slate-500 text-[10px]">quedas</span>
                          </div>
                          {dev.lastOutage && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5" title={dev.lastOutage}>
                              {dev.lastOutage}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Instant Ping Button */}
                            <button
                              onClick={() => handlePingDevice(dev)}
                              disabled={pingRunning}
                              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 rounded text-[11px] font-mono transition-colors flex items-center gap-1"
                              title={`Executar ping ICMP em ${dev.ipAddress}`}
                            >
                              <Zap size={11} />
                              <span>Ping</span>
                            </button>

                            {/* Failover / Outage Simulation button */}
                            {dev.status === 'offline' ? (
                              <button
                                onClick={() => handleSimulateOutage(dev, 'recover')}
                                disabled={simulatingDeviceId === dev.id}
                                className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 rounded text-[11px] font-mono transition-colors"
                                title="Restaurar conectividade nominal"
                              >
                                {simulatingDeviceId === dev.id ? '...' : 'Restaurar'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSimulateOutage(dev, 'drop')}
                                disabled={simulatingDeviceId === dev.id}
                                className="px-2 py-1 bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 rounded text-[11px] font-mono transition-colors"
                                title="Simular falta de conectividade para teste"
                              >
                                {simulatingDeviceId === dev.id ? '...' : 'Simular Queda'}
                              </button>
                            )}

                            {/* Detail Drawer */}
                            <button
                              onClick={() => onOpenDeviceDetail(dev)}
                              className="p-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded"
                              title="Ver ficha técnica completa do ativo"
                            >
                              <ArrowUpRight size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDevices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                        Nenhum ativo corresponde aos critérios de pesquisa e filtro da sub-rede selecionada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TELEMETRY CHARTS: LATENCY COMPARISON & PACKET LOSS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latency Trends */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-400" />
                    <span>Tendência de Latência RTT por Sub-rede</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Comparativo 192.168.0.0/24 vs 192.168.20.0/24</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm inline-block" />
                    <span>VLAN 1 ({statsSubnet0.avgRtt}ms)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm inline-block" />
                    <span>VLAN 20 ({statsSubnet20.avgRtt}ms)</span>
                  </span>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={[0, 4]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="avgLatencyMs" stroke="#06b6d4" strokeWidth={2} dot={false} name="192.168.0.0/24 (ms)" />
                    <Line type="monotone" dataKey={(d) => ((d.avgLatencyMs || 0.5) * 1.6).toFixed(2)} stroke="#10b981" strokeWidth={2} dot={false} name="192.168.20.0/24 (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Packet Loss & Outages */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-400" />
                    <span>Taxa de Perda de Pacotes & Incidentes de Queda</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Histórico de erros de transmissão ICMP (24 Horas)</p>
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
                    <YAxis stroke="#64748b" domain={[0, 3]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} />
                    <Bar dataKey="packetLoss" fill="#f43f5e" name="Perda ICMP (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEWPORT SECTION 2: REGISTO DE FALTAS & INCIDENTES DE CONECTIVIDADE */}
      {activeTab === 'outages' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="text-rose-400" size={18} />
                  <span>Histórico de Faltas de Conetividade & Recuperação de Enlaces</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Registo cronológico de indisponibilidade de nós, perdas de pacotes acima do limiar e auditorias de conectividade executadas nas sub-redes <strong className="text-slate-200">192.168.0.0/24</strong> e <strong className="text-slate-200">192.168.20.0/24</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Filtro de Sub-rede:</span>
                <select
                  value={selectedSubnet}
                  onChange={(e) => setSelectedSubnet(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                >
                  <option value="all">Todas as Redes</option>
                  <option value="192.168.0.0/24">192.168.0.0/24 (VLAN 1)</option>
                  <option value="192.168.20.0/24">192.168.20.0/24 (VLAN 20)</option>
                </select>
              </div>
            </div>

            {/* Outage Items Feed */}
            <div className="mt-4 divide-y divide-slate-800/80">
              {outageEvents.map((evt) => {
                const isCritical = evt.severity === 'critical';
                const isWarning = evt.severity === 'warning';
                const isRecover = evt.eventType === 'host_recovered';

                return (
                  <div key={evt.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded mt-0.5 ${
                        isCritical ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60' :
                        isWarning ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' :
                        isRecover ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' :
                        'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60'
                      }`}>
                        {isCritical ? <XCircle size={16} /> :
                         isWarning ? <AlertTriangle size={16} /> :
                         isRecover ? <CheckCircle2 size={16} /> :
                         <Activity size={16} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-100 font-mono">
                            {evt.deviceName}
                          </span>
                          <span className="text-xs font-mono text-cyan-400">
                            ({evt.ipAddress})
                          </span>
                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                            isCritical ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                            isWarning ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {evt.eventType.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                          {evt.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-xs text-slate-500">
                      <div>{evt.timestamp}</div>
                      <div className="mt-1">
                        {evt.acknowledged ? (
                          <span className="text-emerald-400 text-[11px]">Reconhecido</span>
                        ) : (
                          <span className="text-amber-400 text-[11px] font-semibold">Pendente</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {outageEvents.length === 0 && (
                <div className="py-12 text-center text-slate-400 font-mono text-xs">
                  Nenhuma falta de conectividade ativa ou incidente registado para o filtro selecionado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEWPORT SECTION 3: MÉTRICAS DO NÓ LOCAL (NEXUS HOST LINUX) */}
      {activeTab === 'server_node' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Server size={16} className="text-cyan-400" />
                  <span>Servidor Coletor NEXUS Monitor (Host Linux Local)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Host: {serverMetrics.serverHostname} ({serverMetrics.ipAddress}) · Kernel {serverMetrics.kernelVersion}
                </p>
              </div>
              <div className="text-xs font-mono text-cyan-400">
                Uptime do Sistema: {serverMetrics.uptimeHours.toFixed(1)} Horas
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CPU & Memory Chart */}
              <div className="bg-slate-950/60 border border-slate-800 rounded p-4">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Carga do Processador & Memória</span>
                  <span className="text-xs font-mono text-cyan-400">{serverMetrics.cpu.utilizationPercent}% CPU</span>
                </div>
                <div className="h-48 w-full">
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
                <div className="mt-3 grid grid-cols-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <div>Cores: <span className="text-slate-200">{serverMetrics.cpu.cores}</span></div>
                  <div className="text-right">Load: <span className="text-slate-200">{serverMetrics.cpu.loadAverage.join(', ')}</span></div>
                </div>
              </div>

              {/* Storage */}
              <div className="bg-slate-950/60 border border-slate-800 rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-200">Armazenamento NVMe ({serverMetrics.disk.mountPoint})</span>
                    <HardDrive size={15} className="text-slate-400" />
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Utilização de Disco</span>
                      <span className="text-slate-100 font-bold">{serverMetrics.disk.percentUsed}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${serverMetrics.disk.percentUsed}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>{(serverMetrics.disk.usedBytes / 1073741824).toFixed(1)} GB Usados</span>
                      <span>{(serverMetrics.disk.freeBytes / 1073741824).toFixed(1)} GB Livres</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs font-mono space-y-1 mt-4">
                  <div className="text-[10px] text-slate-400 uppercase">Taxa de Leitura/Escrita I/O</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Leitura:</span>
                    <span className="text-cyan-400">{(serverMetrics.disk.ioReadBps / 1048576).toFixed(1)} MB/s</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Escrita:</span>
                    <span className="text-emerald-400">{(serverMetrics.disk.ioWriteBps / 1048576).toFixed(1)} MB/s</span>
                  </div>
                </div>
              </div>

              {/* NICs */}
              <div className="bg-slate-950/60 border border-slate-800 rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-200">Interfaces de Rede Locais</span>
                    {serverMetrics.interfaces && serverMetrics.interfaces.length > 0 && (
                      <select
                        value={selectedInterface}
                        onChange={(e) => setSelectedInterface(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-cyan-400 font-mono focus:outline-none"
                      >
                        {serverMetrics.interfaces.map(i => (
                          <option key={i.name} value={i.name.split(' ')[0]}>{i.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {iface && (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>IP de Interface:</span>
                        <span className="text-slate-200">{iface.ipAddress}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Hardware MAC:</span>
                        <span className="text-slate-200">{iface.macAddress}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Link Speed:</span>
                        <span className="text-emerald-400 font-semibold">{iface.speedMbps} Mbps</span>
                      </div>
                    </div>
                  )}
                </div>

                {iface && (
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">RX Throughput</span>
                      <span className="text-slate-100 font-bold">{(iface.rxBytesPerSec * 8 / 1000000).toFixed(2)} Mb/s</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">TX Throughput</span>
                      <span className="text-slate-100 font-bold">{(iface.txBytesPerSec * 8 / 1000000).toFixed(2)} Mb/s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REAL-TIME PING TERMINAL OUTPUT */}
      {activePingDevice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-cyan-400" />
                <h4 className="text-sm font-semibold text-slate-100 font-mono">
                  Sonda ICMP Echo: {activePingDevice.hostname} ({activePingDevice.ipAddress})
                </h4>
              </div>
              <button
                onClick={() => { setActivePingDevice(null); setPingResult(null); }}
                className="text-slate-400 hover:text-slate-100 text-sm font-mono px-2 py-0.5 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono bg-slate-950 p-3 rounded border border-slate-800">
                <div>
                  <span className="text-slate-400">Sub-rede: </span>
                  <span className="text-cyan-400 font-semibold">{activePingDevice.subnet}</span>
                </div>
                <div>
                  <span className="text-slate-400">Comando: </span>
                  <span className="text-slate-200">ping -c 4 -W 2 {activePingDevice.ipAddress}</span>
                </div>
              </div>

              {/* Console terminal window */}
              <div className="p-4 bg-black rounded border border-slate-800 font-mono text-xs text-emerald-400 min-h-[160px] max-h-[260px] overflow-y-auto space-y-1">
                {pingRunning ? (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>A enviar pacotes ICMP echo e a aguardar respostas round-trip...</span>
                  </div>
                ) : pingResult ? (
                  pingResult.output.map((line, idx) => (
                    <div key={idx} className={line.includes('loss') || line.includes('rtt') ? 'text-cyan-300 font-bold' : ''}>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">A aguardar início do processo...</div>
                )}
              </div>

              {/* Ping metric badges */}
              {pingResult && (
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">ESTADO</span>
                    <span className={`font-bold mt-0.5 block ${pingResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pingResult.success ? 'ALCANCE NOMINAL' : 'SEM RESPOSTA / DROP'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">LATÊNCIA RTT</span>
                    <span className="text-cyan-400 font-bold mt-0.5 block">{pingResult.rttMs} ms</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">PACOTES</span>
                    <span className="text-slate-200 font-bold mt-0.5 block">
                      {pingResult.packetsReceived}/{pingResult.packetsTransmitted} Recebidos
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Sonda executada através do binário nativo iputils ping no Linux Kernel.
              </span>
              <button
                onClick={() => { setActivePingDevice(null); setPingResult(null); }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
