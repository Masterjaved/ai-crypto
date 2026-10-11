import { cn, formatPrice, formatPercent } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  change?: number;
  changePercent?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showChange?: boolean;
  className?: string;
}

export function PriceDisplay({
  price, changePercent, size = 'md', showChange = true, className
}: PriceDisplayProps) {
  const isPositive = (changePercent ?? 0) >= 0;

  const sizeClasses = {
    sm: 'text-sm font-mono',
    md: 'text-lg font-mono font-semibold',
    lg: 'text-2xl font-mono font-bold',
    xl: 'text-4xl font-mono font-bold',
  }[size];

  const changeSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  }[size];

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn('text-white', sizeClasses)}>
        ${formatPrice(price)}
      </span>
      {showChange && changePercent !== undefined && (
        <span className={cn(
          changeSizeClasses,
          'font-mono font-semibold px-2 py-0.5 rounded-md flex items-center gap-1',
          isPositive
            ? 'text-green-400 bg-green-500/10 border border-green-500/20'
            : 'text-red-400 bg-red-500/10 border border-red-500/20'
        )}>
          <span>{isPositive ? '▲' : '▼'}</span>
          <span>{formatPercent(changePercent)}</span>
        </span>
      )}
    </div>
  );
}
