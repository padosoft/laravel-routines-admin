/**
 * Date e orari passano SEMPRE da `Intl` col locale e il fuso del provider.
 *
 * Formattare a mano significa sbagliare due volte l'anno (ora legale) e sempre per chi non vive
 * nel fuso del server — che è esattamente la classe di bug che questo prodotto esiste per evitare.
 */

export interface DateFormatOptions {
  locale: string;
  timeZone: string;
}

export function formatDateTime(iso: string | null, opts: DateFormatOptions): string {
  if (iso === null) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(opts.locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: opts.timeZone,
  }).format(d);
}

export function formatTime(iso: string | null, opts: DateFormatOptions): string {
  if (iso === null) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(opts.locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: opts.timeZone,
  }).format(d);
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/** «fra 18 min», «12 min fa» — sempre relativo a `now`, che il chiamante passa per i test. */
export function formatRelative(iso: string | null, locale: string, now: Date = new Date()): string {
  if (iso === null) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  const deltaSeconds = Math.round((d.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(deltaSeconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const [unit, seconds] of UNITS) {
    if (abs >= seconds || unit === 'second') {
      return rtf.format(Math.round(deltaSeconds / seconds), unit);
    }
  }
  return rtf.format(0, 'second');
}

/**
 * «6 h 12 m» — quanto è passato, in forma compatta.
 *
 * Non usa `Intl.RelativeTimeFormat` di proposito: qui non serve «6 ore fa» ma la DURATA
 * dell'attesa, che è il numero che una persona guarda per decidere se è tardi.
 */
export function formatElapsed(iso: string | null, now: Date = new Date()): string {
  if (iso === null) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return formatSeconds(Math.max(0, Math.round((now.getTime() - d.getTime()) / 1000)));
}

export function formatSeconds(total: number): string {
  if (total < 60) {
    return `${total} s`;
  }
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) {
    return hours > 0 ? `${days} g ${hours} h` : `${days} g`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} m` : `${hours} h`;
  }
  return `${minutes} m`;
}
