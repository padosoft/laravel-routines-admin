import { Card, CardHeader } from '../../components/Card';
import { CopyButton } from '../../components/CopyButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SkeletonRows } from '../../components/Skeleton';
import { useHealth } from '../../lib/api/queries';
import { useConfig } from '../../lib/hooks/useConfig';
import { formatDateTime, formatSeconds } from '../../lib/format/date';
import { t } from '../../lib/i18n';

/**
 * `/health` DIAGNOSTICA, non riporta.
 *
 * «Ultimo tick 47 minuti fa» informa e lascia il lettore al punto di partenza; «lo scheduler non
 * gira, controlla il cron» — che è `tick_diagnosis`, composta dal server — risolve. Per questo la
 * frase non viene ricomposta qui: sarebbe una seconda versione della stessa diagnosi.
 */
export function HealthScreen() {
  const { locale, timezone } = useConfig();
  // `enabled` di default: il polling a 15 s parte con la pagina e si ferma quando la si lascia.
  const { data, isLoading, isError, error, refetch } = useHealth();

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  if (isLoading || data === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-[22px] w-56 animate-pulse-dot rounded-md bg-surface-muted" />
        <div className="h-32 animate-pulse-dot rounded-[10px] border border-border bg-surface" />
        <SkeletonRows count={3} columns={3} />
      </div>
    );
  }

  const tone = data.tick_healthy ? 'accent' : 'danger';

  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 text-xl font-semibold tracking-[-0.02em]">{t.health.title}</h1>

      <Card accent={tone} className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`size-2 animate-pulse-dot rounded-full ${
              data.tick_healthy ? 'bg-accent' : 'bg-danger'
            }`}
            aria-hidden="true"
          />
          <span className="text-[13px] font-semibold">{t.health.lastTick}</span>
          <span
            className={`ml-auto font-mono text-xs tabular-nums ${
              data.tick_healthy ? 'text-accent' : 'text-danger'
            }`}
          >
            {data.tick_age_seconds === null ? '—' : formatSeconds(data.tick_age_seconds)}
          </span>
        </div>
        {data.tick_diagnosis === null ? null : (
          <p className="m-0 max-w-[70ch] text-[13px] text-ink-muted">{data.tick_diagnosis}</p>
        )}
        <div className="flex w-fit items-center gap-2">
          <code className="rounded-[6px] border border-border bg-surface-muted px-2.5 py-2 font-mono text-xs">
            {t.health.cronHint}
          </code>
          <CopyButton value={t.health.cronHint} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title={t.health.overdue} />
          {data.overdue.length === 0 ? (
            <EmptyState title={t.health.noOverdue} />
          ) : (
            <ul className="m-0 list-none p-0">
              {data.overdue.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border-b border-border px-5 py-[11px] last:border-b-0"
                >
                  <span className="size-[7px] shrink-0 rounded-full bg-warn" aria-hidden="true" />
                  <span className="truncate">{row.name}</span>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-warn">
                    {t.health.overdueBy(formatSeconds(row.late_seconds))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false}>
          <CardHeader title={t.health.locks} />
          {data.stuck_locks.length === 0 ? (
            <EmptyState title={t.health.noLocks} />
          ) : (
            <ul className="m-0 list-none p-0">
              {data.stuck_locks.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border-b border-border px-5 py-[11px] last:border-b-0"
                >
                  <span className="size-[7px] shrink-0 rounded-full bg-danger" aria-hidden="true" />
                  <span className="truncate">{row.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-ink-subtle">
                    {t.health.lockHeld(
                      formatDateTime(row.locked_until, { locale, timeZone: timezone }),
                      formatSeconds(row.locked_for_seconds),
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card padded={false}>
        <CardHeader title={t.health.targets} />
        <ul className="m-0 list-none p-0">
          {data.targets.map((target) => (
            <li
              key={target.type}
              className="grid grid-cols-[180px_1fr_200px_120px] items-center gap-3 border-b border-border px-5 py-[11px] last:border-b-0"
            >
              <span className="truncate font-mono text-xs">{target.type}</span>
              <span className="truncate text-[13px] text-ink-muted">{target.label ?? '—'}</span>
              {/*
                Un bersaglio usato ma NON registrato è la causa numero uno delle sospensioni:
                si vede in `danger`, non in grigio come il resto della riga.
              */}
              <span
                className={`text-xs font-medium ${
                  target.registered ? 'text-ok' : 'text-danger'
                }`}
              >
                {target.registered ? t.health.registered : t.health.notRegistered}
              </span>
              <span className="text-right text-xs tabular-nums text-ink-subtle">
                {t.health.routinesUsing(target.routines_count)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
