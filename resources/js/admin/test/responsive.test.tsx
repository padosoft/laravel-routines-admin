import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './harness';
import { DataTable, type Column } from '../components/DataTable';
import { RoutinesScreen } from '../features/routines/RoutinesScreen';
import { RunsScreen } from '../features/runs/RunsScreen';
import { Sidebar } from '../layout/Sidebar';

/**
 * L'adattamento al telefono si rompe IN SILENZIO in due modi opposti, e sono entrambi qui.
 *
 * Il primo è la tabella: sette colonne su 375px non danno un errore, danno una griglia
 * illeggibile che nessuno segnala perché «il pannello si usa dal computer».
 *
 * Il secondo è più insidioso ed è quello che questa suite ha effettivamente trovato: la
 * sidebar è un cassetto solo sotto `lg`, ma `open` resta `false` anche sul desktop, dove il
 * pannello è sempre visibile. Legare `inert` a `open` rendeva la navigazione inerte —
 * cliccabile a occhio, morta al tocco e alla tastiera — sull'unico schermo da cui la si usa.
 */

/** Rimpiazza `matchMedia` con una finestra di larghezza nota. */
function setViewport(width: number): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const min = /min-width:\s*(\d+)px/.exec(query);
      return {
        matches: min === null ? false : width >= Number(min[1]),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      };
    },
  });
}

interface Row {
  id: string;
  name: string;
  cost: string;
}

const COLUMNS: Array<Column<Row>> = [
  { key: 'name', header: 'Nome', width: 'minmax(200px,1fr)', render: (r) => r.name },
  {
    key: 'cost',
    header: 'Costo',
    width: '90px',
    hideOnNarrow: true,
    render: (r) => r.cost,
  },
];

const ROWS: Row[] = [{ id: '1', name: 'Solleciti fatture', cost: '€ 0,04' }];

function table() {
  return (
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      rowKey={(r) => r.id}
      caption="Routine"
    />
  );
}

describe('la tabella su schermo stretto', () => {
  it('smonta le colonne secondarie invece di comprimerle', () => {
    setViewport(375);
    renderWithProviders(table());

    expect(screen.getByText('Solleciti fatture')).toBeInTheDocument();
    // Non «non si vede»: non c'è. Una colonna nascosta con `hidden` resterebbe nel DOM e
    // uno screen reader la leggerebbe comunque, riga per riga, come rumore.
    expect(screen.queryByText('€ 0,04')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Costo' })).not.toBeInTheDocument();
  });

  it('le riporta tutte appena c’è spazio', () => {
    setViewport(1440);
    renderWithProviders(table());

    expect(screen.getByText('€ 0,04')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Costo' })).toBeInTheDocument();
  });
});

describe('la sidebar', () => {
  beforeEach(() => {
    // Le query della sidebar (capabilities, attesa, salute) non sono l'oggetto del test:
    // restano senza risposta e il componente rende comunque i suoi `—`.
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sul desktop è navigabile anche se il cassetto non è «aperto»', () => {
    setViewport(1440);
    const { container } = renderWithProviders(<Sidebar open={false} onNavigate={() => {}} />);

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.hasAttribute('inert')).toBe(false);
    expect(screen.getByRole('link', { name: /Routine/ })).toBeInTheDocument();
  });

  it('sul telefono, chiusa, è fuori dal giro del tab', () => {
    setViewport(375);
    const { container } = renderWithProviders(<Sidebar open={false} onNavigate={() => {}} />);

    expect(container.querySelector('aside')?.hasAttribute('inert')).toBe(true);
  });

  it('sul telefono, aperta, torna raggiungibile', () => {
    setViewport(375);
    const { container } = renderWithProviders(<Sidebar open onNavigate={() => {}} />);

    expect(container.querySelector('aside')?.hasAttribute('inert')).toBe(false);
  });
});

/**
 * La larghezza minima incomprimibile di una griglia.
 *
 * `minmax(220px,1fr)` sembra flessibile e non lo e': il minimo NON cede, e le colonne che
 * vengono dopo finiscono oltre il bordo destro — non tagliate, proprio irraggiungibili.
 * E' successo davvero: la prima versione dell'adattamento mobile aveva il bottone «esegui
 * ora» fuori schermo, e il difetto si e' visto solo fotografando il pannello, perche' nel
 * DOM il bottone c'e' e ogni asserzione su di esso passa.
 */
function rigidWidth(template: string): number {
  let total = 0;

  // `minmax(220px,1fr)` → 220 (il minimo e' il pavimento). `minmax(0,1fr)` → 0.
  for (const [, min] of template.matchAll(/minmax\(\s*(\d+)px/g)) {
    total += Number(min);
  }

  // Le larghezze fisse fuori da un minmax: `132px`, `44px`, …
  for (const [, px] of template.replace(/minmax\([^)]*\)/g, '').matchAll(/(\d+)px/g)) {
    total += Number(px);
  }

  return total;
}

function templateOf(container: HTMLElement): string {
  const header = container.querySelector('thead tr');
  return (header as HTMLElement | null)?.style.gridTemplateColumns ?? '';
}

describe('la griglia delle tabelle su un telefono', () => {
  // 390px e' un iPhone 15; tolti i 16px di padding della pagina, i 24px della tabella e i
  // gap fra le colonne resta questo. Sopra questa soglia qualcosa esce dal bordo destro.
  const BUDGET = 320;

  beforeEach(() => {
    setViewport(375);
    // Una riga sola basta: la griglia e' definita dalle colonne, non dai dati. Serve pero'
    // che la query risolva, altrimenti lo schermo mostra lo scheletro e la `<thead>` non c'e'.
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: [],
              meta: { total: 0, per_page: 25, next_cursor: null },
            }),
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('l’elenco routine ci sta, comando compreso', async () => {
    const { container } = renderWithProviders(<RoutinesScreen />);
    await screen.findByRole('table');
    const template = templateOf(container);

    expect(template).not.toBe('');
    expect(rigidWidth(template)).toBeLessThanOrEqual(BUDGET);
  });

  it('il ledger delle esecuzioni ci sta', async () => {
    const { container } = renderWithProviders(<RunsScreen />);
    await screen.findByRole('table');
    const template = templateOf(container);

    expect(template).not.toBe('');
    expect(rigidWidth(template)).toBeLessThanOrEqual(BUDGET);
  });
});
