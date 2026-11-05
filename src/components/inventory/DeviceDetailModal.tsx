import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Activity, 
  Network, 
  Shield, 
  ShieldAlert,
  ShieldCheck,
  Clock, 
  Cpu, 
  Tag, 
  Edit3, 
  Check, 
  Play, 
  Radio, 
  Wifi, 
  Layers,
  Info,
  Copy,
  ExternalLink,
  RefreshCw,
  Wrench,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { NetworkDevice, ComplianceRule } from '../../types/network';
import { Modal } from '../common/Modal';
import { DeviceStatusBadge } from '../common/StatusBadge';
import { nexusApi } from '../../services/api';

interface DeviceDetailModalProps {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onDeviceUpdated: (updated: NetworkDevice) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  isOpen,
  onClose,
  onDeviceUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'compliance' | 'ports' | 'ping' | 'notes'>('overview');
  const [isPinging, setIsPinging] = useState(false);
  const [pingOutput, setPingOutput] = useState<string[]>([]);
  const [notes, setNotes] = useState(device?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isCveLookingUp, setIsCveLookingUp] = useState(false);
  const [copiedCpe, setCopiedCpe] = useState(false);
  const [isAuditingCompliance, setIsAuditingCompliance] = useState(false);
  const [remediatingRuleId, setRemediatingRuleId] = useState<string | null>(null);
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'non_compliant' | 'compliant'>('all');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [complianceMsg, setComplianceMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!device) return null;

  const handleRunPing = async () => {
    setIsPinging(true);
    setPingOutput([`Executing ICMP echo probe on ${device.ipAddress}...`]);
    try {
      const res = await nexusApi.triggerPing(device.ipAddress);
      setPingOutput(res.output);
    } catch {
      setPingOutput(['Failed to execute ICMP ping probe']);
    } finally {
      setIsPinging(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await nexusApi.updateDevice(device.id, { notes });
      onDeviceUpdated(res.data);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleAuthorized = async () => {
    const updated = await nexusApi.updateDevice(device.id, { isAuthorized: !device.isAuthorized });
    onDeviceUpdated(updated.data);
  };

  const handleRunNistLookup = async () => {
    setIsCveLookingUp(true);
    try {
      const res = await nexusApi.automatedCveLookup(device.id);
      if (res && res.data) {
        const updated = res.data.find(d => d.id === device.id);
        if (updated) onDeviceUpdated(updated);
      }
    } finally {
      setIsCveLookingUp(false);
    }
  };

  const handleCopyCpe = (cpe: string) => {
    navigator.clipboard.writeText(cpe);
    setCopiedCpe(true);
    setTimeout(() => setCopiedCpe(false), 2000);
  };

  const handleAuditCompliance = async () => {
    setIsAuditingCompliance(true);
    setComplianceMsg(null);
    try {
      const res = await nexusApi.auditCompliance(device.id);
      if (res && res.devices) {
        const updated = res.devices.find(d => d.id === device.id);
        if (updated) onDeviceUpdated(updated);
      }
      setComplianceMsg({ text: 'Auditoria de conformidade CIS concluída.', type: 'success' });
    } catch {
      setComplianceMsg({ text: 'Falha ao executar auditoria CIS.', type: 'error' });
    } finally {
      setIsAuditingCompliance(false);
    }
  };

  const handleRemediateRule = async (ruleId: string) => {
    setRemediatingRuleId(ruleId);
    try {
      const res = await nexusApi.remediateComplianceRule(device.id, ruleId);
      if (res && res.device) {
        onDeviceUpdated(res.device);
        setComplianceMsg({ 
          text: `Parâmetro '${res.rule?.parameter || ruleId}' remediado com sucesso! Parâmetro agora em conformidade CIS.`, 
          type: 'success' 
        });
      }
    } catch {
      setComplianceMsg({ text: 'Falha ao aplicar remediação no parâmetro.', type: 'error' });
    } finally {
      setRemediatingRuleId(null);
    }
  };

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={device.hostname}
      subtitle={`${device.ipAddress} · ${device.macAddress} · ${device.manufacturer}`}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Quick Header Bar */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 gap-3">
          <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">STATE:</span>
              <DeviceStatusBadge status={device.status} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">RTT:</span>
              <span className="text-slate-200 tabular-nums">{device.latencyMs} ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">LOSS:</span>
              <span className={device.packetLossPercent > 0 ? 'text-rose-400 tabular-nums' : 'text-emerald-400 tabular-nums'}>
                {device.packetLossPercent}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">VLAN:</span>
              <span className="text-cyan-400 font-semibold">{device.vlan}</span>
            </div>

            {/* NIST CVSS Badge */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">NIST:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
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
                CVSS {device.nistRiskScore !== undefined ? device.nistRiskScore.toFixed(1) : '0.0'} ({device.nistRiskLevel || 'SAFE'})
              </span>
            </div>

            {/* CIS Benchmark Score Badge */}
            {device.compliance && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">CIS:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  device.compliance.grade === 'A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  device.compliance.grade === 'B' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                  device.compliance.grade === 'C' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  Nota {device.compliance.grade} ({device.compliance.complianceScore}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunNistLookup}
              disabled={isCveLookingUp}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors disabled:opacity-50"
              title="Executar cross-reference com feed NIST NVD"
            >
              <RefreshCw size={12} className={isCveLookingUp ? 'animate-spin' : ''} />
              <span>{isCveLookingUp ? 'Consultando NIST...' : 'Lookup NIST'}</span>
            </button>
            <button
              onClick={handleToggleAuthorized}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                device.isAuthorized
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              {device.isAuthorized ? 'Authorized Device' : 'Mark as Authorized'}
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 font-medium rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={13} className={device.vulnerabilities && device.vulnerabilities.length > 0 ? 'text-rose-400' : 'text-slate-400'} />
            <span>Firmware e CVEs ({device.vulnerabilities?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3 py-1.5 font-medium rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={13} className={(device.compliance?.failedChecks || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'} />
            <span>CIS & Conformidade ({device.compliance?.failedChecks || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('ports')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'ports'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Portas Abertas ({device.openPorts.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('ping');
              if (pingOutput.length === 0) handleRunPing();
            }}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'ping'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ICMP Probe Utility
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'notes'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Operator Notes & Tags
          </button>
        </div>

        {/* Tab Content 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-950/60 rounded border border-slate-800/80 space-y-2.5">
              <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold mb-2">
                Network & Physical Layer
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IP Address:</span>
                <span className="text-slate-200 font-semibold">{device.ipAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">MAC Address:</span>
                <span className="text-slate-200">{device.macAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">OUI Manufacturer:</span>
                <span className="text-slate-200 font-sans">{device.manufacturer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Subnet Scope:</span>
                <span className="text-slate-200">{device.subnet}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Connected Switch Port:</span>
                <span className="text-cyan-400">{device.switchPort || 'Direct Uplink'}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded border border-slate-800/80 space-y-2.5">
              <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold mb-2">
                Device Classification
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Device Type:</span>
                <span className="text-slate-200 font-sans font-medium">{device.deviceType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Operating System:</span>
                <span className="text-slate-200 font-sans truncate max-w-[200px]" title={device.operatingSystem}>
                  {device.operatingSystem}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">SNMP Agent:</span>
                <span className={device.snmpEnabled ? 'text-emerald-400' : 'text-slate-400'}>
                  {device.snmpEnabled ? 'Active (v2c/v3)' : 'Disabled / Timeout'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Last Seen Active:</span>
                <span className="text-slate-200">{device.lastSeen}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Est. Continuous Uptime:</span>
                <span className="text-slate-200 font-sans">
                  {device.uptimeSeconds > 0 
                    ? `${(device.uptimeSeconds / 86400).toFixed(0)} days (${(device.uptimeSeconds / 3600).toFixed(0)} hrs)` 
                    : 'Offline'}
                </span>
              </div>
            </div>

            {device.snmpSysDescr && (
              <div className="col-span-full p-3.5 bg-slate-950/80 rounded border border-slate-800 text-xs">
                <span className="text-slate-400 uppercase font-mono text-[10px] block mb-1">SNMP sysDescr:</span>
                <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                  {device.snmpSysDescr}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Security & Firmware */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {/* Top Posture & NIST Scorecard */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
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
                    SCORE CVSS {device.nistRiskScore !== undefined ? device.nistRiskScore.toFixed(1) : '0.0'} / 10.0 · {device.nistRiskLevel || 'SAFE'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({device.vulnerabilities?.length || 0} CVEs ativas)
                  </span>
                </div>

                <button
                  onClick={handleRunNistLookup}
                  disabled={isCveLookingUp}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-slate-100 rounded transition-colors disabled:opacity-50"
                  title="Cross-reference em tempo real com bases NIST NVD"
                >
                  <RefreshCw size={12} className={isCveLookingUp ? 'animate-spin' : ''} />
                  <span>{isCveLookingUp ? 'Consultando NIST NVD...' : 'Automated NIST CVE Lookup'}</span>
                </button>
              </div>

              {/* CPE 2.3 Identifier */}
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">NIST CPE 2.3:</span>
                  <span className="text-cyan-300 text-[11px] truncate">
                    {device.cpeMatch || 'cpe:2.3:h:generic:network_device:*:*:*:*:*:*:*'}
                  </span>
                </div>
                {device.cpeMatch && (
                  <button
                    onClick={() => handleCopyCpe(device.cpeMatch!)}
                    className="text-slate-400 hover:text-slate-200 p-1 shrink-0 ml-2"
                    title="Copiar CPE 2.3"
                  >
                    {copiedCpe ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">FIRMWARE ATUAL:</span>
                <span className="text-slate-100 font-semibold">{device.firmwareVersion || device.operatingSystem || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">VERSÃO RECENTE RECOMENDADA:</span>
                <span className="text-cyan-400 font-semibold">{device.latestFirmwareVersion || 'Atualizado'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ESTADO DA ATUALIZAÇÃO:</span>
                <span className={
                  device.firmwareUpdateStatus === 'up_to_date' ? 'text-emerald-400 font-semibold' :
                  device.firmwareUpdateStatus === 'critical_update' ? 'text-rose-400 font-semibold' :
                  'text-amber-400 font-semibold'
                }>
                  {device.firmwareUpdateStatus === 'up_to_date' ? 'Em Dia' :
                   device.firmwareUpdateStatus === 'critical_update' ? 'Crítico (Update Necessário)' :
                   'Atualização Disponível'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                <span>Vulnerabilidades Detetadas ({device.vulnerabilities?.length || 0})</span>
                <span className="text-[11px] font-mono text-slate-400">Verificação contra NIST NVD / MITRE</span>
              </h4>

              {(!device.vulnerabilities || device.vulnerabilities.length === 0) ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded border border-slate-800">
                  <Check size={20} className="mx-auto mb-1 text-emerald-400" />
                  <p className="font-medium text-slate-200">Sem vulnerabilidades conhecidas ativas.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">O equipamento cumpre as diretrizes de segurança de rede (Score CVSS 0.0 · SAFE).</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {device.vulnerabilities.map(cve => (
                    <div key={cve.cveId} className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400 text-sm">{cve.cveId}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cve.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            cve.severity === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {cve.severity} · CVSS {cve.score}
                          </span>
                        </div>
                        <a 
                          href={cve.nistUrl || cve.advisoryUrl || `https://nvd.nist.gov/vuln/detail/${cve.cveId}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono hover:underline"
                        >
                          <span>Ficha NIST NVD</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      <p className="font-medium text-slate-200">{cve.title}</p>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{cve.description}</p>

                      {/* Technical CVSS Vector & Attack Vector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-900/90 rounded border border-slate-800/70 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase">Vetor de Ataque:</span>
                          <span className="text-slate-200">{cve.attackVector || 'Network'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase">Versões Afetadas:</span>
                          <span className="text-amber-300">{cve.affectedVersions}</span>
                        </div>
                        {cve.cvssVector && (
                          <div className="col-span-full">
                            <span className="text-slate-400 text-[10px] block uppercase">Vetor CVSS v3.1:</span>
                            <span className="text-cyan-300 break-all">{cve.cvssVector}</span>
                          </div>
                        )}
                      </div>

                      {cve.mitigationNotes && (
                        <div className="p-2 bg-slate-900/80 rounded text-[11px] text-cyan-300 font-sans border border-slate-800/80">
                          <strong>Mitigação Recomendada:</strong> {cve.mitigationNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: CIS Benchmarks & Compliance */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            {/* Feedback notification toast */}
            {complianceMsg && (
              <div className={`p-3 rounded text-xs font-mono border flex items-center justify-between ${
                complianceMsg.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {complianceMsg.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-rose-400" />}
                  <span>{complianceMsg.text}</span>
                </div>
                <button 
                  onClick={() => setComplianceMsg(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Compliance Scorecard Card */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded flex items-center justify-center font-black text-xl font-mono border ${
                    device.compliance?.grade === 'A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    device.compliance?.grade === 'B' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                    device.compliance?.grade === 'C' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {device.compliance?.grade || 'N/A'}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>{device.compliance?.benchmarkName || 'CIS Benchmark Padrão'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800">
                        {device.compliance?.standard || 'CIS_LEVEL_1'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-3">
                      <span>Score: <strong className="text-slate-100">{device.compliance?.complianceScore || 0}%</strong></span>
                      <span>·</span>
                      <span className="text-emerald-400">{device.compliance?.passedChecks || 0} Conformes</span>
                      <span>·</span>
                      <span className="text-rose-400">{device.compliance?.failedChecks || 0} Não Conformes</span>
                      <span>·</span>
                      <span className="text-slate-500">Última auditoria: {device.compliance?.lastAudited ? device.compliance.lastAudited.replace('T', ' ').slice(0, 19) : 'Agora'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAuditCompliance}
                  disabled={isAuditingCompliance}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-xs font-bold font-mono transition-colors disabled:opacity-50 shrink-0 self-end sm:self-auto"
                >
                  <RefreshCw size={12} className={isAuditingCompliance ? 'animate-spin' : ''} />
                  <span>{isAuditingCompliance ? 'Auditando...' : 'Re-auditar Ativo'}</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-3.5 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800/80">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (device.compliance?.complianceScore || 0) >= 85 ? 'bg-emerald-400' :
                    (device.compliance?.complianceScore || 0) >= 70 ? 'bg-amber-400' :
                    'bg-rose-400'
                  }`}
                  style={{ width: `${device.compliance?.complianceScore || 0}%` }}
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between text-xs font-mono flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setComplianceFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    complianceFilter === 'all' 
                      ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todas ({device.compliance?.rules.length || 0})
                </button>
                <button
                  onClick={() => setComplianceFilter('non_compliant')}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                    complianceFilter === 'non_compliant' 
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40' 
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <XCircle size={11} />
                  <span>Não Conformes ({device.compliance?.failedChecks || 0})</span>
                </button>
                <button
                  onClick={() => setComplianceFilter('compliant')}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                    complianceFilter === 'compliant' 
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' 
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <CheckCircle2 size={11} />
                  <span>Conformes ({device.compliance?.passedChecks || 0})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Norma: <span className="text-slate-200 font-semibold">CIS Level 1 & Level 2 Controls</span>
              </div>
            </div>

            {/* Rules List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(!device.compliance?.rules || device.compliance.rules.length === 0) ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded border border-slate-800">
                  Nenhuma regra de conformidade avaliada para este tipo de ativo.
                </div>
              ) : (
                device.compliance.rules
                  .filter((r: ComplianceRule) => {
                    if (complianceFilter === 'non_compliant') return r.status === 'non_compliant';
                    if (complianceFilter === 'compliant') return r.status === 'compliant';
                    return true;
                  })
                  .map((rule: ComplianceRule) => {
                    const isNonCompliant = rule.status === 'non_compliant';
                    const isRemediating = remediatingRuleId === rule.id;

                    return (
                      <div 
                        key={rule.id}
                        className={`p-3 bg-slate-950 rounded border space-y-2 text-xs font-mono transition-all ${
                          isNonCompliant 
                            ? 'border-rose-500/40 hover:border-rose-500/60' 
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Rule Title & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-100 text-sm">
                              {rule.title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-900/90 rounded border border-slate-800/80">
                          {/* Left: Current observed value */}
                          <div className={`p-2 rounded border ${
                            isNonCompliant ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-slate-950/60 border-slate-800 text-slate-300'
                          }`}>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              Parâmetro & Valor Observado:
                            </span>
                            <div className="font-bold text-xs break-all">
                              {rule.parameter}: <span className={isNonCompliant ? 'text-rose-400 underline' : 'text-emerald-400'}>{rule.currentValue}</span>
                            </div>
                          </div>

                          {/* Right: Expected CIS recommendation */}
                          <div className="p-2 rounded border bg-emerald-950/30 border-emerald-500/40 text-emerald-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              Recomendação CIS Benchmark:
                            </span>
                            <div className="font-bold text-xs break-all text-emerald-300">
                              {rule.parameter}: <span className="underline">{rule.expectedValue}</span>
                            </div>
                          </div>
                        </div>

                        {/* Rationale & Security Risk */}
                        <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          <span className="font-semibold text-slate-200">Justificação de Segurança:</span> {rule.rationale}
                        </div>

                        {/* Operational Impact if non-compliant */}
                        {rule.impactDescription && isNonCompliant && (
                          <div className="text-[11px] text-amber-300/90 leading-relaxed font-sans bg-amber-950/20 p-2 rounded border border-amber-800/40">
                            <span className="font-semibold text-amber-200">Impacto Operacional da Correção:</span> {rule.impactDescription}
                          </div>
                        )}

                        {/* Audit Command Box */}
                        {rule.auditCommand && (
                          <div className="p-2 bg-slate-900/90 rounded border border-slate-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate">
                              <Terminal size={12} className="text-cyan-400 shrink-0" />
                              <span className="text-slate-500 shrink-0">Comando Auditoria:</span>
                              <code className="text-slate-200 truncate">{rule.auditCommand}</code>
                            </div>
                            <button
                              onClick={() => handleCopyCmd(rule.auditCommand!)}
                              className="text-slate-400 hover:text-slate-200 p-1 shrink-0 transition-colors"
                              title="Copiar comando de auditoria"
                            >
                              {copiedCmd === rule.auditCommand ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}

                        {/* Remediation Command & Action Button */}
                        {rule.remediationCommand && (
                          <div className="p-2 bg-slate-900/90 rounded border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate">
                              <Wrench size={12} className="text-amber-400 shrink-0" />
                              <span className="text-slate-500 shrink-0">Remediação:</span>
                              <code className="text-amber-300 truncate">{rule.remediationCommand}</code>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                              <button
                                onClick={() => handleCopyCmd(rule.remediationCommand!)}
                                className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
                                title="Copiar comando de remediação"
                              >
                                {copiedCmd === rule.remediationCommand ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>

                              {isNonCompliant && (
                                <button
                                  onClick={() => handleRemediateRule(rule.id)}
                                  disabled={isRemediating}
                                  className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Wrench size={11} className={isRemediating ? 'animate-spin' : ''} />
                                  <span>{isRemediating ? 'Corrigindo...' : 'Corrigir Parâmetro'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: Open Ports */}
        {activeTab === 'ports' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Services identified via TCP SYN / service banner probe against {device.ipAddress}:
            </p>

            {device.openPorts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded border border-slate-800">
                No open TCP ports detected during last scan (or host is offline/firewalled).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {device.openPorts.map(port => {
                  const portInfo: Record<number, { name: string; desc: string }> = {
                    22: { name: 'SSH', desc: 'Secure Shell Remote Login' },
                    53: { name: 'DNS', desc: 'Domain Name System Server' },
                    80: { name: 'HTTP', desc: 'World Wide Web Server' },
                    88: { name: 'Kerberos', desc: 'Active Directory Authentication' },
                    135: { name: 'MSRPC', desc: 'Microsoft RPC Endpoint Mapper' },
                    139: { name: 'NetBIOS', desc: 'NetBIOS Session Service' },
                    161: { name: 'SNMP', desc: 'Simple Network Management Protocol' },
                    389: { name: 'LDAP', desc: 'Lightweight Directory Access Protocol' },
                    443: { name: 'HTTPS', desc: 'HTTP over TLS/SSL' },
                    445: { name: 'SMB', desc: 'Microsoft SMB / CIFS File Sharing' },
                    631: { name: 'IPP', desc: 'Internet Printing Protocol' },
                    636: { name: 'LDAPS', desc: 'LDAP over TLS/SSL' },
                    2049: { name: 'NFS', desc: 'Network File System Protocol' },
                    3389: { name: 'RDP', desc: 'Remote Desktop Protocol' },
                    5000: { name: 'UPnP / Flask', desc: 'Synology Web / Flask REST' },
                    5001: { name: 'HTTPS Mgmt', desc: 'Synology DSM Secure Web' },
                    8006: { name: 'Proxmox VE', desc: 'Proxmox Cluster Management Console' },
                    8080: { name: 'HTTP-Alt', desc: 'Alternative Web / Proxy' },
                    9100: { name: 'Raw Print / Exporter', desc: 'HP JetDirect / Prometheus Exporter' },
                    10250: { name: 'Kubelet', desc: 'Kubernetes Node Agent API' }
                  };
                  const info = portInfo[port] || { name: 'TCP Service', desc: 'Custom application port' };

                  return (
                    <div key={port} className="p-3 bg-slate-950/60 rounded border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="font-bold text-cyan-400">PORT {port}</span>
                        <span className="text-emerald-400 text-[10px]">OPEN</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200">{info.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{info.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Ping Probe Utility */}
        {activeTab === 'ping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Execute low-latency ICMP echo probe from collector node ({device.ipAddress}):
              </span>
              <button
                onClick={handleRunPing}
                disabled={isPinging}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors disabled:opacity-50"
              >
                <Play size={13} />
                <span>{isPinging ? 'Pinging...' : 'Repeat Ping'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs text-slate-300 space-y-1">
              {pingOutput.map((line, i) => (
                <div key={i} className={line.includes('loss') || line.includes('Unreachable') ? 'text-amber-400' : ''}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: Notes & Tags */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {device.tags.map(tag => (
                  <span key={tag} className="text-xs font-mono text-slate-300 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Internal Engineering Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Physical location, rack position, switch port drop number, service dependencies..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors disabled:opacity-50"
              >
                <Check size={14} />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
