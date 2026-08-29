/** Valuta via `Intl`, col locale del provider: mai un `€` concatenato a mano. */
export function formatMoney(
  amount: number | null,
  currency: string,
  locale: string,
): string {
  if (amount === null) {
    return '—';
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** `0.991` → «99,1 %». `null` quando non c'è ancora abbastanza storia per dirlo. */
export function formatPercent(value: number | null, locale: string): string {
  if (value === null) {
    return '—';
  }
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);
}
