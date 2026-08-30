import { Menu, Moon, Search, Sun } from 'lucide-react';
import { useConfig } from '../lib/hooks/useConfig';
import { useTheme } from '../lib/hooks/useTheme';
import { t } from '../lib/i18n';

interface TopbarProps {
  crumb: string;
  onOpenPalette: () => void;
  /** Apre la sidebar come cassetto. Sopra `lg` il bottone non c'è: la sidebar è già lì. */
  onOpenNav: () => void;
}

export function Topbar({ crumb, onOpenPalette, onOpenNav }: TopbarProps) {
  const { appName } = useConfig();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-surface px-4 sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label={t.nav.openMenu}
        className="-ml-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-border bg-surface text-ink-muted transition-colors duration-150 ease-out hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:hidden"
      >
        <Menu className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
      </button>

      <nav
        aria-label="Percorso"
        className="flex min-w-0 items-center gap-2 text-[13px] text-ink-subtle"
      >
        {/*
          Il nome dell'applicazione è contesto, non contenuto: su un telefono cede il posto alla
          pagina in cui ci si trova, che è l'unica metà del percorso che serve davvero lì.
        */}
        <span className="hidden sm:inline">{appName}</span>
        <span aria-hidden="true" className="hidden sm:inline">
          /
        </span>
        <span className="truncate font-medium text-ink">{crumb}</span>
      </nav>

      <button
        type="button"
        onClick={onOpenPalette}
        aria-label={t.app.search}
        className="ml-auto flex size-8 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-border bg-canvas text-[13px] text-ink-subtle transition-colors duration-150 ease-out hover:border-border-strong hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:size-auto md:min-w-[220px] md:justify-start md:px-2.5"
      >
        <Search className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {/*
          Sotto `md` resta la sola lente: la scorciatoia ⌘K non esiste su un telefono, e la
          didascalia che la annuncia occuperebbe metà della barra per non dire niente.
          L'`aria-label` sul bottone tiene il nome dell'azione per chi non vede l'icona.
        */}
        <span className="hidden md:inline">{t.app.search}</span>
        <kbd className="ml-auto hidden rounded-[4px] border border-border px-1.5 py-px font-mono text-[11px] md:inline">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-label={t.app.theme}
        className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-border bg-surface text-ink-muted transition-colors duration-150 ease-out hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
