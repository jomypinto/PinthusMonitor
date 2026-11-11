import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  Check, 
  AlertTriangle, 
  Layers, 
  HardDrive, 
  Cpu, 
  Network, 
  Tag, 
  FileText,
  ShieldCheck,
  Router,
  Printer,
  Wifi,
  Laptop
} from 'lucide-react';
import { NetworkDevice, DeviceType } from '../../types/network';
import { nexusApi } from '../../services/api';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (device: NetworkDevice) => void;
  initialDevice?: NetworkDevice | null;
  mode: 'create' | 'edit';
}

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDevice,
  mode
}) => {
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('Workstation');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [subnet, setSubnet] = useState('192.168.0.0/24');
  const [vlan, setVlan] = useState<number>(1);
  const [openPortsStr, setOpenPortsStr] = useState('80, 443');
  const [tagsStr, setTagsStr] = useState('Ativo Real, Produção');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialDevice && mode === 'edit') {
      setHostname(initialDevice.hostname || '');
      setIpAddress(initialDevice.ipAddress || '');
      setMacAddress(initialDevice.macAddress || '');
      setManufacturer(initialDevice.manufacturer || '');
      setDeviceType(initialDevice.deviceType || 'Workstation');
      setOperatingSystem(initialDevice.operatingSystem || '');
      setSubnet(initialDevice.subnet || (initialDevice.ipAddress?.startsWith('192.168.20.') ? '192.168.20.0/24' : '192.168.0.0/24'));
      setVlan(initialDevice.vlan ?? (initialDevice.ipAddress?.startsWith('192.168.20.') ? 20 : 1));
      setOpenPortsStr((initialDevice.openPorts || []).join(', '));
      setTagsStr((initialDevice.tags || []).join(', '));
      setNotes(initialDevice.notes || '');
    } else {
      setHostname('');
      setIpAddress('192.168.0.');
      setMacAddress('');
      setManufacturer('');
      setDeviceType('Workstation');
      setOperatingSystem('');
      setSubnet('192.168.0.0/24');
      setVlan(1);
      setOpenPortsStr('80, 443');
      setTagsStr('Ativo Real, Produção');
      setNotes('');
    }
    setError(null);
  }, [initialDevice, mode, isOpen]);

  // Automatically adjust VLAN when IP changes
  const handleIpChange = (newIp: string) => {
    setIpAddress(newIp);
    if (newIp.startsWith('192.168.20.')) {
      setSubnet('192.168.20.0/24');
      setVlan(20);
    } else if (newIp.startsWith('192.168.0.')) {
      setSubnet('192.168.0.0/24');
      setVlan(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIp = ipAddress.trim();
    if (!cleanIp) {
      setError('O endereço IP é obrigatório.');
      return;
    }

    const isSubnet0 = cleanIp.startsWith('192.168.0.');
    const isSubnet20 = cleanIp.startsWith('192.168.20.');

    if (!isSubnet0 && !isSubnet20) {
      setError('Apenas são autorizados ativos pertencentes às sub-redes reais 192.168.0.0/24 ou 192.168.20.0/24.');
      return;
    }

    if (cleanIp === '192.168.20.50') {
      setError('O endereço 192.168.20.50 foi identificado como inexistente na rede e não pode ser registado.');
      return;
    }

    const parsedPorts = openPortsStr
      .split(',')
      .map(p => parseInt(p.trim(), 10))
      .filter(p => !isNaN(p) && p > 0 && p <= 65535);

    const parsedTags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const payload: Partial<NetworkDevice> = {
          hostname: hostname.trim() || `host-${cleanIp.replace(/\./g, '-')}.lan`,
          ipAddress: cleanIp,
          macAddress: macAddress.trim() || 'Detectado na LAN',
          manufacturer: manufacturer.trim() || (isSubnet20 ? 'Dispositivo VLAN 20' : 'Equipamento LAN'),
          deviceType,
          operatingSystem: operatingSystem.trim() || 'Sistema de Rede Físico',
          subnet,
          vlan,
          openPorts: parsedPorts.length > 0 ? parsedPorts : [80],
          tags: parsedTags.length > 0 ? parsedTags : ['Ativo Real', isSubnet20 ? 'VLAN-20' : 'LAN-Corp'],
          notes: notes.trim() || 'Ativo físico adicionado manualmente ao inventário autorizado.'
        };
        const res = await nexusApi.createDevice(payload);
        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        }
      } else if (initialDevice) {
        const updates: Partial<NetworkDevice> = {
          hostname: hostname.trim(),
          manufacturer: manufacturer.trim(),
          deviceType,
          operatingSystem: operatingSystem.trim(),
          macAddress: macAddress.trim(),
          vlan,
          openPorts: parsedPorts,
          tags: parsedTags,
          notes: notes.trim()
        };
        const res = await nexusApi.updateDevice(initialDevice.id, updates);
        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar a operação de registo do ativo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {mode === 'create' ? 'Adicionar Ativo à Rede Real' : `Editar Ativo: ${initialDevice?.hostname || initialDevice?.ipAddress}`}
              </h2>
              <p className="text-xs text-slate-400">
                Inventário autorizado: sub-redes reais <span className="text-cyan-400 font-mono">192.168.0.0/24</span> e <span className="text-purple-400 font-mono">192.168.20.0/24</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-rose-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hostname */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Hostname (FQDN) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={hostname}
                onChange={e => setHostname(e.target.value)}
                placeholder="ex: bizhub-c257i.lan ou srv-dc01.lan"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Endereço IP Real <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={e => handleIpChange(e.target.value)}
                placeholder="192.168.0.x ou 192.168.20.x"
                disabled={mode === 'edit'}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 disabled:bg-slate-900/50 disabled:text-slate-500 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* MAC Address */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Endereço MAC
              </label>
              <input
                type="text"
                value={macAddress}
                onChange={e => setMacAddress(e.target.value)}
                placeholder="ex: 00:20:6B:1A:2B:3C"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Device Type */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Tipo de Dispositivo
              </label>
              <select
                value={deviceType}
                onChange={e => setDeviceType(e.target.value as DeviceType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Router">Router / Gateway de Rede</option>
                <option value="Switch">Switch de Distribuição / Acesso PoE+</option>
                <option value="Server">Servidor (Hypervisor, DC, Backup)</option>
                <option value="Storage">Storage NAS / SAN (ZFS / iSCSI)</option>
                <option value="Printer">Impressora / Multifunções MFP</option>
                <option value="AccessPoint">Access Point Wi-Fi 6 / Mesh</option>
                <option value="Workstation">Estação de Trabalho / Posto de Trabalho</option>
                <option value="VoIP">Telefone IP / Central PBX SIP</option>
                <option value="Camera">Câmara CCTV / NVR Protect</option>
                <option value="IoT">Hub de Controlo de Acessos / IoT</option>
              </select>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Fabricante / Modelo
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                placeholder="ex: Konica Minolta (bizhub C257i), QNAP (TS-h1277)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Operating System */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Sistema Operativo / Versão de Firmware
              </label>
              <input
                type="text"
                value={operatingSystem}
                onChange={e => setOperatingSystem(e.target.value)}
                placeholder="ex: Controller FW G00-X5, QuTS hero h5.1.5, Windows Server 2022"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Subnet */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Sub-rede
              </label>
              <select
                value={subnet}
                onChange={e => {
                  setSubnet(e.target.value);
                  setVlan(e.target.value.includes('20.0') ? 20 : 1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="192.168.0.0/24">192.168.0.0/24 (LAN Principal / Servidores)</option>
                <option value="192.168.20.0/24">192.168.20.0/24 (VLAN 20 Periféricos / Postos)</option>
              </select>
            </div>

            {/* VLAN */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                VLAN ID
              </label>
              <input
                type="number"
                value={vlan}
                onChange={e => setVlan(Number(e.target.value))}
                min={1}
                max={4094}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Open Ports */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Portas TCP Abertas (separadas por vírgula)
            </label>
            <input
              type="text"
              value={openPortsStr}
              onChange={e => setOpenPortsStr(e.target.value)}
              placeholder="ex: 80, 443, 9100, 631, 515"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Portas conhecidas: 9100/631 (Impressão RAW/IPP), 50001 (Konica OpenAPI), 8080/443 (QuTS hero / UniFi), 8006 (Proxmox), 3389/88/389 (AD).
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Etiquetas / Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              placeholder="ex: Ativo Real, Impressora, Produção, VLAN-20"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Observações e Descrição Técnica
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Notas sobre localização física, papel na infraestrutura, garantia ou credenciais de gestão..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>A processar...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>{mode === 'create' ? 'Adicionar Ativo ao Inventário' : 'Salvar Alterações'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
