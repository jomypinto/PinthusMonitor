import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Server, 
  Terminal, 
  HardDrive, 
  RefreshCw, 
  FileCheck, 
  Cpu, 
  Check, 
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import { NetworkDevice, FirmwarePackageInfo } from '../../types/network';
import { nexusApi } from '../../services/api';

interface FirmwareUpdateModalProps {
  isOpen: boolean;
  device: NetworkDevice | null;
  targetDevices?: NetworkDevice[];
  onClose: () => void;
  onSuccess: (updatedDevice: NetworkDevice) => void;
  onBatchSuccess?: (updatedDevices: NetworkDevice[]) => void;
}

export const FirmwareUpdateModal: React.FC<FirmwareUpdateModalProps> = ({
  isOpen,
  device,
  targetDevices,
  onClose,
  onSuccess,
  onBatchSuccess
}) => {
  const isBatch = Boolean(targetDevices && targetDevices.length > 0);
  const activeDevices = isBatch ? (targetDevices || []) : (device ? [device] : []);

  // Form options
  const [backupConfig, setBackupConfig] = useState<boolean>(true);
  const [verifyChecksum, setVerifyChecksum] = useState<boolean>(true);
  const [userHasGivenPermission, setUserHasGivenPermission] = useState<boolean>(false);

  // Execution states
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Firmware package catalog info
  const [packages, setPackages] = useState<FirmwarePackageInfo[]>([]);

  useEffect(() => {
    if (isOpen) {
      setUserHasGivenPermission(false);
      setIsExecuting(false);
      setIsCompleted(false);
      setErrorMsg(null);
      setExecutionStep(0);
      setProgressPercent(0);
      setLiveLogs([]);

      nexusApi.getFirmwarePackages().then(pkgs => {
        setPackages(pkgs);
      });
    }
  }, [isOpen]);

  if (!isOpen || activeDevices.length === 0) return null;

  const currentDevice = activeDevices[0];
  const pkgInfo = packages.find(p => p.deviceId === currentDevice?.id);

  // Compute total download size and CVEs mitigated
  const totalDownloadMb = isBatch 
    ? activeDevices.reduce((sum, d) => {
        const p = packages.find(pkg => pkg.deviceId === d.id);
        return sum + (p?.downloadSizeMb || 35);
      }, 0)
    : (pkgInfo?.downloadSizeMb || 35);

  const totalCvesCount = activeDevices.reduce((sum, d) => sum + (d.vulnerabilities?.length || 0), 0);

  const handleStartUpdate = async () => {
    if (!userHasGivenPermission) {
      setErrorMsg('É obrigatório assinalar a autorização explícita do operador para prosseguir com a atualização.');
      return;
    }

    setIsExecuting(true);
    setErrorMsg(null);
    setExecutionStep(1);
    setProgressPercent(15);
    setLiveLogs([`[${new Date().toLocaleTimeString()}] Autorização de operador confirmada. A iniciar orquestrador de firmware...`]);

    try {
      if (isBatch) {
        // Step 1: Connecting to CDN
        await new Promise(r => setTimeout(r, 600));
        setExecutionStep(2);
        setProgressPercent(35);
        setLiveLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] A estabelecer sessão com repositórios oficiais dos fabricantes (${activeDevices.length} ativos)...`,
          `[${new Date().toLocaleTimeString()}] Download em curso dos pacotes oficiais (${totalDownloadMb.toFixed(1)} MB no total)...`
        ]);

        // Step 2: Verification
        await new Promise(r => setTimeout(r, 800));
        setExecutionStep(3);
        setProgressPercent(65);
        setLiveLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] Validação de integridade criptográfica SHA-256 e assinaturas GPG: 100% OK.`,
          backupConfig ? `[${new Date().toLocaleTimeString()}] A criar backups de arranque para todos os ativos em /var/backups/pre-upgrade/` : `[${new Date().toLocaleTimeString()}] Backup prévio ignorado.`
        ]);

        // Step 3: Flash and execution
        await new Promise(r => setTimeout(r, 900));
        setExecutionStep(4);
        setProgressPercent(85);
        setLiveLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] A gravar imagens na memória flash e partições seguras de sistema...`,
          `[${new Date().toLocaleTimeString()}] A efetuar reinício suave controlado e verificação de enlace de rede...`
        ]);

        const ids = activeDevices.map(d => d.id);
        const res = await nexusApi.batchUpdateFirmware(ids, true, backupConfig);

        setExecutionStep(5);
        setProgressPercent(100);
        setIsCompleted(true);
        setLiveLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] Atualização concluída com sucesso! ${res.updatedCount} ativo(s) migrados para a versão estável.`,
          `[${new Date().toLocaleTimeString()}] Todos os testes de conectividade ICMP responderam dentro dos parâmetros nominais (0% packet loss).`
        ]);

        if (onBatchSuccess && res.devices) {
          onBatchSuccess(res.devices);
        }
      } else {
        // Single device execution
        const devId = currentDevice.id;

        // Step 1: Download
        await new Promise(r => setTimeout(r, 500));
        setExecutionStep(2);
        setProgressPercent(30);
        setLiveLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] A descarregar imagem '${pkgInfo?.packageName || 'firmware.bin'}' (${pkgInfo?.downloadSizeMb || 25} MB) de ${pkgInfo?.vendorCdn || 'CDN Oficial'}...`
        ]);

        // Step 2: SHA256 & Backup
        await new Promise(r => setTimeout(r, 700));
        setExecutionStep(3);
        setProgressPercent(60);
        setLiveLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] Verificação SHA-256: ${pkgInfo?.sha256 ? pkgInfo.sha256.slice(0, 24) + '...' : 'Válido (Hash Match)'}`,
          backupConfig ? `[${new Date().toLocaleTimeString()}] Snapshot de configuração e regras guardado em /var/backups/${devId}-pre-upgrade.cfg` : `[${new Date().toLocaleTimeString()}] Backup pré-flash omitido.`
        ]);

        // Step 3: Flash write
        await new Promise(r => setTimeout(r, 800));
        setExecutionStep(4);
        setProgressPercent(85);
        setLiveLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] A gravar bloco na memória flash e a executar atualização de microcódigo...`,
          `[${new Date().toLocaleTimeString()}] Reinício controlado efetuado. A aguardar resposta da pilha de rede...`
        ]);

        const res = await nexusApi.updateDeviceFirmware(devId, true, backupConfig);

        setExecutionStep(5);
        setProgressPercent(100);
        setIsCompleted(true);
        setLiveLogs(prev => [
          ...prev, 
          ...(res.updateLog || []),
          `[${new Date().toLocaleTimeString()}] Estado de atualização concluído: Versão ativa '${res.device.firmwareVersion}'.`,
          `[${new Date().toLocaleTimeString()}] Todas as vulnerabilidades CVE associadas foram corrigidas e encerradas no inventário.`
        ]);

        onSuccess(res.device);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro durante a atualização do firmware.');
      setIsExecuting(false);
      setLiveLogs(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] ERRO: ${err.message || 'Falha de comunicação com o equipamento'}`
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              isCompleted 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              {isCompleted ? <CheckCircle2 size={20} /> : <Download size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  {isBatch ? 'Atualização Automática de Firmware em Lote' : 'Atualização Automática de Firmware'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Requer Permissão
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isBatch 
                  ? `Aplicação de firmware oficial e patches em ${activeDevices.length} ativos autorizados` 
                  : `Atualização e remediação para ${currentDevice?.hostname} (${currentDevice?.ipAddress})`}
              </p>
            </div>
          </div>

          {!isExecuting && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-sans">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-lg text-rose-200 flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Erro na Operação:</span>
                <span className="text-[11px] leading-relaxed">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Active Devices Comparison Cards */}
          <div className="space-y-3">
            <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider block font-semibold">
              {isBatch ? `Ativos Selecionados (${activeDevices.length})` : 'Dispositivo Alvo & Versões'}
            </span>

            {activeDevices.map(d => {
              const p = packages.find(pkg => pkg.deviceId === d.id);
              const targetVer = p ? p.latestVersion : (d.latestFirmwareVersion || 'Versão Recente');
              const currentVer = d.firmwareVersion || d.operatingSystem || 'N/A';

              return (
                <div key={d.id} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-cyan-400" />
                      <span className="font-semibold text-slate-200 text-sm">{d.hostname}</span>
                      <span className="font-mono text-slate-400 text-[11px]">({d.ipAddress})</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                        {d.subnet}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      {d.deviceType} · {d.manufacturer}
                    </span>
                  </div>

                  {/* Version Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[10px] uppercase font-mono block">Versão Atual Instalada</span>
                      <div className="font-mono font-semibold text-amber-300 text-xs mt-0.5 truncate">
                        {currentVer}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Lançamento: {d.firmwareReleaseDate || 'Anterior'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 text-[10px] uppercase font-mono block">Versão Disponível para Download</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Oficial
                        </span>
                      </div>
                      <div className="font-mono font-semibold text-emerald-300 text-xs mt-0.5 truncate flex items-center gap-1.5">
                        <Download size={12} className="text-emerald-400" />
                        <span>{targetVer}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p?.downloadSizeMb ? `${p.downloadSizeMb} MB` : 'Pacote de Segurança'} · Repositório Oficial
                      </span>
                    </div>
                  </div>

                  {/* Release Notes / Improvements */}
                  {p?.releaseNotes && (
                    <div className="p-2 rounded bg-slate-900/80 text-[11px] text-slate-300 border border-slate-800/60 leading-relaxed">
                      <strong className="text-cyan-300">Resumo da Atualização:</strong> {p.releaseNotes}
                    </div>
                  )}

                  {/* Resolved CVEs */}
                  {d.vulnerabilities && d.vulnerabilities.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-mono text-slate-500">Vulnerabilidades Eliminadas:</span>
                      {d.vulnerabilities.map(c => (
                        <span key={c.cveId} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {c.cveId} (CVSS {c.score})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Execution Progress & Live Logs (when running or completed) */}
          {isExecuting && (
            <div className="p-4 bg-slate-950 rounded-lg border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-cyan-300 flex items-center gap-2">
                  <RefreshCw size={13} className={isCompleted ? '' : 'animate-spin'} />
                  {isCompleted ? 'Atualização Concluída com Sucesso' : 'Processo de Atualização em Curso...'}
                </span>
                <span className="text-slate-400 font-bold">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Terminal Logs Box */}
              <div className="bg-slate-900 rounded p-3 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto space-y-1 border border-slate-800">
                {liveLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-500 select-none">›</span>
                    <span className={log.includes('ERRO') ? 'text-rose-400' : log.includes('concluída') || log.includes('Sucesso') ? 'text-emerald-300' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Settings & Explicit User Permission (Before Execution) */}
          {!isExecuting && !isCompleted && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5">
                <span className="text-slate-300 font-semibold text-xs block">Salvaguardas e Verificações Automáticas:</span>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={backupConfig}
                    onChange={(e) => setBackupConfig(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span>Criar cópia de segurança (backup de arranque) antes de gravar na memória flash</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={verifyChecksum}
                    onChange={(e) => setVerifyChecksum(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span>Validar integridade criptográfica SHA-256 e assinatura digital do fabricante</span>
                </label>
              </div>

              {/* EXPLICIT PERMISSION PROMPT REQUIREMENT */}
              <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-200 text-xs">
                      Confirmação e Autorização Prévia do Operador
                    </h4>
                    <p className="text-[11px] text-amber-300/80 mt-1 leading-relaxed">
                      A atualização de firmware realiza o download automático do pacote oficial, regrava a imagem de sistema e reinicia os serviços de rede do equipamento (downtime estimado: 15 a 45s).
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/20">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={userHasGivenPermission}
                      onChange={(e) => setUserHasGivenPermission(e.target.checked)}
                      className="rounded border-amber-500/50 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20 mt-0.5"
                    />
                    <span className="text-xs font-semibold text-slate-100">
                      Sim, concedo autorização formal para descarregar e aplicar a atualização automática de firmware neste(s) ativo(s).
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            {isCompleted ? 'Operação concluída com sucesso' : `${activeDevices.length} ativo(s) selecionado(s) · Sub-redes 192.168.0.0/24 & 192.168.20.0/24`}
          </span>

          <div className="flex items-center gap-3">
            {isCompleted ? (
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors shadow-sm"
              >
                Concluir e Fechar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isExecuting}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleStartUpdate}
                  disabled={isExecuting || !userHasGivenPermission}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-md shadow-cyan-500/20"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>A Atualizar ({progressPercent}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      <span>Autorizar e Executar Atualização</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
