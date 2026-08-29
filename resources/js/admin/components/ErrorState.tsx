import { ApiError } from '../lib/api/client';
import { t } from '../lib/i18n';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

/**
 * L'errore del server, mostrato com'è.
 *
 * Il `detail` di un problem+json è già scritto per una persona: sostituirlo con «qualcosa è andato
 * storto» toglie l'unica frase che dice cosa fare dopo. Il codice resta in mono perché è quello
 * che si incolla in un ticket.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const api = error instanceof ApiError ? error : null;
  const status = api?.status ?? null;
  const title = api?.problem?.title ?? t.errors.title;
  const detail =
    api?.detail ??
    (error instanceof Error ? error.message : 'Errore sconosciuto.');

  return (
    <div
      role="alert"
      className="flex max-w-[640px] flex-col gap-3 rounded-[10px] border border-border border-l-[3px] border-l-danger bg-surface p-8 shadow-card"
    >
      {status === null ? null : (
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-danger">
          {status} · {api?.problem?.type.split('/').pop() ?? 'error'}
        </span>
      )}
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
      <p className="m-0 font-mono text-xs leading-relaxed text-ink-muted">{detail}</p>
      {onRetry === undefined ? null : (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 h-[34px] w-fit cursor-pointer rounded-[6px] bg-accent px-4 text-[13px] font-semibold text-on-accent transition-colors duration-150 ease-out hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {t.app.retry}
        </button>
      )}
    </div>
  );
}
