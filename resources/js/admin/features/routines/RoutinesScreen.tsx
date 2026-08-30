import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterBar } from '../../components/FilterBar';
import { StatusDot } from '../../components/StatusDot';
import { OutcomeBadge } from '../../components/OutcomeBadge';
import { RelativeTime } from '../../components/RelativeTime';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SkeletonRows } from '../../components/Skeleton';
import { RunNowDialog } from './RunNowDialog';
import { useRoutines } from '../../lib/api/queries';
import { usePermission } from '../../lib/hooks/usePermission';
import { useConfig } from '../../lib/hooks/useConfig';
import { formatDateTime } from '../../lib/format/date';
import { t } from '../../lib/i18n';
import type { RoutineStatus, RoutineSummary } from '../../lib/api/types';

const CHIPS = [
  { value: 'all', label: t.routines.filterAll },
  { value: 'active', label: t.routines.filterActive },
  { value: 'paused', label: t.routines.filterPaused },
  { value: 'suspended', label: t.routines.filterSuspended },
  { value: 'ended', label: t.routines.filterEnded },
];

export function RoutinesScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { locale } = useConfig();
  const canFire = usePermission('routines.fire');
  const canWrite = usePermission('routines.write');

  const status = (searchParams.get('status') ?? 'all') as RoutineStatus | 'all';
  const q = searchParams.get('q') ?? '';

  // Il campo si scrive subito, la query parte dopo: 300 ms è il tempo fra due tasti di chi
  // digita normalmente, e senza debounce ogni lettera sarebbe una richiesta.
  const [draft, setDraft] = useState(q);
  const [debounced, setDebounced] = useState(q);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(draft), 300);
    return () => clearTimeout(timer);
  }, [draft]);

  // I filtri vivono nella query string: un elenco filtrato è un indirizzo condivisibile, e
  // ricaricare la pagina non deve azzerarlo.
  useEffect(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (debounced === '') {
          next.delete('q');
        } else {
          next.set('q', debounced);
        }
        return next;
      },
      { replace: true },
    );
  }, [debounced, setSearchParams]);

  const [runNow, setRunNow] = useState<RoutineSummary | null>(null);

  const { data, isLoading, isError, error, refetch } = useRoutines({ status, q: debounced });

  const setStatus = useCallback(
    (value: string) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (value === 'all') {
          next.delete('status');
        } else {
          next.set('status', value);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setDraft('');
    setSearchParams({});
  }, [setSearchParams]);

  const columns = useMemo<Array<Column<RoutineSummary>>>(
    () => [
      {
        key: 'status',
        header: t.routines.colStatus,
        width: '132px',
        narrowWidth: '92px',
        render: (row) => (
          // Per una routine sospesa il tooltip porta la frase del server, mai lo slug:
          // `target_not_registered` non dice a nessuno cosa fare.
          <StatusDot status={row.status} title={row.suspension_reason_label} />
        ),
      },
      {
        key: 'name',
        header: t.routines.colName,
        width: 'minmax(220px,1fr)',
        // Su stretto il minimo di 220px NON si comprime e spinge fuori schermo le colonne
        // successive: il bottone «esegui ora» finiva oltre il bordo destro. `minmax(0,1fr)`
        // e' l'unica forma che davvero cede spazio.
        narrowWidth: 'minmax(0,1fr)',
        render: (row) => (
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate font-medium">{row.name}</span>
            {row.description === null ? null : (
              <span className="truncate text-xs text-ink-subtle">{row.description}</span>
            )}
          </span>
        ),
      },
      {
        key: 'target',
        header: t.routines.colTarget,
        width: '150px',
        hideOnNarrow: true,
        render: (row) => (
          <span className="inline-flex w-fit items-center rounded-full border border-border px-2 py-[3px] text-xs text-ink-muted">
            {row.target_label}
          </span>
        ),
      },
      {
        key: 'schedule',
        header: t.routines.colSchedule,
        width: '230px',
        hideOnNarrow: true,
        render: (row) => (
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-[13px]">
              {row.schedule_human ?? t.routines.noSchedule}
            </span>
            {row.cron === null ? null : (
              <span className="truncate font-mono text-[11px] text-ink-subtle">{row.cron}</span>
            )}
          </span>
        ),
      },
      {
        key: 'next',
        header: t.routines.colNext,
        width: '165px',
        // Fuori dal telefono: con stato, nome e comando non ci sta, e il «quando gira»
        // lo dice gia' la Panoramica, che e' la schermata da cui si entra.
        hideOnNarrow: true,
        render: (row) => (
          <span className="flex flex-col gap-px">
            <span
              className={`font-mono text-[11px] tabular-nums ${
                row.is_overdue ? 'text-warn' : 'text-ink-muted'
              }`}
            >
              {formatDateTime(row.next_run_at, { locale, timeZone: row.timezone })}
            </span>
            <RelativeTime
              iso={row.next_run_at}
              className={`text-xs ${row.is_overdue ? 'text-warn' : 'text-ink-subtle'}`}
            />
          </span>
        ),
      },
      {
        key: 'last',
        header: t.routines.colLast,
        width: '150px',
        hideOnNarrow: true,
        render: (row) => (
          <span className="flex flex-col items-start gap-0.5">
            {row.last_outcome === null ? (
              <span className="text-xs text-ink-subtle">{t.routines.never}</span>
            ) : (
              <OutcomeBadge outcome={row.last_outcome} />
            )}
            <RelativeTime iso={row.last_fired_at} className="text-xs text-ink-subtle" />
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: '44px',
        narrowWidth: '32px',
        render: (row) => (
          <button
            type="button"
            title={canFire ? t.routines.runNow : t.permission.needsFire}
            aria-label={`${t.routines.runNow}: ${row.name}`}
            disabled={!canFire || row.status === 'ended'}
            onClick={(event) => {
              // Senza questo, l'unico bottone della riga aprirebbe anche il dettaglio dietro
              // il dialogo di conferma.
              event.stopPropagation();
              setRunNow(row);
            }}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-[6px] border border-border bg-surface text-ink-muted transition-colors duration-150 ease-out hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Play className="size-3" strokeWidth={2} aria-hidden="true" />
          </button>
        ),
      },
    ],
    [canFire, locale],
  );

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const rows = data?.data ?? [];
  const filtered = status !== 'all' || debounced !== '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-xl font-semibold tracking-[-0.02em]">{t.routines.title}</h1>
        <span className="text-xs tabular-nums text-ink-subtle">
          {t.routines.count(data?.meta.total ?? rows.length)}
        </span>
        <Button
          variant="primary"
          className="ml-auto"
          disabled={!canWrite}
          title={canWrite ? undefined : t.permission.needsWrite}
          onClick={() => navigate('/routines/new')}
        >
          {t.routines.create}
        </Button>
      </div>

      <FilterBar
        search={{
          value: draft,
          placeholder: t.routines.searchPlaceholder,
          label: t.routines.searchLabel,
          onChange: setDraft,
        }}
        chips={CHIPS}
        active={status}
        onChipClick={setStatus}
      />

      {isLoading || data === undefined ? (
        <SkeletonRows count={6} columns={6} />
      ) : (
        <DataTable
          caption={t.routines.title}
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          rowHeight="min-h-[52px] py-2"
          onRowClick={(row) => navigate(`/routines/${row.id}`)}
          empty={
            filtered ? (
              <EmptyState
                title={t.routines.emptyFilteredTitle}
                action={{ label: t.routines.emptyFilteredAction, onClick: clearFilters }}
              />
            ) : (
              <EmptyState
                title={t.routines.emptyTitle}
                action={{
                  label: t.routines.emptyAction,
                  onClick: () => navigate('/routines/new'),
                }}
              />
            )
          }
        />
      )}

      <RunNowDialog routine={runNow} onClose={() => setRunNow(null)} />
    </div>
  );
}
