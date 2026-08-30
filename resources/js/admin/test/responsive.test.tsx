import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './harness';
import { DataTable, type Column } from '../components/DataTable';
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
