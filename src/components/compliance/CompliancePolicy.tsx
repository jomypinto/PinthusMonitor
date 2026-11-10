import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Filter, 
  Download, 
  Search, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Wrench, 
  FileText,
  Sliders,
  Check,
  Copy,
  Terminal,
  Server,
  Sparkles
} from 'lucide-react';
import { NetworkDevice } from '../../types/network';
import { 
  ComplianceStandard, 
  ComplianceSeverity, 
  ComplianceStatus, 
  ComplianceRule, 
  ComplianceCategory,
  FleetComplianceOverview 
} from '../../types/compliance';
import { nexusApi } from '../../services/api';

interface CompliancePolicyProps {
  devices: NetworkDevice[];
  onRefreshDevices: () => void;
  onOpenDeviceDetail: (device: NetworkDevice) => void;
}

export const CompliancePolicy: React.FC<CompliancePolicyProps> = ({
  devices,
  onRefreshDevices,
  onOpenDeviceDetail
}) => {
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [remediatingRuleId, setRemediatingRuleId] = useState<string | null>(null);
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<Record<string, boolean>>({});
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Compute fleet-level compliance from all devices
  const fleetOverview: FleetComplianceOverview = useMemo(() => {
    let totalEvaluated = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;
    let totalCriticalGaps = 0;
    let totalHighGaps = 0;
    const grades: { A: number; B: number; C: number; D: number; F: number; } = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const paramMap = new Map<string, { count: number; severity: ComplianceSeverity; category: ComplianceCategory }>();

    devices.forEach(d => {
      const comp = d.compliance;
      if (!comp) return;

      totalEvaluated += comp.totalChecks ?? comp.totalRules ?? comp.rules.length;
      totalPassed += comp.passedChecks ?? comp.compliantCount ?? 0;
      totalFailed += comp.failedChecks ?? comp.nonCompliantCount ?? 0;
      totalWarnings += comp.warningChecks ?? comp.warningCount ?? 0;
      totalCriticalGaps += comp.criticalGaps ?? comp.criticalFails ?? 0;
      totalHighGaps += comp.highGaps ?? comp.highFails ?? 0;

      if (comp.grade in grades) {
        grades[comp.grade as 'A' | 'B' | 'C' | 'D' | 'F'] += 1;
      }

      comp.rules.forEach((r: ComplianceRule) => {
        if (r.status === 'non_compliant') {
          const existing = paramMap.get(r.parameter) || { count: 0, severity: r.severity, category: r.category };
          existing.count += 1;
          paramMap.set(r.parameter, existing);
        }
      });
    });

    const fleetScore = totalEvaluated > 0 ? Math.round((totalPassed / totalEvaluated) * 100) : 100;
    const topParams = Array.from(paramMap.entries())
      .map(([param, data]) => ({
        parameter: param,
        affectedCount: data.count,
        severity: data.severity,
        category: data.category
      }))
      .sort((a, b) => b.affectedCount - a.affectedCount)
      .slice(0, 6);

    return {
      fleetComplianceScore: fleetScore,
      totalDevicesAudited: devices.length,
      totalChecksEvaluated: totalEvaluated,
      totalPassed,
      totalFailed,
      totalWarnings,
      criticalGaps: totalCriticalGaps,
      highGaps: totalHighGaps,
      devicesByGrade: grades,
      topNonCompliantParameters: topParams,
      timestamp: new Date().toISOString()
    };
  }, [devices]);

  const handleRunFullAudit = async () => {
    setIsAuditing(true);
    setFeedbackMessage(null);
    try {
      const res = await nexusApi.auditCompliance();
      if (res && res.success) {
        setFeedbackMessage({
          text: `Auditoria de conformidade CIS executada com sucesso em ${devices.length} ativos. Score global: ${res.data?.fleetComplianceScore ?? fleetOverview.fleetComplianceScore}%.`,
          type: 'success'
        });
        onRefreshDevices();
      }
    } catch {
      setFeedbackMessage({
        text: 'Erro ao executar auditoria de conformidade com o daemon.',
        type: 'error'
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRemediate = async (deviceId: string, ruleId: string) => {
    setRemediatingRuleId(`${deviceId}:${ruleId}`);
    try {
      const res = await nexusApi.remediateComplianceRule(deviceId, ruleId);
      if (res && res.success) {
        setFeedbackMessage({
          text: `Parâmetro de configuração remediado com sucesso no nó (${res.rule?.parameter || ruleId}). Parâmetro em conformidade com o CIS Benchmark.`,
          type: 'success'
        });
        onRefreshDevices();
      }
    } catch {
      setFeedbackMessage({
        text: 'Falha ao aplicar remediação de conformidade.',
        type: 'error'
      });
    } finally {
      setRemediatingRuleId(null);
    }
  };

  const [isRemediatingAll, setIsRemediatingAll] = useState(false);

  const handleRemediateAll = async () => {
    setIsRemediatingAll(true);
    try {
      const res = await nexusApi.remediateAllCompliance();
      if (res && res.success) {
        setFeedbackMessage({
          text: `Todas as ${res.remediatedCount} melhorias e correções CIS foram executadas com sucesso em toda a frota!`,
          type: 'success'
        });
        onRefreshDevices();
      }
    } catch (e: any) {
      setFeedbackMessage({ text: e.message || 'Falha ao aplicar remediações.', type: 'error' });
    } finally {
      setIsRemediatingAll(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(text);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const toggleExpandDevice = (deviceId: string) => {
    setExpandedDeviceIds(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  // Filter devices and rules
  const filteredDevices = useMemo(() => {
    return devices.filter(dev => {
      // Query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = dev.hostname.toLowerCase().includes(q);
        const matchIp = dev.ipAddress.toLowerCase().includes(q);
        const matchStandard = (dev.compliance?.benchmarkName || '').toLowerCase().includes(q);
        const matchRule = dev.compliance?.rules.some((r: ComplianceRule) => 
          r.parameter.toLowerCase().includes(q) || 
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
        if (!matchName && !matchIp && !matchStandard && !matchRule) return false;
      }

      // Severity filter: check if device has at least one rule with that severity
      if (selectedSeverity !== 'all') {
        const hasSev = dev.compliance?.rules.some((r: ComplianceRule) => r.severity === selectedSeverity && r.status === 'non_compliant');
        if (!hasSev) return false;
      }

      // Status filter
      if (selectedStatus === 'non_compliant') {
        if ((dev.compliance?.failedChecks || 0) === 0) return false;
      } else if (selectedStatus === 'compliant') {
        if ((dev.compliance?.failedChecks || 0) > 0) return false;
      }

      return true;
    });
  }, [devices, searchQuery, selectedSeverity, selectedStatus]);

  const handleExportReport = () => {
    const reportData = {
      title: 'NEXUS LAN - Relatório de Conformidade & CIS Benchmarks',
      generatedAt: new Date().toISOString(),
      fleetOverview,
      devices: devices.map(d => ({
        id: d.id,
        hostname: d.hostname,
        ipAddress: d.ipAddress,
        deviceType: d.deviceType,
        benchmark: d.compliance?.benchmarkName,
        score: d.compliance?.complianceScore,
        grade: d.compliance?.grade,
        passedChecks: d.compliance?.passedChecks,
        failedChecks: d.compliance?.failedChecks,
        criticalGaps: d.compliance?.criticalGaps,
        rules: d.compliance?.rules.map((r: ComplianceRule) => ({
          id: r.id,
          parameter: r.parameter,
          status: r.status,
          severity: r.severity,
          currentValue: r.currentValue,
          expectedValue: r.expectedValue,
          cisSection: r.cisSection
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-cis-compliance-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Políticas de Conformidade & CIS Benchmarks
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              AUDIT ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Avaliação contínua de configurações de rede e sistemas operacionais contra os perfis <span className="text-slate-200 font-semibold">CIS (Center for Internet Security) Benchmarks</span>, NIST SP 800-53 e ISO 27001. Deteção de desvios em tempo real com sugestões de mitigação e scripts de remediação direta.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {fleetOverview.totalFailed > 0 && (
            <button
              onClick={handleRemediateAll}
              disabled={isRemediatingAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              title="Executar todas as melhorias e correções CIS pendentes na rede"
            >
              <Sparkles size={13} className={isRemediatingAll ? 'animate-spin' : ''} />
              <span>{isRemediatingAll ? 'A Corrigir...' : `Executar Todas as Correções CIS (${fleetOverview.totalFailed})`}</span>
            </button>
          )}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
            title="Descarregar relatório auditado em JSON"
          >
            <Download size={13} />
            <span>Exportar Relatório</span>
          </button>
          <button
            onClick={handleRunFullAudit}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={13} className={isAuditing ? 'animate-spin' : ''} />
            <span>{isAuditing ? 'Auditando Frota...' : 'Re-auditar Toda a Frota'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedbackMessage && (
        <div className={`p-3 rounded text-xs font-mono border flex items-center justify-between ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle2 size={15} className="text-emerald-400" /> : <XCircle size={15} className="text-rose-400" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fleet KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Fleet Compliance Score */}
        <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Conformidade Global da Frota
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-black border ${
              fleetOverview.fleetComplianceScore >= 85 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
              fleetOverview.fleetComplianceScore >= 70 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
              'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {fleetOverview.fleetComplianceScore >= 85 ? 'STATUS BOM' : fleetOverview.fleetComplianceScore >= 70 ? 'ATENÇÃO' : 'CRÍTICO'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-100">
              {fleetOverview.fleetComplianceScore}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({fleetOverview.totalPassed}/{fleetOverview.totalChecksEvaluated} verificações)
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-500 ${
                fleetOverview.fleetComplianceScore >= 85 ? 'bg-emerald-400' :
                fleetOverview.fleetComplianceScore >= 70 ? 'bg-amber-400' :
                'bg-rose-400'
              }`}
              style={{ width: `${fleetOverview.fleetComplianceScore}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Critical Gaps */}
        <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Gaps Críticos & Altos
            </span>
            <AlertTriangle size={16} className={fleetOverview.criticalGaps > 0 ? 'text-rose-400' : 'text-slate-500'} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              fleetOverview.criticalGaps > 0 ? 'text-rose-400' : 'text-slate-100'
            }`}>
              {fleetOverview.criticalGaps}
            </span>
            <span className="text-xs text-amber-400 font-mono">
              + {fleetOverview.highGaps} de alto risco
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 leading-snug">
            Requerem remediação prioritária para cumprir a linha base CIS Level 1.
          </div>
        </div>

        {/* Metric 3: Grade Distribution */}
        <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-800">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
            Distribuição de Notas CIS
          </span>
          <div className="grid grid-cols-5 gap-1.5 font-mono text-center">
            {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
              const count = fleetOverview.devicesByGrade[grade] || 0;
              const colorClass = 
                grade === 'A' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' :
                grade === 'B' ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' :
                grade === 'C' ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' :
                grade === 'D' ? 'bg-orange-950/60 border-orange-500/40 text-orange-300' :
                'bg-rose-950/60 border-rose-500/40 text-rose-300';

              return (
                <div key={grade} className={`p-1.5 rounded border ${colorClass}`}>
                  <div className="text-xs font-bold">{grade}</div>
                  <div className="text-sm font-black">{count}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 text-center font-mono">
            Classificação com base na conformidade total
          </div>
        </div>

        {/* Metric 4: Checks Summary */}
        <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-800">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
            Resultado das Verificações
          </span>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Conformes:
              </span>
              <span className="font-bold">{fleetOverview.totalPassed}</span>
            </div>
            <div className="flex justify-between items-center text-rose-400">
              <span className="flex items-center gap-1.5">
                <XCircle size={13} /> Não Conformes:
              </span>
              <span className="font-bold">{fleetOverview.totalFailed}</span>
            </div>
            <div className="flex justify-between items-center text-amber-400">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={13} /> Avisos / Revisão:
              </span>
              <span className="font-bold">{fleetOverview.totalWarnings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Fleet Non-Compliant Parameters Ranking */}
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Top Parâmetros Não Conformes na Infraestrutura
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Parâmetros mais frequentemente em violação nos equipamentos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fleetOverview.topNonCompliantParameters.map((item, idx) => (
            <div 
              key={item.parameter} 
              className="p-3 bg-slate-950/80 rounded border border-slate-800/90 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-slate-100">
                    {idx + 1}. {item.parameter}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    item.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    item.severity === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                  }`}>
                    {item.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Categoria: {item.category}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Equipamentos Afetados:</span>
                <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                  {item.affectedCount} dispositivo(s)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por nó, IP, parâmetro ou benchmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">Todos os Estados</option>
              <option value="non_compliant">Com Violações</option>
              <option value="compliant">100% Conformes</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase hidden sm:inline">Gravidade:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">Todas as Gravidades</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 shrink-0">
          Mostrando <span className="text-slate-100 font-bold">{filteredDevices.length}</span> de {devices.length} equipamentos
        </div>
      </div>

      {/* Equipment Compliance Matrix & Detailed Breakdown */}
      <div className="space-y-4">
        {filteredDevices.map(dev => {
          const comp = dev.compliance;
          const isExpanded = !!expandedDeviceIds[dev.id];
          const nonCompliantRules = comp?.rules.filter((r: ComplianceRule) => r.status === 'non_compliant') || [];
          const compliantRules = comp?.rules.filter((r: ComplianceRule) => r.status === 'compliant') || [];

          return (
            <div 
              key={dev.id} 
              className="bg-slate-900/90 rounded-lg border border-slate-800 overflow-hidden"
            >
              {/* Device Summary Row */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40">
                <div className="flex items-start md:items-center gap-3">
                  <button
                    onClick={() => toggleExpandDevice(dev.id)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 mt-0.5 md:mt-0 transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-100 font-mono">
                        {dev.hostname}
                      </span>
                      <span className="text-xs font-mono text-cyan-400">
                        ({dev.ipAddress})
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                        {dev.deviceType}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                      <span className="text-slate-300 font-semibold">{comp?.benchmarkName || 'CIS Benchmark Padrão'}</span>
                      <span>·</span>
                      <span>{comp?.passedChecks || 0}/{comp?.totalChecks || 0} Regras Cumpridas</span>
                    </div>
                  </div>
                </div>

                {/* Right side stats & action buttons */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                  {/* Score & Grade Badge */}
                  <div className="flex items-center gap-2">
                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-400 text-[10px] uppercase">SCORE CIS</div>
                      <div className="text-sm font-black text-slate-100">{comp?.complianceScore || 0}%</div>
                    </div>

                    <div className={`w-9 h-9 rounded flex items-center justify-center font-black text-base font-mono border ${
                      comp?.grade === 'A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      comp?.grade === 'B' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                      comp?.grade === 'C' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      comp?.grade === 'D' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {comp?.grade || 'F'}
                    </div>
                  </div>

                  {/* Non-compliant tag */}
                  {(comp?.failedChecks || 0) > 0 ? (
                    <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      {comp?.failedChecks} Não Conforme{comp?.failedChecks !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={13} /> 100% Conforme
                    </span>
                  )}

                  {/* Open Modal Inspect Button */}
                  <button
                    onClick={() => onOpenDeviceDetail(dev)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono font-medium transition-colors border border-slate-700"
                    title="Inspecionar no modal detalhado de ativos"
                  >
                    <span>Inspecionar</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              {/* Collapsible Rules Details */}
              {isExpanded && comp && (
                <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
                      Parâmetros Avaliados sob {comp.benchmarkName || 'CIS Benchmark'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Última auditoria: {(comp.lastAudited || comp.lastAuditDate || '').replace('T', ' ').slice(0, 19)}
                    </span>
                  </div>

                  {/* List of rules */}
                  <div className="space-y-3">
                    {comp.rules.map((rule: ComplianceRule) => {
                      const isNonCompliant = rule.status === 'non_compliant';
                      const isRemediating = remediatingRuleId === `${dev.id}:${rule.id}`;

                      return (
                        <div 
                          key={rule.id}
                          className={`p-3.5 rounded border text-xs font-mono transition-all ${
                            isNonCompliant 
                              ? 'bg-slate-950/80 border-rose-500/40 hover:border-rose-500/60' 
                              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Rule Title & Status Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-100 text-sm">
                                {rule.title}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {rule.id}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] text-cyan-400 bg-cyan-950/50 border border-cyan-800">
                                Sec {rule.cisSection}
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                ({rule.category})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                rule.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                rule.severity === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                              }`}>
                                {rule.severity}
                              </span>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                                isNonCompliant 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' 
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              }`}>
                                {isNonCompliant ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                                {isNonCompliant ? 'NÃO CONFORME' : 'CONFORME'}
                              </span>
                            </div>
                          </div>

                          {/* Side-by-side Configuration Parameter Diff */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2.5">
                            {/* Current Value Box */}
                            <div className={`p-2.5 rounded border ${
                              isNonCompliant 
                                ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' 
                                : 'bg-slate-900 border-slate-800 text-slate-200'
                            }`}>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Parâmetro & Valor Observado:
                              </span>
                              <div className="font-bold text-xs break-all">
                                {rule.parameter}: <span className={isNonCompliant ? 'text-rose-400 underline font-bold' : 'text-emerald-400'}>{rule.currentValue}</span>
                              </div>
                            </div>

                            {/* Expected CIS Value Box */}
                            <div className="p-2.5 rounded border bg-emerald-950/20 border-emerald-500/30 text-emerald-200">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Recomendação CIS Benchmark:
                              </span>
                              <div className="font-bold text-xs break-all text-emerald-300">
                                {rule.parameter}: <span className="underline">{rule.expectedValue}</span>
                              </div>
                            </div>
                          </div>

                          {/* Rationale & Security Risk */}
                          <div className="text-[11px] text-slate-300 leading-relaxed font-sans mb-2">
                            <span className="font-semibold text-slate-200">Justificação de Segurança:</span> {rule.rationale}
                          </div>

                          {/* Operational Impact if non-compliant */}
                          {rule.impactDescription && isNonCompliant && (
                            <div className="text-[11px] text-amber-300/90 leading-relaxed font-sans mb-2 bg-amber-950/20 p-2 rounded border border-amber-800/40">
                              <span className="font-semibold text-amber-200">Impacto Operacional da Correção:</span> {rule.impactDescription}
                            </div>
                          )}

                          {/* Audit Command Box */}
                          {rule.auditCommand && (
                            <div className="mt-2 p-2 bg-slate-900/90 rounded border border-slate-800 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate">
                                <Terminal size={12} className="text-cyan-400 shrink-0" />
                                <span className="text-slate-500 shrink-0">Auditoria:</span>
                                <code className="text-slate-200 truncate">{rule.auditCommand}</code>
                              </div>
                              <button
                                onClick={() => handleCopy(rule.auditCommand!)}
                                className="text-slate-400 hover:text-slate-200 p-1 shrink-0 transition-colors"
                                title="Copiar comando de auditoria"
                              >
                                {copiedCommand === rule.auditCommand ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                          )}

                          {/* Remediation Command & Action Button */}
                          {rule.remediationCommand && (
                            <div className="mt-2 p-2 bg-slate-900/90 rounded border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate">
                                <Wrench size={12} className="text-amber-400 shrink-0" />
                                <span className="text-slate-500 shrink-0">Remediação:</span>
                                <code className="text-amber-300 truncate">{rule.remediationCommand}</code>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                <button
                                  onClick={() => handleCopy(rule.remediationCommand!)}
                                  className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
                                  title="Copiar comando de remediação"
                                >
                                  {copiedCommand === rule.remediationCommand ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>

                                {isNonCompliant && (
                                  <button
                                    onClick={() => handleRemediate(dev.id, rule.id)}
                                    disabled={isRemediating}
                                    className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <Wrench size={11} className={isRemediating ? 'animate-spin' : ''} />
                                    <span>{isRemediating ? 'Aplicando...' : 'Corrigir Parâmetro'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
