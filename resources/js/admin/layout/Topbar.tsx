import { Moon, Search, Sun } from 'lucide-react';
import { useConfig } from '../lib/hooks/useConfig';
import { useTheme } from '../lib/hooks/useTheme';
import { t } from '../lib/i18n';

interface TopbarProps {
  crumb: string;
  onOpenPalette: () => void;
}

export function Topbar({ crumb, onOpenPalette }: TopbarProps) {
  const { appName } = useConfig();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-surface px-6">
      <nav aria-label="Percorso" className="flex items-center gap-2 text-[13px] text-ink-subtle">
        <span>{appName}</span>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-ink">{crumb}</span>
      </nav>

      <button
        type="button"
        onClick={onOpenPalette}
        className="ml-auto flex h-8 min-w-[220px] cursor-pointer items-center gap-2 rounded-[6px] border border-border bg-canvas px-2.5 text-[13px] text-ink-subtle transition-colors duration-150 ease-out hover:border-border-strong hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Search className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        {t.app.search}
        <kbd className="ml-auto rounded-[4px] border border-border px-1.5 py-px font-mono text-[11px]">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-label={t.app.theme}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[6px] border border-border bg-surface text-ink-muted transition-colors duration-150 ease-out hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {theme === 'light' ? (
          <Sun className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Moon className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
    </header>
  );
}
