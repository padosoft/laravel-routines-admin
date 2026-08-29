import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast, type ToastEntry, type ToastTone } from '../lib/hooks/useToast';
import { t } from '../lib/i18n';

const TONE: Record<ToastTone, string> = {
  ok: 'border-l-ok',
  danger: 'border-l-danger',
  accent: 'border-l-accent',
  attention: 'border-l-attention',
  idle: 'border-l-idle',
};

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 7000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex max-w-[440px] animate-rise-in items-center gap-4 rounded-[10px] border border-border border-l-[3px] bg-surface px-[18px] py-3.5 shadow-card ${TONE[toast.tone ?? 'ok']}`}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-semibold">{toast.title}</span>
        {toast.detail === undefined ? null : (
          <span className="truncate font-mono text-xs text-ink-muted">{toast.detail}</span>
        )}
      </div>
      {toast.action === undefined ? null : (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="ml-auto shrink-0 cursor-pointer border-0 bg-transparent text-[13px] font-medium text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label={t.app.close}
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 cursor-pointer border-0 bg-transparent text-ink-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

/** In basso a destra, impilabili. `polite`: informano, non interrompono. */
export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-2"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
