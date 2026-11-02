import React from 'react';
import { DeviceStatus, EventSeverity } from '../../types/network';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, AlertOctagon, Info } from 'lucide-react';

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ status, showIcon = true, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm font-medium';
  const iconSize = size === 'sm' ? 13 : 15;

  switch (status) {
    case 'online':
      return (
        <span className={`inline-flex items-center gap-1.5 text-emerald-400 font-mono ${sizeClasses}`}>
          {showIcon && <CheckCircle2 size={iconSize} className="text-emerald-400 shrink-0" />}
          <span>Online</span>
        </span>
      );
    case 'offline':
      return (
        <span className={`inline-flex items-center gap-1.5 text-rose-400 font-mono ${sizeClasses}`}>
          {showIcon && <XCircle size={iconSize} className="text-rose-400 shrink-0" />}
          <span>Offline</span>
        </span>
      );
    case 'degraded':
      return (
        <span className={`inline-flex items-center gap-1.5 text-amber-400 font-mono ${sizeClasses}`}>
          {showIcon && <AlertTriangle size={iconSize} className="text-amber-400 shrink-0" />}
          <span>Degraded</span>
        </span>
      );
    case 'unknown':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 text-slate-400 font-mono ${sizeClasses}`}>
          {showIcon && <HelpCircle size={iconSize} className="text-slate-400 shrink-0" />}
          <span>Unknown</span>
        </span>
      );
  }
};

interface SeverityBadgeProps {
  severity: EventSeverity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm font-medium';
  const iconSize = size === 'sm' ? 13 : 15;

  switch (severity) {
    case 'critical':
      return (
        <span className={`inline-flex items-center gap-1.5 text-rose-400 font-mono ${sizeClasses}`}>
          <AlertOctagon size={iconSize} className="text-rose-400 shrink-0" />
          <span>CRITICAL</span>
        </span>
      );
    case 'warning':
      return (
        <span className={`inline-flex items-center gap-1.5 text-amber-400 font-mono ${sizeClasses}`}>
          <AlertTriangle size={iconSize} className="text-amber-400 shrink-0" />
          <span>WARNING</span>
        </span>
      );
    case 'info':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 text-sky-400 font-mono ${sizeClasses}`}>
          <Info size={iconSize} className="text-sky-400 shrink-0" />
          <span>INFO</span>
        </span>
      );
  }
};
