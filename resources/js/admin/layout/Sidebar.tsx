import { NavLink } from 'react-router-dom';
import { Activity, Clock, HeartPulse, LayoutGrid, ListOrdered, Pause } from 'lucide-react';
import { useAttention, useCapabilities, useHealth } from '../lib/api/queries';
import { useConfig } from '../lib/hooks/useConfig';
import { DESKTOP, useMediaQuery } from '../lib/hooks/useMediaQuery';
import { formatSeconds } from '../lib/format/date';
import { t } from '../lib/i18n';

const ITEMS = [
  { to: '/', label: t.nav.overview, Icon: LayoutGrid, end: true },
  { to: '/routines', label: t.nav.routines, Icon: ListOrdered, end: false },
  { to: '/attention', label: t.nav.attention, Icon: Pause, end: false },
  { to: '/runs', label: t.nav.runs, Icon: Activity, end: false },
  { to: '/health', label: t.nav.health, Icon: HeartPulse, end: false },
] as const;

interface SidebarProps {
  /** Aperta come drawer sotto `lg`. Sopra `lg` la sidebar e' sempre visibile e questo e' ignorato. */
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { timezone } = useConfig();
  const isDesktop = useMediaQuery(DESKTOP);
  const { data: capabilities } = useCapabilities();
  const { data: attention } = useAttention();
  const { data: health } = useHealth();

  const awaiting = attention?.length ?? 0;

  return (
    <aside
      // Sotto `lg` è un pannello fuori schermo che entra da sinistra; sopra torna una colonna
      // normale del layout — e lì `open` non conta, perché non si chiude mai.
      //
      // `inert` solo quando è davvero fuori schermo: una voce di menu invisibile ma raggiungibile
      // col tab è peggio che assente, perché il focus sparisce senza spiegazione. Per questo la
      // decisione passa da `matchMedia` e non da una classe: `lg:translate-x-0` sposta il
      // pannello, ma non direbbe nulla a `inert`.
      inert={isDesktop || open ? undefined : true}
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-150 ease-out lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
        open ? 'translate-x-0 shadow-card' : '-translate-x-full'
      }`}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <span className="flex size-[22px] items-center justify-center rounded-[6px] bg-accent">
          <Clock className="size-[13px] text-on-accent" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="font-semibold tracking-[-0.01em]">{t.app.title}</span>
      </div>

      <nav aria-label={t.nav.section} className="flex flex-col gap-0.5 px-2.5 py-3">
        {ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-[6px] px-2.5 py-[7px] text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                isActive
                  ? 'bg-accent-subtle text-accent'
                  : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
              }`
            }
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {label}
            {/*
              L'unico badge numerico della navigazione, e a zero SPARISCE.
              Un contatore che mostra «0» insegna a ignorarlo, e il giorno che segna 3 nessuno
              lo guarda più. `assertive` perché è l'unica cosa qui che vale un'interruzione.
            */}
            {to === '/attention' && awaiting > 0 ? (
              <span
                aria-live="assertive"
                aria-label={t.nav.awaitingCount(awaiting)}
                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-attention px-1.5 text-[11px] font-semibold tabular-nums text-surface"
              >
                {awaiting}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-[3px] border-t border-border px-5 py-3.5 font-mono text-[11px] text-ink-subtle">
        <span>
          {capabilities === undefined ? '—' : `v${capabilities.version}`} · {timezone}
        </span>
        <span>
          {health?.tick_age_seconds === null || health?.tick_age_seconds === undefined
            ? '—'
            : `tick ${formatSeconds(health.tick_age_seconds)} fa`}
        </span>
      </div>
    </aside>
  );
}
