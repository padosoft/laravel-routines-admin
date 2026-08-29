import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card';
import { KpiCard } from '../../components/KpiCard';
import { StatusDot } from '../../components/StatusDot';
import { OutcomeBadge } from '../../components/OutcomeBadge';
import { RelativeTime } from '../../components/RelativeTime';
import { Duration } from '../../components/Duration';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonKpiRow, SkeletonRows } from '../../components/Skeleton';
import { RunNowDialog } from './RunNowDialog';
import { MandateTab } from './MandateTab';
import { useEndRoutine, usePauseResume, useRoutine, useRuns } from '../../lib/api/queries';
import { usePermission } from '../../lib/hooks/usePermission';
import { useToast } from '../../lib/hooks/useToast';
import { useConfig } from '../../lib/hooks/useConfig';
import { useCapabilities } from '../../lib/api/queries';
import { formatDateTime } from '../../lib/format/date';
import { formatMoney, formatNumber, formatPercent } from '../../lib/format/money';
import { t } from '../../lib/i18n';

const TABS = ['overview', 'runs', 'schedule', 'mandate', 'settings'] as const;

export function RoutineDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [runNow, setRunNow] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { locale } = useConfig();

  const canWrite = usePermission('routines.write');
  const canFire = usePermission('routines.fire');
  const { data: capabilities } = useCapabilities();
  const { data: routine, isLoading, isError, error, refetch } = useRoutine(id);
  const { data: runs } = useRuns({ routine_id: id });
  const pauseResume = usePauseResume();
  const endRoutine = useEndRoutine();

  const tabParam = searchParams.get('tab') ?? 'overview';
  const tab = (TABS as readonly string[]).includes(tabParam) ? tabParam : 'overview';

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  if (isLoading || routine === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-[22px] w-64 animate-pulse-dot rounded-md bg-surface-muted" />
        <SkeletonKpiRow />
        <SkeletonRows count={5} columns={4} />
      </div>
    );
  }

  const paused = routine.status === 'paused';
  const recentRuns = (runs?.data ?? []).slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/routines"
        className="w-fit text-xs text-ink-subtle no-underline hover:text-ink"
      >
        {t.detail.back}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-xl font-semibold tracking-[-0.02em]">{routine.name}</h1>
        <StatusDot status={routine.status} title={routine.suspension_reason_label} />
        <span className="text-xs text-ink-subtle">{routine.owner_label ?? routine.owner}</span>
        <Button
          variant="secondary"
          className="ml-auto"
          disabled={!canFire || routine.status === 'ended'}
          title={canFire ? undefined : t.permission.needsFire}
          onClick={() => setRunNow(true)}
        >
          {t.routines.runNow}
        </Button>
        <Button
          variant="secondary"
          disabled={!canWrite || routine.status === 'ended'}
          title={canWrite ? undefined : t.permission.needsWrite}
          onClick={() =>
            pauseResume.mutate(
              { routineId: routine.id, action: paused ? 'resume' : 'pause' },
              {
                onSuccess: () =>
                  toast.push({
                    title: paused ? t.toast.resumed : t.toast.paused,
                    detail: routine.name,
                    tone: 'idle',
                  }),
              },
            )
          }
        >
          {paused ? t.detail.resume : t.detail.pause}
        </Button>
      </div>

      {/*
        La fascia sta SOPRA i tab: una routine sospesa non è un dettaglio di una scheda, è la
        prima cosa da sapere di questa pagina. E porta la frase del server, non lo slug.
      */}
      {routine.status === 'suspended' ? (
        <div className="flex items-center gap-3.5 rounded-[10px] border border-border border-l-[3px] border-l-warn bg-warn-subtle px-[18px] py-3.5">
          <AlertTriangle className="size-[17px] shrink-0 text-warn" strokeWidth={1.75} aria-hidden="true" />
          <div className="flex flex-col gap-0.5">
            <strong className="text-[13px]">{t.detail.suspendedTitle}</strong>
            <span className="text-[13px] text-ink-muted">
              {routine.suspension_reason_label ?? routine.suspension_reason}
            </span>
          </div>
          <Button
            variant="danger"
            className="ml-auto"
            disabled={!canWrite}
            onClick={() => setConfirmEnd(true)}
          >
            {t.detail.end}
          </Button>
        </div>
      ) : null}

      <Tabs.Root
        value={tab}
        onValueChange={(next) =>
          setSearchParams((current) => {
            const params = new URLSearchParams(current);
            params.set('tab', next);
            return params;
          })
        }
      >
        <Tabs.List className="flex gap-0.5 border-b border-border">
          {[
            ['overview', t.detail.tabOverview],
            ['runs', t.detail.tabRuns],
            ['schedule', t.detail.tabSchedule],
            ...(capabilities?.delegation === true
              ? ([['mandate', t.detail.tabMandate]] as const)
              : []),
            ['settings', t.detail.tabSettings],
          ].map(([value, label]) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="h-9 cursor-pointer border-0 border-b-2 border-transparent bg-transparent px-3.5 text-[13px] font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink data-[state=active]:border-b-accent data-[state=active]:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="mt-4 flex flex-col gap-4 focus:outline-none">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label={t.detail.kpiRuns} value={formatNumber(routine.runs_24h, locale)} />
            <KpiCard
              label={t.detail.kpiSuccess}
              value={formatPercent(routine.success_rate_7d, locale)}
            />
            <KpiCard label={t.detail.kpiAttempts} value={String(routine.max_attempts)} />
            <KpiCard
              label={t.detail.kpiSpend}
              value={formatMoney(routine.budget_used_period, routine.currency, locale)}
              bar={
                routine.budget_per_period === null || routine.budget_used_period === null
                  ? null
                  : routine.budget_used_period / routine.budget_per_period
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card padded={false}>
              <CardHeader title={t.overview.recent} />
              {recentRuns.length === 0 ? (
                <EmptyState title={t.overview.noRecent} />
              ) : (
                <ul className="m-0 list-none p-0">
                  {recentRuns.map((run) => (
                    <li key={run.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/runs?run=${run.id}`)}
                        className="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-border bg-transparent px-5 py-[11px] text-left hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                      >
                        <OutcomeBadge outcome={run.outcome} />
                        <span className="text-[13px] text-ink-muted">{t.reason[run.reason]}</span>
                        <Duration
                          ms={run.duration_ms}
                          className="ml-auto font-mono text-[11px] text-ink-muted"
                        />
                        <RelativeTime
                          iso={run.started_at}
                          className="w-20 shrink-0 text-right text-xs text-ink-subtle"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="flex h-fit flex-col gap-1.5">
              <span className="text-[13px] font-semibold">{t.detail.nextRun}</span>
              <span className="font-mono text-[13px] tabular-nums">
                {formatDateTime(routine.next_run_at, {
                  locale,
                  timeZone: routine.timezone,
                })}
              </span>
              <RelativeTime
                iso={routine.next_run_at}
                className="text-[26px] font-semibold tracking-[-0.02em] tabular-nums text-accent"
              />
              <span className="text-xs text-ink-subtle">
                {routine.schedule_human ?? t.routines.noSchedule} · {routine.timezone}
              </span>
            </Card>
          </div>
        </Tabs.Content>

        <Tabs.Content value="runs" className="mt-4 focus:outline-none">
          <Card padded={false}>
            <CardHeader title={t.detail.tabRuns} />
            {(runs?.data ?? []).length === 0 ? (
              <EmptyState title={t.runs.empty} />
            ) : (
              <ul className="m-0 list-none p-0">
                {(runs?.data ?? []).map((run) => (
                  <li key={run.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/runs?run=${run.id}`)}
                      className="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-border bg-transparent px-5 py-[11px] text-left hover:bg-surface-muted focus-visible:outline-none"
                    >
                      <OutcomeBadge outcome={run.outcome} withDot />
                      <span className="text-[13px] text-ink-muted">{t.reason[run.reason]}</span>
                      <span className="ml-auto font-mono text-[11px] tabular-nums text-ink-muted">
                        {run.attempt}/{run.max_attempts}
                      </span>
                      <Duration ms={run.duration_ms} className="w-20 text-right text-[13px]" />
                      <RelativeTime
                        iso={run.started_at}
                        className="w-24 shrink-0 text-right text-xs text-ink-subtle"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Tabs.Content>

        <Tabs.Content value="schedule" className="mt-4 focus:outline-none">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold">{t.detail.schedule}</span>
              <span className="text-sm">{routine.schedule_human ?? t.routines.noSchedule}</span>
              {routine.cron === null ? null : (
                <code className="w-fit rounded-[6px] border border-border bg-surface-muted px-2.5 py-2 font-mono text-xs">
                  {routine.cron}
                </code>
              )}
              <span className="text-xs text-ink-muted">
                {t.detail.timezoneNote(routine.timezone)}
              </span>
            </Card>

            <Card padded={false}>
              <CardHeader title={t.detail.occurrences} />
              <ul className="m-0 list-none p-0">
                {routine.next_occurrences.map((occurrence) => (
                  <li
                    key={occurrence.at}
                    className="flex items-center gap-2.5 border-b border-border px-5 py-2.5 last:border-b-0"
                  >
                    <span className="font-mono text-xs tabular-nums">{occurrence.local}</span>
                    <span className="font-mono text-[11px] text-ink-subtle">
                      {occurrence.timezone_abbr}
                    </span>
                    {/* La domanda che l'utente si fa due volte l'anno, con la risposta accanto. */}
                    {occurrence.dst_transition ? (
                      <span className="ml-auto max-w-[230px] text-right text-[11px] text-warn">
                        {t.detail.dstNote}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Tabs.Content>

        <Tabs.Content value="mandate" className="mt-4 focus:outline-none">
          <MandateTab mandate={routine.mandate} currency={routine.currency} />
        </Tabs.Content>

        <Tabs.Content value="settings" className="mt-4 focus:outline-none">
          <div className="flex max-w-[760px] flex-col gap-4">
            {[
              { label: t.detail.settingOverlap, help: t.detail.settingOverlapHelp, value: routine.overlap_policy },
              { label: t.detail.settingMissed, help: t.detail.settingMissedHelp, value: routine.missed_run_policy },
              { label: t.detail.settingAttempts, help: '', value: String(routine.max_attempts) },
              {
                label: t.detail.settingTimeout,
                help: '',
                value: routine.timeout_seconds === null ? '—' : `${routine.timeout_seconds} s`,
              },
              {
                label: t.detail.settingBudget,
                help: '',
                value: formatMoney(routine.budget_per_run, routine.currency, locale),
              },
            ].map((setting) => (
              <Card key={setting.label} className="flex items-center gap-4 !p-[18px_20px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold">{setting.label}</span>
                  {setting.help === '' ? null : (
                    <span className="text-xs text-ink-muted">{setting.help}</span>
                  )}
                </div>
                <span className="ml-auto font-mono text-xs tabular-nums">{setting.value}</span>
              </Card>
            ))}

            <div className="flex items-center gap-4 rounded-[10px] border border-danger bg-danger-subtle px-5 py-[18px]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-danger">{t.detail.end}</span>
                <span className="text-xs text-ink-muted">{t.detail.dangerZoneHelp}</span>
              </div>
              <Button
                variant="danger"
                className="ml-auto"
                disabled={!canWrite || routine.status === 'ended'}
                onClick={() => setConfirmEnd(true)}
              >
                {t.detail.endAction}
              </Button>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {runNow ? (
        <RunNowDialog routine={routine} onClose={() => setRunNow(false)} />
      ) : null}

      {/*
        Digitare il nome per abilitare il bottone. Non è attrito gratuito: terminare è
        definitivo, e la differenza fra «ho letto» e «ho cliccato» qui vale una routine.
      */}
      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title={t.dialog.endTitle}
        body={t.dialog.endBody}
        confirmLabel={t.dialog.endConfirm}
        confirmVariant="danger"
        typeToConfirm={routine.name}
        typeToConfirmLabel={t.dialog.endTypeToConfirm}
        requireReason
        reasonLabel={t.attention.reasonLabel}
        pending={endRoutine.isPending}
        error={endRoutine.isError ? <ErrorState error={endRoutine.error} /> : undefined}
        onConfirm={(reason) =>
          endRoutine.mutate(
            { routineId: routine.id, reason },
            {
              onSuccess: () => {
                setConfirmEnd(false);
                toast.push({ title: t.toast.ended, detail: routine.name, tone: 'idle' });
                navigate('/routines');
              },
            },
          )
        }
      />
    </div>
  );
}
