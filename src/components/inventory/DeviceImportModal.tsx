import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  AlertTriangle, 
  FileText, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { nexusApi } from '../../services/api';

interface DeviceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const DeviceImportModal: React.FC<DeviceImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [rawText, setRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    rejectedCount: number;
    rejectedList: Array<{ ip: string; reason: string }>;
    totalDevices: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live preview counts parsed lines
  const detectedIps = (rawText.match(/\b(192\.168\.(?:0|20)\.\d{1,3})\b/g) || []);
  const uniqueDetectedIps = Array.from(new Set(detectedIps));

  const handleImport = async () => {
    if (!rawText.trim()) {
      setError('Por favor insira texto com endereços IP, linhas de ARP ou lista de leases DHCP.');
      return;
    }
    setError(null);
    setIsImporting(true);

    try {
      const res = await nexusApi.importDevices({ rawText });
      if (res && res.success) {
        setImportResult({
          importedCount: res.importedCount,
          rejectedCount: res.rejectedCount,
          rejectedList: res.rejectedList || [],
          totalDevices: res.totalDevices
        });
        onImportComplete();
      } else {
        setError('Ocorreu um erro durante a importação.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao importar dispositivos.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSampleDhcp = () => {
    setRawText(`# Tabela de Leases DHCP / Clientes UniFi
192.168.0.25 00:11:32:44:aa:12 srv-syslog.lan
192.168.0.26 00:11:32:44:aa:13 srv-radius.lan
192.168.20.120 70:85:c2:55:10:a1 workstation-rececao.lan
192.168.20.121 70:85:c2:55:10:a2 workstation-armazem.lan
192.168.20.122 70:85:c2:55:10:a3 laptop-visitante.lan`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Importar Ativos de Rede em Lote (Leases DHCP / ARP)
              </h2>
              <p className="text-xs text-slate-400">
                Suporta sub-redes reais <span className="text-cyan-400 font-mono">192.168.0.0/24</span> e <span className="text-purple-400 font-mono">192.168.20.0/24</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-rose-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {importResult ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 size={18} />
                <span>Importação Concluída com Sucesso!</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center py-2 bg-slate-900/60 rounded-md border border-slate-800">
                <div>
                  <span className="block text-slate-400 text-[11px]">Processados/Atualizados</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{importResult.importedCount}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px]">Rejeitados/Ignorados</span>
                  <span className="text-base font-bold text-amber-400 font-mono">{importResult.rejectedCount}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px]">Total no Inventário</span>
                  <span className="text-base font-bold text-cyan-400 font-mono">{importResult.totalDevices}</span>
                </div>
              </div>

              {importResult.rejectedList.length > 0 && (
                <div className="mt-2">
                  <span className="text-amber-400 font-medium block mb-1">Itens Rejeitados:</span>
                  <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-400">
                    {importResult.rejectedList.map((r, idx) => (
                      <div key={idx} className="flex justify-between border-b border-slate-800/50 pb-0.5">
                        <span className="text-rose-400">{r.ip}</span>
                        <span className="text-slate-500">{r.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">
                  Cole abaixo a lista de clientes (UniFi, MikroTik, arquivo /etc/hosts ou saída arp -a):
                </span>
                <button
                  type="button"
                  onClick={handleSampleDhcp}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] underline"
                >
                  Inserir exemplo de Leases
                </button>
              </div>

              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={9}
                placeholder={`Formato aceito (cada linha com IP e opcionalmente MAC e Hostname):
192.168.0.45  00:11:22:33:44:55  srv-print02.lan
192.168.20.75 dc:a6:32:89:1b:22  macbook-design.lan
192.168.20.80`}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 font-mono text-[11px] focus:outline-none focus:border-cyan-500 resize-none"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>
                  Ativos identificados no texto: <strong className="text-cyan-400 font-mono">{uniqueDetectedIps.length}</strong> endereço(s) IP nas redes autorizadas.
                </span>
                <span className="text-slate-500">
                  IP 192.168.20.50 é automaticamente descartado.
                </span>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {importResult ? 'Fechar' : 'Cancelar'}
            </button>
            {!importResult && (
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || uniqueDetectedIps.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg transition-colors shadow-md disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-slate-950" />
                    <span>A importar ativos...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Importar {uniqueDetectedIps.length > 0 ? `(${uniqueDetectedIps.length} Ativos)` : ''}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
