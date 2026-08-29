import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../../components/Card';
import { KpiCard } from '../../components/KpiCard';
import { OutcomeBadge } from '../../components/OutcomeBadge';
import { RelativeTime } from '../../components/RelativeTime';
import { Duration } from '../../components/Duration';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SkeletonKpiRow, SkeletonRows } from '../../components/Skeleton';
import { AwaitingBanner } from './AwaitingBanner';
import { RunTimeline } from './RunTimeline';
import { useOverview, useRoutines, useRuns, useTimeline } from '../../lib/api/queries';
import { useConfig } from '../../lib/hooks/useConfig';
import { formatMoney, formatNumber, formatPercent } from '../../lib/format/money';
import { formatDateTime } from '../../lib/format/date';
import { t } from '../../lib/i18n';

/**
 * Risponde in ordine a tre domande, e l'ordine è il contenuto della schermata:
 * serve qualcosa da me? · sta girando tutto? · cosa è successo?
 */
export function OverviewScreen() {
  const { locale, timezone } = useConfig();
  const navigate = useNavigate();

  const overview = useOverview();
  const timeline = useTimeline(30);
  const upcoming = useRoutines({ status: 'active' });
  const recent = useRuns({});

  if (overview.isError) {
    return <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  }

  // `isLoading || data === undefined`: con `enabled` condizionale a monte una query disabilitata
  // riporta `isLoading === false` e `data` indefinito, e il ramo «contenuto» renderizzerebbe il
  // vuoto invece del caricamento.
  if (overview.isLoading || overview.data === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-[22px] w-44 animate-pulse-dot rounded-md bg-surface-muted" />
        <SkeletonKpiRow />
        <SkeletonRows count={5} />
      </div>
    );
  }

  const data = overview.data;
  const upcomingRows = (upcoming.data?.data ?? [])
    .filter((r) => r.next_run_at !== null)
    .sort((a, b) => (a.next_run_at ?? '').localeCompare(b.next_run_at ?? ''))
    .slice(0, 5);
  const recentRows = (recent.data?.data ?? []).slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 text-xl font-semibold tracking-[-0.02em]">{t.overview.title}</h1>

      <AwaitingBanner
        count={data.awaiting_human}
        oldestSince={data.oldest_awaiting_since}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label={t.overview.kpiAwaiting}
          value={formatNumber(data.awaiting_human, locale)}
          tone={data.awaiting_human > 0 ? 'attention' : 'default'}
          sub={
            data.oldest_awaiting_since === null
              ? null
              : t.overview.awaitingOldest(
                  formatDateTime(data.oldest_awaiting_since, { locale, timeZone: timezone }),
                )
          }
        />
        <KpiCard
          label={t.overview.kpiActive}
          value={formatNumber(data.active_routines, locale)}
          sub={t.overview.kpiPausedSub(data.paused_routines, data.suspended_routines)}
        />
        <KpiCard
          label={t.overview.kpiRuns}
          value={formatNumber(data.runs_24h, locale)}
          sub={t.overview.kpiFailedSub(data.failed_24h)}
        />
        {data.spend_7d === null ? (
          <KpiCard
            label={t.overview.kpiSuccess}
            value={formatPercent(data.success_rate_7d, locale)}
            delta={
              data.success_rate_delta === null || data.success_rate_delta === 0
                ? null
                : {
                    text: formatPercent(Math.abs(data.success_rate_delta), locale),
                    direction: data.success_rate_delta > 0 ? 'up' : 'down',
                  }
            }
          />
        ) : (
          <KpiCard
            label={t.overview.kpiSpend}
            value={formatMoney(data.spend_7d, data.currency, locale)}
            bar={data.budget_utilisation}
            sub={
              data.budget_utilisation === null
                ? null
                : t.overview.budgetUsed(formatPercent(data.budget_utilisation, locale))
            }
          />
        )}
      </div>

      {timeline.data === undefined ? (
        <div className="h-[210px] animate-pulse-dot rounded-[10px] border border-border bg-surface" />
      ) : (
        <RunTimeline points={timeline.data} locale={locale} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title={t.overview.upcoming} />
          {upcomingRows.length === 0 ? (
            <EmptyState title={t.overview.noUpcoming} />
          ) : (
            <ul className="m-0 list-none p-0">
              {upcomingRows.map((routine) => (
                <li
                  key={routine.id}
                  className="flex items-center gap-3 border-b border-border px-5 py-[11px] last:border-b-0"
                >
                  <span className="size-[7px] shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span className="truncate font-medium">{routine.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-ink-muted">
                    {formatDateTime(routine.next_run_at, { locale, timeZone: routine.timezone })}
                  </span>
                  <RelativeTime
                    iso={routine.next_run_at}
                    className="w-[86px] shrink-0 text-right text-xs text-ink-subtle"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false}>
          <CardHeader title={t.overview.recent} />
          {recentRows.length === 0 ? (
            <EmptyState title={t.overview.noRecent} />
          ) : (
            <ul className="m-0 list-none p-0">
              {recentRows.map((run) => (
                <li key={run.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/runs?run=${run.id}`)}
                    className="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-border bg-transparent px-5 py-[11px] text-left hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                  >
                    <OutcomeBadge outcome={run.outcome} />
                    <span className="truncate">{run.routine_name}</span>
                    <Duration
                      ms={run.duration_ms}
                      className="ml-auto shrink-0 font-mono text-[11px] text-ink-muted"
                    />
                    <RelativeTime
                      iso={run.started_at}
                      className="w-[86px] shrink-0 text-right text-xs text-ink-subtle"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
