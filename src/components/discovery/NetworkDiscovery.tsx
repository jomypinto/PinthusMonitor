import React, { useState } from 'react';
import { 
  Radar, 
  Play, 
  Square, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Server, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Layers,
  ArrowRight,
  ExternalLink,
  Trash2,
  HelpCircle,
  Network
} from 'lucide-react';
import { SubnetScanRange, DiscoveryScanJob, NetworkDevice } from '../../types/network';
import { StartScanPayload } from '../../types/api';
import { nexusApi } from '../../services/api';
import { DeviceStatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';

interface NetworkDiscoveryProps {
  subnets: SubnetScanRange[];
  devices: NetworkDevice[];
  onRefreshSubnets: () => void;
  onRefreshDevices: () => void;
  onOpenDeviceDetail: (device: NetworkDevice) => void;
}

export const NetworkDiscovery: React.FC<NetworkDiscoveryProps> = ({
  subnets,
  devices,
  onRefreshSubnets,
  onRefreshDevices,
  onOpenDeviceDetail
}) => {
  const [selectedSubnetId, setSelectedSubnetId] = useState<string>(subnets[0]?.id || '');
  const [probeType, setProbeType] = useState<'ARP+ICMP' | 'SYN_SCAN' | 'ICMP_ONLY'>('ICMP_ONLY');
  const [rateLimitPps, setRateLimitPps] = useState<number>(150);
  const [scanScope, setScanScope] = useState<'fast' | 'full'>('full');
  const [scanJob, setScanJob] = useState<DiscoveryScanJob | null>(nexusApi.getActiveScanJob());
  const [isAddSubnetModalOpen, setIsAddSubnetModalOpen] = useState<boolean>(false);

  // New subnet form state (pre-filled with user's target 192.168.20.0/24)
  const [newSubnetName, setNewSubnetName] = useState('Sub-rede VLAN 20');
  const [newSubnetCidr, setNewSubnetCidr] = useState('192.168.20.0/24');
  const [newSubnetVlan, setNewSubnetVlan] = useState(20);
  const [newSubnetDesc, setNewSubnetDesc] = useState('Segmento de rede 192.168.20.0/24 para monitorização de ativos');
  const [newSubnetIsAuthorized, setNewSubnetIsAuthorized] = useState(true);

  const selectedSubnet = subnets.find(s => s.id === selectedSubnetId) || subnets[0];

  const handleStartScan = () => {
    if (!selectedSubnet) return;

    if (!selectedSubnet.isAuthorized) {
      alert('Bloqueio de segurança: Esta sub-rede não está marcada como autorizada.');
      return;
    }

    const payload: StartScanPayload = {
      cidr: selectedSubnet.cidr,
      probeType,
      rateLimitPps,
      timeoutMs: 1500,
      scanScope
    };

    const initialJob = nexusApi.startDiscoveryScan(
      payload,
      (job) => {
        setScanJob({ ...job });
      },
      (completedJob) => {
        setScanJob({ ...completedJob });
        onRefreshDevices();
        onRefreshSubnets();
      }
    );

    setScanJob(initialJob);
  };

  const handleStopScan = () => {
    nexusApi.stopDiscoveryScan();
    setScanJob(prev => prev ? { ...prev, status: 'cancelled' } : null);
  };

  const handleCreateSubnet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubnetCidr.includes('/')) {
      alert('Por favor introduza uma notação CIDR válida (ex: 192.168.20.0/24)');
      return;
    }

    const newRange: SubnetScanRange = {
      id: `sub-${Date.now()}`,
      name: newSubnetName || `VLAN ${newSubnetVlan}`,
      cidr: newSubnetCidr.trim(),
      vlan: Number(newSubnetVlan),
      description: newSubnetDesc || 'Segmento de rede configurado pelo utilizador',
      isAuthorized: newSubnetIsAuthorized,
      probeType,
      rateLimitPps,
      enabled: true,
      lastScanned: undefined
    };

    await nexusApi.saveSubnetRange(newRange);
    onRefreshSubnets();
    setSelectedSubnetId(newRange.id);
    setIsAddSubnetModalOpen(false);
  };

  const handleDeleteSubnet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja remover esta sub-rede da lista de monitorização?')) {
      await nexusApi.deleteSubnetRange(id);
      onRefreshSubnets();
    }
  };

  const scanProgressPercent = scanJob && scanJob.totalIps > 0 
    ? Math.min(100, Math.round((scanJob.probedIps / scanJob.totalIps) * 100)) 
    : 0;

  // Filter devices belonging to currently selected subnet
  const subnetDevices = devices.filter(d => d.subnet === selectedSubnet?.cidr);

  // Check if 192.168.20.0/24 is selected or present
  const isVlan20Selected = selectedSubnet?.cidr.includes('192.168.20.');
  const hasVlan20 = subnets.some(s => s.cidr.includes('192.168.20.'));

  return (
    <div className="space-y-6">
      {/* Header Banner com Políticas de Segurança e Status do Coletor */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              <ShieldCheck size={16} />
              <span>Motor de Deteção e Sondagem de Rede Ativa</span>
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              Varredura de Sub-redes Autorizadas e Coletor de Ativos
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              O motor de descoberta executa varreduras no servidor Linux local utilizando sondagens ICMP Echo paralelas e pedidos ARP. 
              Os dispositivos que responderem são identificados, analisados por portas abertas (22, 53, 80, 443, 445) e adicionados automaticamente ao <strong>Inventário de Ativos</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!hasVlan20 && (
              <button
                onClick={() => {
                  setNewSubnetName('Sub-rede 192.168.20.0/24 (VLAN 20)');
                  setNewSubnetCidr('192.168.20.0/24');
                  setNewSubnetVlan(20);
                  setNewSubnetDesc('Sub-rede 192.168.20.0/24 adicionada para identificação de ativos');
                  setIsAddSubnetModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md transition-colors"
              >
                <Plus size={15} />
                <span>Adicionar 192.168.20.0/24</span>
              </button>
            )}
            <button
              onClick={() => setIsAddSubnetModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
            >
              <Plus size={15} />
              <span>Adicionar Sub-rede</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guia Rápido de Identificação da Subnet 192.168.20.0/24 */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
            <Network size={18} />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100">
                Como identificar dispositivos na sub-rede 192.168.20.0/24 a partir deste servidor:
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                Guia Operacional
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>1. Roteamento L3:</strong> O servidor NEXUS encontra-se no IP <code className="text-cyan-300 font-mono">192.168.0.13</code>. Para alcançar a subnet <code className="text-cyan-300 font-mono">192.168.20.0/24</code>, o router/gateway (ex: 192.168.0.1) deve possuir rota ativa entre as duas sub-redes (Inter-VLAN routing) e permitir tráfego ICMP echo.<br />
              <strong>2. Técnica de Sondagem:</strong> Como o <em>protocolo ARP não atravessa routers</em>, utilize o modo <strong className="text-cyan-300">"ICMP Echo Sweep"</strong> ou <strong className="text-cyan-300">"TCP SYN"</strong>.<br />
              <strong>3. Execução:</strong> Selecione <code className="text-cyan-300 font-mono">192.168.20.0/24</code> no painel à esquerda, selecione o escopo desejado (Gama Completa ou Prioritária) e clique em <strong className="text-emerald-400">"Executar Varredura Real"</strong>. Todos os equipamentos que responderem aparecem instantaneamente no Inventário de Ativos.
            </p>
          </div>
        </div>
      </div>

      {/* Layout de Duas Colunas: Catálogo de Sub-redes & Controlos de Varredura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Lista de Sub-redes Autorizadas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Sub-redes Registadas</h3>
            <span className="text-xs font-mono text-slate-400">{subnets.length} ativas</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
            {subnets.map(subnet => {
              const isSelected = (selectedSubnet?.id === subnet.id);
              const hostCount = devices.filter(d => d.subnet === subnet.cidr).length;
              const isVlan20Item = subnet.cidr.includes('192.168.20.');

              return (
                <div
                  key={subnet.id}
                  onClick={() => {
                    setSelectedSubnetId(subnet.id);
                    if (isVlan20Item) {
                      setProbeType('ICMP_ONLY');
                    }
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-slate-100 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {isVlan20Item && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                      {subnet.name}
                    </span>
                    <span className="font-mono text-[11px] text-cyan-400 font-medium">VLAN {subnet.vlan}</span>
                  </div>

                  <div className="font-mono text-slate-300 text-xs mb-1">
                    {subnet.cidr}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                    <span className={hostCount > 0 ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                      {hostCount} ativo(s) catalogado(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-[10px]">Autorizada</span>
                      {subnets.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteSubnet(subnet.id, e)}
                          className="text-slate-400 hover:text-rose-400 ml-1 p-0.5 transition-colors"
                          title="Remover sub-rede"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Painel de Controlo da Varredura e Terminal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Caixa de Configuração e Disparo da Varredura */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span>Alvo da Varredura:</span>
                  <span className="text-cyan-400 font-mono">{selectedSubnet ? `${selectedSubnet.name} (${selectedSubnet.cidr})` : 'Selecione uma sub-rede'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Coletor nativo: <span className="font-mono text-cyan-400">Linux Kernel / Sockets Raw</span> · Sondagem assíncrona paralela
                </p>
              </div>

              <div className="flex items-center gap-2">
                {scanJob?.status === 'running' ? (
                  <button
                    onClick={handleStopScan}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-100 bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
                  >
                    <Square size={14} />
                    <span>Parar Varredura</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartScan}
                    disabled={!selectedSubnet}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors shadow-sm shadow-cyan-500/20 disabled:opacity-50"
                  >
                    <Play size={14} />
                    <span>Executar Varredura Real</span>
                  </button>
                )}
              </div>
            </div>

            {/* Parâmetros de Sondagem */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">TÉCNICA DE SONDAGEM</label>
                <select
                  value={probeType}
                  onChange={(e) => setProbeType(e.target.value as any)}
                  disabled={scanJob?.status === 'running'}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                >
                  <option value="ICMP_ONLY">ICMP Echo Sweep (Recomendado para 192.168.20.0/24)</option>
                  <option value="ARP+ICMP">ARP Request + ICMP Echo (LAN Local L2)</option>
                  <option value="SYN_SCAN">TCP SYN Half-Open (Portas 80/443/22/445)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">ESCOPO DE IPs</label>
                <select
                  value={scanScope}
                  onChange={(e) => setScanScope(e.target.value as any)}
                  disabled={scanJob?.status === 'running'}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                >
                  <option value="full">Varredura Completa /24 (IPs .1 a .254 - 254 nós)</option>
                  <option value="fast">Gama Prioritária (~85 IPs: Gateway, DHCP e Estáticos)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">TAXA DE PACOTES (PPS)</label>
                <select
                  value={rateLimitPps}
                  onChange={(e) => setRateLimitPps(Number(e.target.value))}
                  disabled={scanJob?.status === 'running'}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                >
                  <option value={50}>50 pps (Modo Silencioso / Baixo Impacto)</option>
                  <option value={150}>150 pps (Padrão LAN Empresarial)</option>
                  <option value={300}>300 pps (Varredura Rápida Trunk)</option>
                </select>
              </div>
            </div>

            {/* Barra de Progresso em Tempo Real */}
            {scanJob && (
              <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80 mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={scanJob.status === 'running' ? 'text-cyan-400 animate-pulse font-semibold' : scanJob.status === 'completed' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                      ● {scanJob.status === 'running' ? 'A SONDAR REDE...' : scanJob.status === 'completed' ? 'VARREDURA CONCLUÍDA' : scanJob.status.toUpperCase()}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300">Alvo: {scanJob.targetCidr}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="tabular-nums font-semibold">{scanJob.probedIps}</span> / {scanJob.totalIps} IPs ({scanProgressPercent}%)
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      scanJob.status === 'completed' ? 'bg-emerald-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${scanProgressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>Ativos com resposta detetados: <strong className="text-emerald-400">{scanJob.discoveredHosts}</strong></span>
                  <span>Início: {scanJob.startTime} {scanJob.endTime ? `· Fim: ${scanJob.endTime}` : ''}</span>
                </div>
              </div>
            )}
          </div>

          {/* Terminal de Logs do Kernel em Tempo Real */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Terminal size={14} className="text-cyan-400" />
                <span>Registo do Coletor de Sondagem de Kernel</span>
              </span>
              <span className="text-[11px] text-slate-500">Buffer do Daemon Linux</span>
            </div>

            <div className="h-44 overflow-y-auto space-y-1 text-[11px] pr-2">
              {scanJob?.logs && scanJob.logs.length > 0 ? (
                scanJob.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                    <span className={
                      log.level === 'success' ? 'text-emerald-400 font-medium' :
                      log.level === 'warn' ? 'text-amber-400' :
                      log.level === 'error' ? 'text-rose-400' : 'text-slate-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic py-6 text-center">
                  O coletor de descoberta está inativo. Selecione a sub-rede <span className="text-cyan-400 font-mono">192.168.20.0/24</span> à esquerda e clique em &quot;Executar Varredura Real&quot; para identificar os nós.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Dispositivos Identificados na Sub-rede Selecionada */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Ativos Catalogados em {selectedSubnet?.name || 'Sub-rede Selecionada'} ({subnetDevices.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Equipamentos identificados e registados no inventário com IP, MAC, tipo e latência
            </p>
          </div>
        </div>

        {subnetDevices.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs space-y-2">
            <p>Nenhum ativo catalogado ainda para esta sub-rede.</p>
            <p className="text-slate-500">
              Clique em <strong>&quot;Executar Varredura Real&quot;</strong> para enviar pacotes de sondagem e descobrir os equipamentos ativos no segmento {selectedSubnet?.cidr}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">HOSTNAME</th>
                  <th className="pb-2 font-medium">ENDEREÇO IP</th>
                  <th className="pb-2 font-medium">ENDEREÇO MAC / ROTA</th>
                  <th className="pb-2 font-medium">FABRICANTE</th>
                  <th className="pb-2 font-medium">TIPO DE ATIVO</th>
                  <th className="pb-2 font-medium">ESTADO</th>
                  <th className="pb-2 font-medium text-right">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {subnetDevices.map(device => (
                  <tr key={device.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-medium text-slate-200">
                      {device.hostname}
                    </td>
                    <td className="py-2.5 text-cyan-400 font-semibold">{device.ipAddress}</td>
                    <td className="py-2.5 text-slate-400">{device.macAddress}</td>
                    <td className="py-2.5 text-slate-300 font-sans">{device.manufacturer}</td>
                    <td className="py-2.5 text-slate-300 font-sans">{device.deviceType}</td>
                    <td className="py-2.5">
                      <DeviceStatusBadge status={device.status} />
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      <button
                        onClick={() => onOpenDeviceDetail(device)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        Inspecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Registar Nova Sub-rede Autorizada */}
      <Modal
        isOpen={isAddSubnetModalOpen}
        onClose={() => setIsAddSubnetModalOpen(false)}
        title="Registar Sub-rede Autorizada"
        subtitle="Adicione o segmento de rede à política de monitorização do NEXUS"
      >
        <form onSubmit={handleCreateSubnet} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Sub-rede</label>
            <input
              type="text"
              placeholder="ex: Sub-rede VLAN 20 ou Laboratório"
              value={newSubnetName}
              onChange={(e) => setNewSubnetName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Notação CIDR</label>
              <input
                type="text"
                placeholder="192.168.20.0/24"
                value={newSubnetCidr}
                onChange={(e) => setNewSubnetCidr(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">ID da VLAN</label>
              <input
                type="number"
                min="1"
                max="4094"
                value={newSubnetVlan}
                onChange={(e) => setNewSubnetVlan(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição do Âmbito</label>
            <textarea
              rows={2}
              placeholder="Finalidade operacional, localização física, routers ou switches interligados..."
              value={newSubnetDesc}
              onChange={(e) => setNewSubnetDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="authCheck"
              checked={newSubnetIsAuthorized}
              onChange={(e) => setNewSubnetIsAuthorized(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="authCheck" className="text-xs text-slate-300 cursor-pointer">
              Confirmar que esta sub-rede está explicitamente autorizada para varreduras de rede
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddSubnetModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
            >
              Guardar Sub-rede Autorizada
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
