import { Search } from 'lucide-react';

export interface FilterChip {
  value: string;
  label: string;
}

interface FilterBarProps {
  search?: {
    value: string;
    placeholder: string;
    label: string;
    onChange: (value: string) => void;
  };
  chips: FilterChip[];
  active: string;
  onChipClick: (value: string) => void;
}

/**
 * I filtri vivono nella query string, non nello stato del componente: un elenco filtrato è un
 * indirizzo che si incolla in una chat, e ricaricare la pagina non deve azzerarlo.
 * Questo componente li mostra soltanto; chi lo usa li tiene nell'URL.
 */
export function FilterBar({ search, chips, active, onChipClick }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {search === undefined ? null : (
        <div className="flex h-8 min-w-[280px] items-center gap-2 rounded-[6px] border border-border bg-surface px-2.5 focus-within:border-border-strong">
          <Search className="size-3.5 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            value={search.value}
            aria-label={search.label}
            placeholder={search.placeholder}
            onChange={(e) => search.onChange(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-ink outline-none"
          />
        </div>
      )}
      {chips.map((chip) => {
        const on = chip.value === active;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChipClick(chip.value)}
            className={`h-8 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
              on
                ? 'border-accent bg-accent-subtle text-accent'
                : 'border-border bg-surface text-ink-muted hover:border-border-strong'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
