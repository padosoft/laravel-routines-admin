import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from './harness';
import { AwaitingBanner } from '../features/overview/AwaitingBanner';
import { RunTimeline } from '../features/overview/RunTimeline';
import { StatusDot } from '../components/StatusDot';
import { OutcomeBadge } from '../components/OutcomeBadge';
import type { TimelinePoint } from '../lib/api/types';

/**
 * Le regole del design che, rompendosi, si rompono IN SILENZIO: la pagina continua a
 * renderizzare, nessuno vede un errore, e l'informazione che conta sparisce.
 */

describe('la fascia «in attesa»', () => {
  it('a zero non esiste — nessun riquadro verde «tutto ok» al suo posto', () => {
    // Un riquadro che compare sempre smette di essere letto; uno che compare solo quando c'è
    // qualcosa da fare resta la prima cosa che si guarda per anni.
    const { container } = renderWithProviders(
      <AwaitingBanner count={0} oldestSince={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('sopra zero dice quante sono e da quanto aspetta la più vecchia', () => {
    renderWithProviders(
      <AwaitingBanner count={3} oldestSince={new Date(Date.now() - 6 * 3600_000).toISOString()} />,
    );

    expect(screen.getByText(/3 routine sono ferme/)).toBeInTheDocument();
    expect(screen.getByText(/La più vecchia da 6 h/)).toBeInTheDocument();
  });
});

describe('la mappa stato → colore', () => {
  it('non chiama «in pausa» sia una routine sia un fire fermo', () => {
    // Sono cose diverse: la prima è una scelta di chi la possiede, il secondo una domanda
    // rivolta a una persona. Fonderle toglierebbe proprio la distinzione che serve.
    const routine = renderWithProviders(<StatusDot status="paused" />);
    expect(routine.getByText('In pausa')).toBeInTheDocument();
    routine.unmount();

    const run = renderWithProviders(<OutcomeBadge outcome="paused" />);
    expect(run.getByText('In attesa')).toBeInTheDocument();
    expect(run.queryByText('In pausa')).not.toBeInTheDocument();
  });

  it('mostra la frase del server per una routine sospesa, mai lo slug', () => {
    renderWithProviders(
      <StatusDot
        status="suspended"
        title="Il bersaglio «flow» non è più installato, quindi questa routine non può essere eseguita."
      />,
    );

    const badge = screen.getByTitle(/non è più installato/);
    expect(badge).toBeInTheDocument();
    expect(badge.getAttribute('title')).not.toContain('target_not_registered');
  });

  it('accompagna sempre il colore con un’etichetta', () => {
    // Il colore non è mai l'unica informazione: chi non lo distingue legge comunque lo stato.
    const { container } = renderWithProviders(<StatusDot status="active" />);
    expect(container.textContent?.trim()).toBe('Attiva');
  });
});

describe('la timeline delle esecuzioni', () => {
  const point = (paused: number, succeeded: number): TimelinePoint => ({
    date: '2026-08-29',
    succeeded,
    failed: 0,
    skipped: 0,
    paused,
  });

  it('tiene visibile il segmento viola anche quando è schiacciato dai numeri grandi', () => {
    // Due fire in attesa dentro una giornata da quattrocento sparirebbero
    // nell'arrotondamento — e sono esattamente i due che qualcuno deve vedere.
    const { container } = renderWithProviders(
      <RunTimeline points={[point(2, 400)]} locale="it-IT" />,
    );

    const day = container.querySelector('[title]');
    const segments = day === null ? [] : Array.from(day.querySelectorAll('div'));
    const pausedHeight = segments[0]?.getAttribute('style') ?? '';

    expect(pausedHeight).toContain('3px');
  });

  it('non disegna niente per una serie a zero', () => {
    const { container } = renderWithProviders(
      <RunTimeline points={[point(0, 10)]} locale="it-IT" />,
    );

    const day = container.querySelector('[title]');
    const segments = day === null ? [] : Array.from(day.querySelectorAll('div'));
    expect(segments[0]?.getAttribute('style')).toContain('0px');
  });

  it('spegne una serie quando si clicca la sua voce di legenda', () => {
    const { container } = renderWithProviders(
      <RunTimeline points={[point(5, 10)]} locale="it-IT" />,
    );

    const legend = screen.getByRole('button', { name: 'In attesa' });
    expect(legend).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(legend);
    expect(screen.getByRole('button', { name: 'In attesa' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    const day = container.querySelector('[title]');
    const segments = day === null ? [] : Array.from(day.querySelectorAll('div'));
    expect(segments[0]?.getAttribute('style')).toContain('0px');
  });

  it('elenca le serie con «in attesa» in cima', () => {
    // L'ordine non è estetico: la serie che richiede una persona sta dove si guarda per primo.
    renderWithProviders(<RunTimeline points={[point(1, 1)]} locale="it-IT" />);

    const legend = screen.getAllByRole('button');
    expect(within(legend[0] as HTMLElement).getByText('In attesa')).toBeInTheDocument();
  });
});
