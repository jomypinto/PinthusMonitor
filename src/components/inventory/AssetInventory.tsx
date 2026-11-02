import React, { useState, useMemo } from 'react';
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
  HardDrive
} from 'lucide-react';
import { NetworkDevice, DeviceType, DeviceStatus } from '../../types/network';
import { DeviceStatusBadge } from '../common/StatusBadge';
import { exportDevicesToCsv } from '../../services/exportService';

interface AssetInventoryProps {
  devices: NetworkDevice[];
  onOpenDeviceDetail: (device: NetworkDevice) => void;
  onRefreshDevices: () => void;
}

export const AssetInventory: React.FC<AssetInventoryProps> = ({
  devices,
  onOpenDeviceDetail,
  onRefreshDevices
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [subnetFilter, setSubnetFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof NetworkDevice>('ipAddress');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract unique subnets & types for dropdowns
  const availableSubnets = useMemo(() => {
    return Array.from(new Set(devices.map(d => d.subnet)));
  }, [devices]);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(devices.map(d => d.deviceType)));
  }, [devices]);

  // Filtering and Sorting
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const q = search.toLowerCase();
      const matchesSearch = 
        device.hostname.toLowerCase().includes(q) ||
        device.ipAddress.includes(q) ||
        device.macAddress.toLowerCase().includes(q) ||
        device.manufacturer.toLowerCase().includes(q) ||
        device.operatingSystem.toLowerCase().includes(q) ||
        device.tags.some(t => t.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesType = typeFilter === 'all' || device.deviceType === typeFilter;
      const matchesSubnet = subnetFilter === 'all' || device.subnet === subnetFilter;

      return matchesSearch && matchesStatus && matchesType && matchesSubnet;
    }).sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';

      if (sortBy === 'ipAddress') {
        // Numeric sort on IPv4 octets
        const ipA = (a.ipAddress.split('.').map(Number));
        const ipB = (b.ipAddress.split('.').map(Number));
        for (let i = 0; i < 4; i++) {
          if (ipA[i] !== ipB[i]) {
            return (ipA[i] - ipB[i]) * order;
          }
        }
        return 0;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * order;
      }
      return String(valA).localeCompare(String(valB)) * order;
    });
  }, [devices, search, statusFilter, typeFilter, subnetFilter, sortBy, sortOrder]);

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

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by hostname, IP, MAC address, vendor or OS..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportDevicesToCsv(filteredDevices)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
            >
              <Download size={14} />
              <span>Export CSV ({filteredDevices.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Segmented Toggles */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter size={13} />
            <span className="font-mono text-[11px] uppercase">Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
          >
            <option value="all">All Statuses ({devices.length})</option>
            <option value="online">Online</option>
            <option value="degraded">Degraded</option>
            <option value="offline">Offline</option>
            <option value="unknown">Unknown</option>
          </select>

          {/* Device Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
          >
            <option value="all">All Device Types</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Subnet Filter */}
          <select
            value={subnetFilter}
            onChange={(e) => { setSubnetFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-mono"
          >
            <option value="all">All Subnets</option>
            {availableSubnets.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {(search || statusFilter !== 'all' || typeFilter !== 'all' || subnetFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTypeFilter('all');
                setSubnetFilter('all');
                setCurrentPage(1);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Asset Table */}
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
                    <span>HOSTNAME</span>
                    <ArrowUpDown size={12} className={sortBy === 'hostname' ? 'text-cyan-400' : 'text-slate-600'} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ipAddress')} 
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span>IP ADDRESS</span>
                    <ArrowUpDown size={12} className={sortBy === 'ipAddress' ? 'text-cyan-400' : 'text-slate-600'} />
                  </div>
                </th>
                <th className="py-3 px-4 font-medium">MAC ADDRESS</th>
                <th 
                  onClick={() => handleSort('manufacturer')} 
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span>MANUFACTURER</span>
                    <ArrowUpDown size={12} className={sortBy === 'manufacturer' ? 'text-cyan-400' : 'text-slate-600'} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('deviceType')} 
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span>DEVICE TYPE</span>
                    <ArrowUpDown size={12} className={sortBy === 'deviceType' ? 'text-cyan-400' : 'text-slate-600'} />
                  </div>
                </th>
                <th className="py-3 px-4 font-medium">OPERATING SYSTEM</th>
                <th 
                  onClick={() => handleSort('latencyMs')} 
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span>RTT / STATUS</span>
                    <ArrowUpDown size={12} className={sortBy === 'latencyMs' ? 'text-cyan-400' : 'text-slate-600'} />
                  </div>
                </th>
                <th className="py-3 px-4 font-medium">LAST SEEN</th>
                <th className="py-3 px-4 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedDevices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No network devices matched the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedDevices.map(device => (
                  <tr 
                    key={device.id} 
                    onClick={() => onOpenDeviceDetail(device)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-2">
                      {!device.isAuthorized && (
                        <span title="Uncataloged / Rogue candidate" className="text-amber-400">
                          <ShieldAlert size={14} />
                        </span>
                      )}
                      <span className="truncate max-w-[170px]">{device.hostname}</span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-semibold">{device.ipAddress}</td>
                    <td className="py-3 px-4 text-slate-400">{device.macAddress}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{device.manufacturer}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{device.deviceType}</td>
                    <td className="py-3 px-4 text-slate-400 font-sans truncate max-w-[150px]" title={device.operatingSystem}>
                      {device.operatingSystem}
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
                    <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">{device.lastSeen}</td>
                    <td className="py-3 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenDeviceDetail(device)}
                        className="px-2.5 py-1 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded font-medium transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200 tabular-nums">{paginatedDevices.length}</span> of{' '}
            <span className="font-semibold text-slate-200 tabular-nums">{filteredDevices.length}</span> devices
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-xs text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
