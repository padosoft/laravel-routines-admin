import { AlertTriangle } from 'lucide-react';
import { useSchedulePreview } from '../lib/api/queries';
import { t } from '../lib/i18n';

interface SchedulePreviewProps {
  cron: string;
  timezone: string;
  enabled: boolean;
}

/**
 * Le prossime cinque esecuzioni, calcolate dal SERVER mentre si scrive.
 *
 * È il componente che previene la classe di bug più comune del prodotto: uno schedule che sembra
 * giusto — «0 6 * * 1-5», ovvio — e parte a un'altra ora perché il fuso della routine non è
 * quello di chi la sta scrivendo. Vedere cinque date vere prima di salvare chiude la questione.
 * Non ometterla, e non calcolarla qui: il cron lo espande il motore, non il pannello.
 */
export function SchedulePreview({ cron, timezone, enabled }: SchedulePreviewProps) {
  const { data, isFetching } = useSchedulePreview(cron, timezone, enabled);

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-card">
      <div className="border-b border-border px-4 py-3 text-xs font-semibold">
        {t.wizard.previewTitle}
      </div>

      {!enabled || data === undefined ? (
        <p className="m-0 px-4 py-5 text-xs text-ink-subtle">
          {isFetching ? t.app.loading : t.wizard.previewEmpty}
        </p>
      ) : data.valid === false ? (
        <p className="m-0 px-4 py-5 text-xs text-danger">{data.error ?? t.wizard.cronInvalid}</p>
      ) : (
        <>
          {data.schedule_human === null ? null : (
            <p className="m-0 border-b border-border px-4 py-2.5 text-[13px] text-ink-muted">
              {data.schedule_human}
            </p>
          )}
          <ul className="m-0 list-none p-0">
            {data.occurrences.map((occurrence) => (
              <li
                key={occurrence.at}
                className="flex items-center gap-2 border-b border-border px-4 py-2.5 last:border-b-0"
              >
                <span className="font-mono text-xs tabular-nums">{occurrence.local}</span>
                <span className="ml-auto font-mono text-[11px] text-ink-subtle">
                  {occurrence.timezone_abbr}
                </span>
                {occurrence.dst_transition ? (
                  <AlertTriangle
                    className="size-3.5 text-warn"
                    strokeWidth={1.75}
                    aria-label={t.detail.dstNote}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
