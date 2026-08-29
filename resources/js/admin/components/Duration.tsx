import { formatDuration } from '../lib/format/duration';

interface DurationProps {
  ms: number | null;
  className?: string;
}

export function Duration({ ms, className = '' }: DurationProps) {
  return <span className={`tabular-nums ${className}`}>{formatDuration(ms)}</span>;
}
