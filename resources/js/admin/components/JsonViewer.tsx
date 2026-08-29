import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface JsonViewerProps {
  label: string;
  value: Record<string, unknown> | null;
}

/**
 * Collassato di default: il `metadata` di un fire è utile a chi lo sta cercando, e ingombrante
 * per chiunque altro stia scorrendo il pannello di corsa.
 */
export function JsonViewer({ label, value }: JsonViewerProps) {
  const [open, setOpen] = useState(false);

  if (value === null || Object.keys(value).length === 0) {
    return null;
  }

  const serialised = JSON.stringify(value, null, 2);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {open ? (
            <ChevronDown className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ChevronRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          )}
          {label}
        </button>
        <CopyButton value={serialised} label={`Copia ${label}`} />
      </div>
      {open ? (
        <pre className="m-0 max-h-80 overflow-auto rounded-lg border border-border bg-surface-muted p-3 font-mono text-[11.5px] leading-relaxed text-ink-muted">
          {serialised}
        </pre>
      ) : null}
    </div>
  );
}
