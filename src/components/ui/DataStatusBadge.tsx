import type { DataStatus } from '@/types';
import { cn } from '@/lib/utils';

interface DataStatusBadgeProps {
  status: DataStatus;
  lastUpdate?: number;
  source?: string;
  className?: string;
}

export function DataStatusBadge({ status, lastUpdate, source, className }: DataStatusBadgeProps) {
  const config = {
    live: {
      label: 'LIVE',
      classes: 'text-green-400 bg-green-500/10 border-green-500/20',
      dot: 'bg-green-400 pulse-dot',
    },
    delayed: {
      label: 'DELAYED',
      classes: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      dot: 'bg-yellow-400',
    },
    cached: {
      label: 'CACHED',
      classes: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      dot: 'bg-blue-400',
    },
    unavailable: {
      label: 'UNAVAILABLE',
      classes: 'text-red-400 bg-red-500/10 border-red-500/20',
      dot: 'bg-red-400',
    },
  }[status];

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-mono font-bold text-[11px]', config.classes)}>
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
        {config.label}
      </span>
      {source && (
        <span className="text-[#64748b] text-[11px]">via {source}</span>
      )}
      {lastUpdate && (
        <span className="text-[#64748b] text-[11px] font-mono">
          {new Date(lastUpdate).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
