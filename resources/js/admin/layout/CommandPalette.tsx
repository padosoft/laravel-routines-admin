import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router-dom';
import { useRoutines } from '../lib/api/queries';
import { t } from '../lib/i18n';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGES = [
  { to: '/', label: t.nav.overview },
  { to: '/routines', label: t.nav.routines },
  { to: '/attention', label: t.nav.attention },
  { to: '/runs', label: t.nav.runs },
  { to: '/health', label: t.nav.health },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  // Le routine servono solo quando la palette è aperta: caricarle sempre sarebbe una lista
  // scaricata a ogni visita per una ricerca che quasi nessuno apre.
  const { data } = useRoutines(open ? { q: query } : {});

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pages = PAGES.filter((p) => needle === '' || p.label.toLowerCase().includes(needle)).map(
      (p) => ({ kind: t.palette.pages, label: p.label, to: p.to }),
    );
    const routines = (data?.data ?? [])
      .slice(0, 8)
      .map((r) => ({ kind: t.palette.routines, label: r.name, to: `/routines/${r.id}` }));
    return [...pages, ...routines];
  }, [query, data]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery('');
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-scrim" />
        <Dialog.Content
          aria-label={t.palette.label}
          className="fixed left-1/2 top-[14vh] z-[80] w-[560px] max-w-[92vw] -translate-x-1/2 animate-rise-in overflow-hidden rounded-[12px] border border-border bg-surface shadow-card focus:outline-none"
        >
          <Dialog.Title className="sr-only">{t.palette.label}</Dialog.Title>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.app.searchPlaceholder}
            aria-label={t.palette.label}
            className="h-12 w-full border-0 border-b border-border bg-surface px-[18px] text-sm text-ink outline-none"
          />
          <ul className="m-0 max-h-[50vh] list-none overflow-auto p-0">
            {results.length === 0 ? (
              <li className="px-[18px] py-4 text-[13px] text-ink-muted">{t.palette.noResults}</li>
            ) : (
              results.map((result) => (
                <li key={`${result.kind}-${result.to}`}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(result.to);
                      onOpenChange(false);
                      setQuery('');
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-border bg-surface px-[18px] py-[11px] text-left hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                  >
                    <span className="w-[70px] shrink-0 font-mono text-[11px] text-ink-subtle">
                      {result.kind}
                    </span>
                    <span className="truncate text-[13px]">{result.label}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
