import { useEffect, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './Button';
import { t } from '../lib/i18n';

export interface ConfirmParam {
  key: string;
  value: string;
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  /**
   * I parametri esatti dell'azione. Il secondo passo di una conferma non chiede «sei sicuro?»
   * — quella domanda non aggiunge informazione e si impara a cliccarci sopra. Ridice COSA
   * succederà, con i numeri davanti.
   */
  params?: ConfirmParam[];
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger' | 'attention';
  /** Testo che l'utente deve digitare per abilitare la conferma (azioni definitive). */
  typeToConfirm?: string | null;
  typeToConfirmLabel?: string;
  /** Motivo obbligatorio: il bottone resta spento finché è vuoto. */
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  pending?: boolean;
  error?: ReactNode;
  onConfirm: (reason: string) => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  params,
  confirmLabel,
  confirmVariant = 'primary',
  typeToConfirm = null,
  typeToConfirmLabel,
  requireReason = false,
  reasonLabel,
  reasonPlaceholder,
  pending = false,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');

  // Riaprire un dialogo non deve ereditare quello che si era scritto la volta prima: un motivo
  // rimasto in memoria finirebbe nel ledger attribuito all'azione sbagliata.
  useEffect(() => {
    if (open) {
      setReason('');
      setTyped('');
    }
  }, [open]);

  const typeSatisfied = typeToConfirm === null || typed.trim() === typeToConfirm;
  const reasonSatisfied = !requireReason || reason.trim() !== '';
  const canConfirm = typeSatisfied && reasonSatisfied && !pending;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-scrim" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[70] flex w-[520px] max-w-[calc(100vw-48px)] -translate-x-1/2 -translate-y-1/2 animate-rise-in flex-col gap-4 rounded-[12px] border border-border bg-surface p-6 shadow-card focus:outline-none">
          <div className="flex flex-col gap-1.5">
            <Dialog.Title
              className={`m-0 text-base font-semibold tracking-[-0.01em] ${
                confirmVariant === 'danger' ? 'text-danger' : ''
              }`}
            >
              {title}
            </Dialog.Title>
            <Dialog.Description className="m-0 max-w-[56ch] text-[13px] leading-relaxed text-ink-muted">
              {body}
            </Dialog.Description>
          </div>

          {params !== undefined && params.length > 0 ? (
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 rounded-lg border border-border bg-surface-muted px-4 py-3.5 text-xs">
              {params.map((p) => (
                <div key={p.key} className="contents">
                  <dt className="text-ink-subtle">{p.key}</dt>
                  <dd className="m-0 break-all font-mono tabular-nums">{p.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {requireReason ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">{reasonLabel}</span>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                className="resize-y rounded-[6px] border border-border bg-canvas px-2.5 py-2.5 text-[13px] text-ink outline-none focus:border-accent"
              />
            </label>
          ) : null}

          {typeToConfirm === null ? null : (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">
                {typeToConfirmLabel}{' '}
                <strong className="font-mono">{typeToConfirm}</strong>
              </span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="h-[34px] rounded-[6px] border border-border bg-canvas px-2.5 text-[13px] text-ink outline-none focus:border-danger"
              />
            </label>
          )}

          {error === undefined ? null : <div>{error}</div>}

          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary">{t.app.cancel}</Button>
            </Dialog.Close>
            <Button
              variant={confirmVariant === 'danger' ? 'danger' : confirmVariant}
              disabled={!canConfirm}
              onClick={() => onConfirm(reason.trim())}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
