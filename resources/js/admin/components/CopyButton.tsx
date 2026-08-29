import { useCallback, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { t } from '../lib/i18n';

interface CopyButtonProps {
  value: string;
  label?: string;
}

/**
 * Il riscontro dura due secondi e poi torna com'era: un'icona che resta «copiato» per sempre
 * mente sulla prossima volta che ci si clicca sopra.
 */
export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Clipboard negata (contesto non sicuro, permesso rifiutato): il valore resta selezionabile.
      });
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? t.app.copy}
      title={copied ? t.app.copied : (label ?? t.app.copy)}
      className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-border text-ink-subtle transition-colors duration-150 ease-out hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      {copied ? (
        <Check className="size-3 text-ok" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Copy className="size-3" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
