import { useConfig } from '../lib/hooks/useConfig';
import { formatDateTime, formatRelative } from '../lib/format/date';

interface RelativeTimeProps {
  iso: string | null;
  className?: string;
}

/**
 * «fra 18 min», con l'orario assoluto nel `title`.
 *
 * Il relativo è quello che si legge di sfuggita; l'assoluto è quello che serve quando si sta
 * ricostruendo cosa è successo, ed è a un hover di distanza invece che in un'altra colonna.
 */
export function RelativeTime({ iso, className = '' }: RelativeTimeProps) {
  const { locale, timezone } = useConfig();

  if (iso === null) {
    return <span className={className}>—</span>;
  }

  return (
    <time dateTime={iso} title={formatDateTime(iso, { locale, timeZone: timezone })} className={className}>
      {formatRelative(iso, locale)}
    </time>
  );
}
