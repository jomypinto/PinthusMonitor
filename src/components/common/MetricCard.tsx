import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  highlightColor?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose';
  progressPercent?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon,
  trend,
  highlightColor = 'default',
  progressPercent
}) => {
  const getBorderAccent = () => {
    switch (highlightColor) {
      case 'cyan': return 'hover:border-cyan-500/40';
      case 'emerald': return 'hover:border-emerald-500/40';
      case 'amber': return 'hover:border-amber-500/40';
      case 'rose': return 'hover:border-rose-500/40';
      default: return 'hover:border-slate-700';
    }
  };

  return (
    <div className={`p-4 bg-slate-900/80 border border-slate-800 rounded-lg transition-colors ${getBorderAccent()}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-medium tracking-wide uppercase text-slate-400 text-[11px]">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-slate-100 font-mono tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
      </div>

      {progressPercent !== undefined && (
        <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progressPercent > 85 ? 'bg-rose-500' : progressPercent > 70 ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}

      {(subtext || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          {subtext && <span>{subtext}</span>}
          {trend && (
            <span className={trend.direction === 'up' ? 'text-emerald-400 font-mono' : trend.direction === 'down' ? 'text-rose-400 font-mono' : 'text-slate-400 font-mono'}>
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
