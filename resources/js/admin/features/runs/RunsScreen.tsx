import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar } from '../../components/FilterBar';
import { OutcomeBadge } from '../../components/OutcomeBadge';
import { Duration } from '../../components/Duration';
import { Money } from '../../components/Money';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SkeletonRows } from '../../components/Skeleton';
import { RunSlideOver } from './RunSlideOver';
import { useRuns } from '../../lib/api/queries';
import { useConfig } from '../../lib/hooks/useConfig';
import { formatDateTime } from '../../lib/format/date';
import { t } from '../../lib/i18n';
import type { RunOutcome, RunSummary } from '../../lib/api/types';

const CHIPS = [
  { value: 'all', label: t.runs.filterAll },
  { value: 'succeeded', label: t.outcome.succeeded },
  { value: 'failed', label: t.outcome.failed },
  { value: 'paused', label: t.outcome.paused },
  { value: 'skipped', label: t.outcome.skipped },
  { value: 'running', label: t.runs.filterRunning },
];

export function RunsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { locale, timezone } = useConfig();

  const outcome = (searchParams.get('outcome') ?? 'all') as RunOutcome | 'running' | 'all';
  const routineId = searchParams.get('routine_id') ?? undefined;
  const openRunId = searchParams.get('run');

  const { data, isLoading, isError, error, refetch } = useRuns({
    outcome,
    routine_id: routineId,
  });

  const setOutcome = useCallback(
    (value: string) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (value === 'all') {
          next.delete('outcome');
        } else {
          next.set('outcome', value);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const openRun = useCallback(
    (id: string | null) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (id === null) {
          next.delete('run');
        } else {
          next.set('run', id);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const columns = useMemo<Array<Column<RunSummary>>>(
    () => [
      {
        key: 'outcome',
        header: t.runs.colOutcome,
        width: '120px',
        narrowWidth: '104px',
        render: (row) => <OutcomeBadge outcome={row.outcome} withDot />,
      },
      {
        key: 'routine',
        header: t.runs.colRoutine,
        width: 'minmax(200px,1fr)',
        render: (row) => <span className="truncate">{row.routine_name}</span>,
      },
      {
        key: 'reason',
        header: t.runs.colReason,
        width: '130px',
        hideOnNarrow: true,
        render: (row) => (
          <span className="inline-flex w-fit items-center rounded-full border border-border px-2 py-[2px] text-[11px] text-ink-muted">
            {t.reason[row.reason]}
          </span>
        ),
      },
      {
        key: 'started',
        header: t.runs.colStarted,
        width: '175px',
        hideOnNarrow: true,
        render: (row) => (
          <span className="font-mono text-[11px] tabular-nums text-ink-muted">
            {formatDateTime(row.started_at, { locale, timeZone: timezone })}
          </span>
        ),
      },
      {
        key: 'duration',
        header: t.runs.colDuration,
        width: '90px',
        narrowWidth: '72px',
        render: (row) => <Duration ms={row.duration_ms} className="text-[13px]" />,
      },
      {
        key: 'attempt',
        header: t.runs.colAttempt,
        width: '80px',
        hideOnNarrow: true,
        render: (row) => (
          <span className="text-[13px] tabular-nums text-ink-muted">
            {row.attempt}/{row.max_attempts}
          </span>
        ),
      },
      {
        key: 'cost',
        header: t.runs.colCost,
        width: '90px',
        align: 'right',
        hideOnNarrow: true,
        render: (row) => (
          <Money amount={row.cost} currency={row.currency} className="text-[13px]" />
        ),
      },
    ],
    [locale, timezone],
  );

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="m-0 text-xl font-semibold tracking-[-0.02em]">{t.runs.title}</h1>
        <span className="text-xs tabular-nums text-ink-subtle">
          {t.runs.count(data?.meta.total ?? rows.length)}
        </span>
      </div>

      <FilterBar chips={CHIPS} active={outcome} onChipClick={setOutcome} />

      {isLoading || data === undefined ? (
        <SkeletonRows count={10} columns={7} />
      ) : (
        <DataTable
          caption={t.runs.title}
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => openRun(row.id)}
          // Un fire in corso è l'unica riga che cambierà da sola: si vede.
          rowClassName={(row) => (row.outcome === null ? 'bg-accent-subtle' : '')}
          empty={<EmptyState title={t.runs.empty} />}
        />
      )}

      <RunSlideOver runId={openRunId} onClose={() => openRun(null)} />
    </div>
  );
}
