import { useMemo, useState } from 'react';
import type { TimelinePoint } from '../../lib/api/types';
import { t } from '../../lib/i18n';

type Series = 'paused' | 'failed' | 'skipped' | 'succeeded';

/** Ordine dall'alto: quello che richiede una persona sta in cima, dove si guarda per primo. */
const SERIES: Array<{ key: Series; label: string; bg: string; swatch: string }> = [
  { key: 'paused', label: t.outcome.paused, bg: 'bg-attention', swatch: 'bg-attention' },
  { key: 'failed', label: t.outcome.failed, bg: 'bg-danger', swatch: 'bg-danger' },
  { key: 'skipped', label: t.outcome.skipped, bg: 'bg-idle', swatch: 'bg-idle' },
  { key: 'succeeded', label: t.outcome.succeeded, bg: 'bg-ok', swatch: 'bg-ok' },
];

const CHART_HEIGHT = 132;
/**
 * Nessun segmento presente scende sotto 3px.
 *
 * Senza questo, due fire in attesa dentro una giornata da quattrocento sparirebbero
 * nell'arrotondamento — e sono esattamente i due che qualcuno deve vedere. Il grafico
 * perde un po' di proporzione e guadagna l'unica cosa per cui lo si guarda.
 */
const MIN_VISIBLE = 3;

interface RunTimelineProps {
  points: TimelinePoint[];
  locale: string;
}

export function RunTimeline({ points, locale }: RunTimelineProps) {
  const [hidden, setHidden] = useState<Partial<Record<Series, boolean>>>({});

  const max = useMemo(
    () =>
      Math.max(
        1,
        ...points.map((p) => p.succeeded + p.failed + p.skipped + p.paused),
      ),
    [points],
  );

  const dayLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(iso));

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="rounded-[10px] border border-border bg-surface p-5 shadow-card">
      <div className="mb-[18px] flex items-center">
        <h2 className="m-0 font-sans text-[13px] font-semibold">{t.overview.timeline}</h2>
        <div className="ml-auto flex gap-3.5">
          {SERIES.map((series) => {
            const off = hidden[series.key] === true;
            return (
              <button
                key={series.key}
                type="button"
                aria-pressed={!off}
                onClick={() =>
                  setHidden((current) => ({ ...current, [series.key]: !current[series.key] }))
                }
                className={`flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs text-ink-muted transition-opacity duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  off ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <span className={`size-2 rounded-[2px] ${series.swatch}`} aria-hidden="true" />
                {series.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-[140px] items-end gap-[3px]">
        {points.map((point) => {
          const total = point.succeeded + point.failed + point.skipped + point.paused;
          return (
            <div
              key={point.date}
              className="flex h-full flex-1 cursor-default flex-col justify-end gap-px hover:opacity-75"
              title={`${dayLabel(point.date)} · ${point.succeeded} ${t.outcome.succeeded.toLowerCase()} · ${point.failed} ${t.outcome.failed.toLowerCase()} · ${point.skipped} ${t.outcome.skipped.toLowerCase()} · ${point.paused} ${t.outcome.paused.toLowerCase()}`}
            >
              {SERIES.map((series) => {
                const value = point[series.key];
                const visible = value > 0 && hidden[series.key] !== true;
                const height = visible
                  ? Math.max(MIN_VISIBLE, Math.round((value / max) * CHART_HEIGHT))
                  : 0;
                return (
                  <div
                    key={series.key}
                    className={`${series.bg} ${series.key === 'paused' ? 'rounded-t-[2px]' : ''}`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
              {total === 0 ? <div className="h-px bg-border" /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-subtle">
        <span>{first === undefined ? '' : dayLabel(first.date)}</span>
        <span>{last === undefined ? '' : dayLabel(last.date)}</span>
      </div>
    </div>
  );
}
