import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from './harness';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ApiClient, uuidV4 } from '../lib/api/client';

/**
 * Le guardie delle azioni che non si annullano. Ognuna qui esiste perché il suo fallimento
 * sarebbe silenzioso: il dialogo si aprirebbe uguale, il bottone si premerebbe uguale, e
 * qualcosa succederebbe senza che nessuno l'abbia deciso davvero.
 */

describe('la conferma di un’azione', () => {
  it('ridice cosa succederà con i parametri esatti, invece di chiedere «sei sicuro?»', () => {
    // «Sei sicuro?» non aggiunge informazione: si impara a cliccarci sopra in due giorni, e da
    // lì in poi la conferma non conferma più niente.
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Ecco cosa succederà"
        body="Vuole emettere un ordine da 1.240,00 € verso Fornitore SpA."
        params={[
          { key: 'Importo', value: '1.240,00 €' },
          { key: 'Tetto mandato', value: '500,00 € / esecuzione' },
        ]}
        confirmLabel="Approva ed esegui"
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByText('1.240,00 €')).toBeInTheDocument();
    expect(screen.getByText('500,00 € / esecuzione')).toBeInTheDocument();
    expect(screen.queryByText(/sei sicuro/i)).not.toBeInTheDocument();
  });

  it('tiene spento il rifiuto finché non c’è un motivo', () => {
    // Il motivo finisce nel ledger e qualcuno lo leggerà — tipicamente chi si chiede perché
    // quella cosa non è stata fatta. Un rifiuto senza motivo lascia quella persona senza risposta.
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Rifiuta la richiesta"
        body="Il motivo finisce nel ledger."
        confirmLabel="Rifiuta"
        confirmVariant="danger"
        requireReason
        reasonLabel="Motivo del rifiuto"
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole('button', { name: 'Rifiuta' });
    expect(confirm).toBeDisabled();

    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Il cliente ha pagato ieri' },
    });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('Il cliente ha pagato ieri');
  });

  it('chiede di digitare il nome prima di terminare una routine', () => {
    // Terminare è definitivo. La differenza fra «ho letto» e «ho cliccato» qui vale una routine.
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Termina la routine"
        body="Terminare una routine è definitivo."
        confirmLabel="Termina"
        confirmVariant="danger"
        typeToConfirm="Report vendite giornaliero"
        typeToConfirmLabel="Scrivi il nome della routine per confermare"
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole('button', { name: 'Termina' });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Report vendite' } });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Report vendite giornaliero' },
    });
    expect(confirm).toBeEnabled();
  });

  it('non eredita quello che si era scritto la volta prima', () => {
    // Un motivo rimasto in memoria finirebbe nel ledger attribuito all'azione sbagliata.
    const { rerender } = renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Rifiuta"
        body="…"
        confirmLabel="Rifiuta"
        requireReason
        reasonLabel="Motivo"
        onConfirm={() => {}}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'motivo vecchio' } });

    rerender(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Rifiuta"
        body="…"
        confirmLabel="Rifiuta"
        requireReason
        reasonLabel="Motivo"
        onConfirm={() => {}}
      />,
    );
    rerender(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Rifiuta"
        body="…"
        confirmLabel="Rifiuta"
        requireReason
        reasonLabel="Motivo"
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Rifiuta' })).toBeDisabled();
  });
});

describe('la chiave di idempotenza', () => {
  it('è diversa a ogni conferma', () => {
    // Nasce alla conferma, non all'apertura del dialogo: se nascesse prima, aprire, chiudere e
    // riaprire produrrebbe una chiave che il server ha già visto, e il fire nuovo verrebbe
    // rifiutato come duplicato.
    expect(uuidV4()).not.toBe(uuidV4());
  });

  it('viaggia come header solo quando la richiesta ha un effetto', async () => {
    const calls: Array<{ url: string; headers: Headers }> = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      calls.push({ url, headers: new Headers(init.headers) });
      return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    });

    const client = new ApiClient({ baseUrl: '/api', csrfToken: 'csrf' });
    await client.request('/routines');
    await client.request('/routines/rt_1/fire', {
      method: 'POST',
      body: {},
      idempotencyKey: 'key-1',
    });

    expect(calls[0]?.headers.has('Idempotency-Key')).toBe(false);
    expect(calls[1]?.headers.get('Idempotency-Key')).toBe('key-1');
    expect(calls[1]?.headers.get('X-CSRF-TOKEN')).toBe('csrf');

    vi.unstubAllGlobals();
  });
});
