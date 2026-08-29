import type { RoutineStatus } from '../lib/api/types';
import { t } from '../lib/i18n';

/**
 * Lo stato di una ROUTINE. Unica fonte della mappa stato→colore per le routine.
 *
 * `paused` e `suspended` sono grigio e giallo, e non è un dettaglio estetico: la prima è una
 * scelta di chi la possiede, la seconda una decisione del sistema che qualcuno deve risolvere.
 * Colorarle uguale toglierebbe proprio la differenza che conta.
 *
 * Il colore non è mai l'unica informazione: c'è sempre anche l'etichetta.
 */
const TONE: Record<RoutineStatus, { dot: string; text: string; label: string }> = {
  active: { dot: 'bg-accent', text: 'text-accent', label: t.status.active },
  paused: { dot: 'bg-idle', text: 'text-idle', label: t.status.paused },
  suspended: { dot: 'bg-warn', text: 'text-warn', label: t.status.suspended },
  ended: { dot: 'bg-idle', text: 'text-ink-subtle', label: t.status.ended },
};

interface StatusDotProps {
  status: RoutineStatus;
  /** Per `suspended`: la frase del server, mai lo slug. */
  title?: string | null;
}

export function StatusDot({ status, title }: StatusDotProps) {
  const tone = TONE[status];

  return (
    <span
      className={`inline-flex items-center gap-[7px] text-xs font-medium ${tone.text}`}
      title={title ?? tone.label}
    >
      <span className={`size-[7px] shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
      {tone.label}
    </span>
  );
}
