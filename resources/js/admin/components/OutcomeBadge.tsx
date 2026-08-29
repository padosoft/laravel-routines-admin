import type { RunOutcome } from '../lib/api/types';
import { t } from '../lib/i18n';

/**
 * L'esito di un FIRE. Unica fonte della mappa esito→colore.
 *
 * `outcome === null` significa in corso, e prende l'accento con una pulsazione: è l'unico stato
 * che cambierà da solo mentre lo guardi.
 *
 * `paused` è viola perché non è un esito come gli altri — è una domanda rivolta a una persona, ed
 * è l'unica cosa in tutto il pannello che merita il colore di richiamo.
 */
const TONE: Record<RunOutcome | 'running', { bg: string; text: string; label: string }> = {
  succeeded: { bg: 'bg-ok-subtle', text: 'text-ok', label: t.outcome.succeeded },
  failed: { bg: 'bg-danger-subtle', text: 'text-danger', label: t.outcome.failed },
  skipped: { bg: 'bg-idle-subtle', text: 'text-idle', label: t.outcome.skipped },
  paused: { bg: 'bg-attention-subtle', text: 'text-attention', label: t.outcome.paused },
  running: { bg: 'bg-accent-subtle', text: 'text-accent', label: t.outcome.running },
};

export function outcomeKey(outcome: RunOutcome | null): RunOutcome | 'running' {
  return outcome ?? 'running';
}

interface OutcomeBadgeProps {
  outcome: RunOutcome | null;
  /** Il pallino serve solo dove il movimento aiuta: in tabella sì, in una riga di riepilogo no. */
  withDot?: boolean;
}

export function OutcomeBadge({ outcome, withDot = false }: OutcomeBadgeProps) {
  const key = outcomeKey(outcome);
  const tone = TONE[key];

  return (
    <span
      className={`inline-flex w-fit items-center gap-[5px] rounded-[4px] px-[7px] py-[2px] text-[11px] font-medium ${tone.bg} ${tone.text}`}
    >
      {withDot ? (
        <span
          className={`size-[6px] rounded-full bg-current ${key === 'running' ? 'animate-pulse-dot' : ''}`}
          aria-hidden="true"
        />
      ) : null}
      {tone.label}
    </span>
  );
}
