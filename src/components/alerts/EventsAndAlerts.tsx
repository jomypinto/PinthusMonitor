import React, { useState, useMemo } from 'react';
import { 
  BellRing, 
  Search, 
  Filter, 
  Download, 
  Check, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { NetworkEvent, EventSeverity, NetworkDevice } from '../../types/network';
import { SeverityBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { nexusApi } from '../../services/api';
import { exportEventsToCsv } from '../../services/exportService';

interface EventsAndAlertsProps {
  events: NetworkEvent[];
  devices: NetworkDevice[];
  onRefreshEvents: () => void;
  onOpenDeviceDetail: (device: NetworkDevice) => void;
}

export const EventsAndAlerts: React.FC<EventsAndAlertsProps> = ({
  events,
  devices,
  onRefreshEvents,
  onOpenDeviceDetail
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [ackFilter, setAckFilter] = useState<'all' | 'unack' | 'ack'>('all');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<NetworkEvent | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const q = search.toLowerCase();
      const matchesSearch = 
        e.deviceName.toLowerCase().includes(q) ||
        e.ipAddress.includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q);

      const matchesSeverity = severityFilter === 'all' || e.severity === severityFilter;
      const matchesAck = 
        ackFilter === 'all' ? true :
        ackFilter === 'unack' ? !e.acknowledged : e.acknowledged;

      return matchesSearch && matchesSeverity && matchesAck;
    });
  }, [events, search, severityFilter, ackFilter]);

  const unackCount = events.filter(e => !e.acknowledged).length;
  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const warningCount = events.filter(e => e.severity === 'warning').length;

  const handleAcknowledge = async (eventId: string, notes?: string) => {
    setIsSubmittingAck(true);
    try {
      await nexusApi.acknowledgeEvent(eventId, notes, 'sysadmin');
      onRefreshEvents();
      setSelectedEvent(null);
      setResolutionNotes('');
    } finally {
      setIsSubmittingAck(false);
    }
  };

  const handleOpenAckModal = (event: NetworkEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setResolutionNotes(event.resolutionNotes || '');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Counter Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              Real-time Alerting & Incident Audit Log
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              System Events, Threshold Violations & Traps
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated trigger engine monitoring ICMP drops, uncataloged MAC discoveries, and SNMP trap events.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => exportEventsToCsv(filteredEvents)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
            >
              <Download size={14} />
              <span>Export Alert Log ({filteredEvents.length})</span>
            </button>
          </div>
        </div>

        {/* Severity Count Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">UNACKNOWLEDGED</span>
              <span className="text-xl font-bold font-mono text-rose-400 tabular-nums">{unackCount}</span>
            </div>
            <BellRing size={18} className="text-rose-400" />
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">CRITICAL SEVERITY</span>
              <span className="text-xl font-bold font-mono text-rose-400 tabular-nums">{criticalCount}</span>
            </div>
            <AlertOctagon size={18} className="text-rose-400" />
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">WARNINGS</span>
              <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">{warningCount}</span>
            </div>
            <AlertTriangle size={18} className="text-amber-400" />
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">TOTAL RECORDED</span>
              <span className="text-xl font-bold font-mono text-slate-200 tabular-nums">{events.length}</span>
            </div>
            <Clock size={18} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter events by device, IP, event type, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warning Only</option>
              <option value="info">Info Only</option>
            </select>

            <select
              value={ackFilter}
              onChange={(e) => setAckFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="all">All States</option>
              <option value="unack">Pending Acknowledgement</option>
              <option value="ack">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-3 px-4 font-medium">TIMESTAMP</th>
                <th className="py-3 px-4 font-medium">SEVERITY</th>
                <th className="py-3 px-4 font-medium">DEVICE HOSTNAME</th>
                <th className="py-3 px-4 font-medium">IP ADDRESS</th>
                <th className="py-3 px-4 font-medium">EVENT TYPE</th>
                <th className="py-3 px-4 font-medium max-w-md">DESCRIPTION</th>
                <th className="py-3 px-4 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No network events match the active search criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(event => (
                  <tr 
                    key={event.id}
                    onClick={() => {
                      const dev = devices.find(d => d.ipAddress === event.ipAddress);
                      if (dev) onOpenDeviceDetail(dev);
                    }}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      !event.acknowledged ? 'bg-slate-900' : 'bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">{event.timestamp}</td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={event.severity} />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{event.deviceName}</td>
                    <td className="py-3 px-4 text-cyan-400">{event.ipAddress}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-xs">
                      {event.eventType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-xs max-w-md leading-relaxed">
                      {event.description}
                      {event.acknowledged && event.resolutionNotes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5 font-sans">
                          Resolution: {event.resolutionNotes} (by {event.acknowledgedBy})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                      {!event.acknowledged ? (
                        <button
                          onClick={(e) => handleOpenAckModal(event, e)}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium transition-colors whitespace-nowrap"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle2 size={13} />
                          <span>Acked</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acknowledge Modal */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title="Acknowledge Network Alert"
        subtitle={selectedEvent ? `${selectedEvent.deviceName} (${selectedEvent.ipAddress}) · ${selectedEvent.timestamp}` : ''}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              <span className="font-mono text-cyan-400 block mb-1">EVENT DESCRIPTION:</span>
              {selectedEvent.description}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Resolution Notes / Operator Remarks
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Root cause identified, switch link recovered, device approved in inventory..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAcknowledge(selectedEvent.id, resolutionNotes)}
                disabled={isSubmittingAck}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors disabled:opacity-50"
              >
                {isSubmittingAck ? 'Confirming...' : 'Confirm Acknowledge'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
