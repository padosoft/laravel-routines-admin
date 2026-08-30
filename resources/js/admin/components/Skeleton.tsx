import type { CSSProperties } from 'react';
import { useMediaQuery, WIDE_TABLE } from '../lib/hooks/useMediaQuery';

/**
 * Scheletri della FORMA del contenuto atteso, non un blocco unico.
 *
 * Un rettangolo grigio dice «sto caricando»; una griglia di quattro card seguita da barre e righe
 * dice anche «sta arrivando una panoramica», e quando arriva niente si sposta.
 */

function Bar({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse-dot rounded bg-surface-muted ${className}`} style={style} />;
}

export function SkeletonKpiRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2.5 rounded-[10px] border border-border bg-surface p-5"
        >
          <Bar className="h-[11px] w-24" />
          <Bar className="h-7 w-[70px]" />
          <Bar className="h-2.5 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="flex h-[180px] items-end gap-[3px] rounded-[10px] border border-border bg-surface p-5">
      {/* Altezze irregolari ma deterministiche: un istogramma piatto non somiglia a un istogramma. */}
      {Array.from({ length: 30 }, (_, i) => (
        <Bar key={i} className="flex-1 rounded-t" style={{ height: `${30 + ((i * 17) % 60)}%` }} />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 6, columns = 4 }: { count?: number; columns?: number }) {
  // Lo scheletro deve avere la forma di ciò che arriva: sullo schermo stretto la tabella
  // mostra poche colonne, e sette barrette da cinquanta pixel prometterebbero una griglia
  // che poi non compare. La promessa «quando arriva niente si sposta» vale anche qui.
  const isWide = useMediaQuery(WIDE_TABLE);
  const visible = isWide ? columns : Math.min(columns, 3);

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-surface">
      {Array.from({ length: count }, (_, row) => (
        <div
          key={row}
          className="grid items-center gap-4 border-b border-border px-5 py-3 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${visible}, 1fr)` }}
        >
          {Array.from({ length: visible }, (_, col) => (
            <Bar key={col} className="h-[11px]" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3.5 rounded-[10px] border border-border border-l-[3px] border-l-surface-muted bg-surface p-5"
        >
          <Bar className="h-4 w-56" />
          <Bar className="h-3 w-full max-w-[62ch]" />
          <Bar className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
