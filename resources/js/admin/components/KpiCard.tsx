import { Card } from './Card';

interface KpiCardProps {
  label: string;
  value: string;
  /** Variazione rispetto al periodo precedente: ▲ in `ok`, ▼ in `danger`. */
  delta?: { text: string; direction: 'up' | 'down' } | null;
  sub?: string | null;
  /** Barra di riempimento 3px, per il tetto di spesa. `0..1`. */
  bar?: number | null;
  tone?: 'default' | 'attention';
}

export function KpiCard({ label, value, delta = null, sub = null, bar = null, tone = 'default' }: KpiCardProps) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums ${
            tone === 'attention' ? 'text-attention' : ''
          }`}
        >
          {value}
        </span>
        {delta === null ? null : (
          <span
            className={`text-xs font-medium tabular-nums ${
              delta.direction === 'up' ? 'text-ok' : 'text-danger'
            }`}
          >
            {delta.direction === 'up' ? '▲' : '▼'} {delta.text}
          </span>
        )}
      </div>
      {sub === null ? null : <span className="text-xs text-ink-subtle">{sub}</span>}
      {bar === null ? null : (
        <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full bg-accent"
            style={{ width: `${Math.min(100, Math.max(0, bar * 100))}%` }}
          />
        </div>
      )}
    </Card>
  );
}
