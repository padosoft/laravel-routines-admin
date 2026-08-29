import { Pause } from 'lucide-react';
import type { Run } from '../../lib/api/types';
import { Button } from '../../components/Button';
import { useConfig } from '../../lib/hooks/useConfig';
import { formatDateTime, formatElapsed } from '../../lib/format/date';
import { t } from '../../lib/i18n';

interface AttentionCardProps {
  run: Run;
  canApprove: boolean;
  deniedReason: string;
  onApprove: (run: Run) => void;
  onReject: (run: Run) => void;
}

/**
 * Non è una riga di tabella: è una richiesta.
 *
 * Una tabella invita a scorrere; questa card invita a leggere e rispondere, che è l'unica cosa
 * che si può fare qui. Il messaggio arriva dal server e si mostra com'è: è la frase che il
 * bersaglio ha scritto per il proprietario, e ricomporla qui vorrebbe dire riscrivere una prova.
 */
export function AttentionCard({
  run,
  canApprove,
  deniedReason,
  onApprove,
  onReject,
}: AttentionCardProps) {
  const { locale, timezone } = useConfig();

  return (
    <article className="flex animate-rise-in flex-col gap-3.5 rounded-[10px] border border-border border-l-[3px] border-l-attention bg-surface p-5 shadow-card">
      <header className="flex items-center gap-2.5">
        <Pause className="size-4 shrink-0 text-attention" strokeWidth={1.75} aria-hidden="true" />
        <h2 className="m-0 font-sans text-[15px] font-semibold tracking-[-0.01em]">
          {run.routine_name}
        </h2>
        <span className="ml-auto shrink-0 text-xs font-medium tabular-nums text-attention">
          {t.attention.stoppedFor(formatElapsed(run.started_at))}
        </span>
      </header>

      <p className="m-0 max-w-[62ch] text-sm leading-[1.55] text-ink">{run.message}</p>

      <dl className="m-0 grid w-fit grid-cols-[auto_1fr] gap-x-7 gap-y-1.5 text-xs sm:grid-cols-[auto_1fr_auto_1fr]">
        <dt className="text-ink-subtle">{t.attention.actionClass}</dt>
        <dd className="m-0 font-mono">{run.action_class ?? '—'}</dd>
        <dt className="text-ink-subtle">{t.attention.fire}</dt>
        <dd className="m-0 font-mono">{run.id}</dd>
        <dt className="text-ink-subtle">{t.attention.owner}</dt>
        <dd className="m-0">{run.owner_label ?? '—'}</dd>
        <dt className="text-ink-subtle">{t.attention.at}</dt>
        <dd className="m-0 tabular-nums">
          {formatDateTime(run.started_at, { locale, timeZone: timezone })}
        </dd>
      </dl>

      <footer className="flex justify-end gap-2 border-t border-border pt-3.5">
        <Button
          variant="secondary"
          disabled={!canApprove}
          title={canApprove ? undefined : deniedReason}
          onClick={() => onReject(run)}
        >
          {t.attention.reject}
        </Button>
        <Button
          variant="attention"
          disabled={!canApprove}
          title={canApprove ? undefined : deniedReason}
          onClick={() => onApprove(run)}
        >
          {t.attention.approve}
        </Button>
      </footer>
    </article>
  );
}
