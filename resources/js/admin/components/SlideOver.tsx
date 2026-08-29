import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { t } from '../lib/i18n';

interface SlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  header: ReactNode;
  children: ReactNode;
}

/**
 * Pannello destro 520px. Radix porta focus trap, `Esc` e ritorno del focus all'elemento che
 * l'ha aperto — cose che si notano solo quando mancano, e allora si notano molto.
 */
export function SlideOver({ open, onOpenChange, label, header, children }: SlideOverProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-scrim" />
        <Dialog.Content
          aria-label={label}
          className="fixed right-0 top-0 z-[60] flex h-full w-[520px] max-w-[92vw] animate-rise-in flex-col overflow-auto border-l border-border bg-surface focus:outline-none"
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface px-5 py-4">
            {header}
            <Dialog.Close
              aria-label={t.app.close}
              className="ml-auto inline-flex size-7 cursor-pointer items-center justify-center rounded-[6px] border border-border text-ink-muted transition-colors duration-150 ease-out hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <X className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-[18px] p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
