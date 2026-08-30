import { useState } from 'react';
import { SlideOver } from '../../components/SlideOver';
import { OutcomeBadge, outcomeKey } from '../../components/OutcomeBadge';
import { JsonViewer } from '../../components/JsonViewer';
import { CopyButton } from '../../components/CopyButton';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorState } from '../../components/ErrorState';
import { useFireRoutine, useRun } from '../../lib/api/queries';
import { usePermission } from '../../lib/hooks/usePermission';
import { useToast } from '../../lib/hooks/useToast';
import { useConfig } from '../../lib/hooks/useConfig';
import { formatDateTime, formatElapsed } from '../../lib/format/date';
import { formatDuration } from '../../lib/format/duration';
import { formatMoney } from '../../lib/format/money';
import { t } from '../../lib/i18n';

interface RunSlideOverProps {
  runId: string | null;
  onClose: () => void;
}

const MESSAGE_TONE: Record<string, string> = {
  succeeded: 'bg-ok-subtle text-ink',
  failed: 'bg-danger-subtle text-danger',
  skipped: 'bg-idle-subtle text-ink',
  paused: 'bg-attention-subtle text-attention',
  running: 'bg-accent-subtle text-ink',
};

export function RunSlideOver({ runId, onClose }: RunSlideOverProps) {
  const [confirmRepeat, setConfirmRepeat] = useState(false);
  const { locale, timezone, appName } = useConfig();
  const canFire = usePermission('routines.fire');
  const toast = useToast();
  const fire = useFireRoutine();
  const { data: run, isLoading } = useRun(runId);

  const open = runId !== null;

  return (
    <>
      <SlideOver
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        label={t.runs.detailLabel}
        header={
          run === undefined ? (
            <span className="text-[13px] text-ink-muted">{t.app.loading}</span>
          ) : (
            <>
              <OutcomeBadge outcome={run.outcome} withDot />
              <span className="truncate font-semibold">{run.routine_name}</span>
            </>
          )
        }
      >
        {isLoading || run === undefined ? (
          <div className="flex flex-col gap-3">
            <div className="h-16 animate-pulse-dot rounded-lg bg-surface-muted" />
            <div className="h-40 animate-pulse-dot rounded-lg bg-surface-muted" />
          </div>
        ) : (
          <>
            {/* Il messaggio in evidenza, sul fondo del colore dell'esito: è la prima cosa da leggere. */}
            <p
              className={`m-0 rounded-lg px-4 py-3.5 text-sm leading-[1.55] ${
                MESSAGE_TONE[outcomeKey(run.outcome)] ?? 'bg-surface-muted text-ink'
              }`}
            >
              {run.message ?? '—'}
            </p>

            {/*
              Un fallimento con tentativi rimasti non è finito: dirlo evita che qualcuno
              rilanci a mano una cosa che il motore stava già per rifare.
            */}
            {run.outcome === 'failed' && run.retry_at !== null ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-[13px]">
                <span className="size-[7px] animate-pulse-dot rounded-full bg-warn" aria-hidden="true" />
                {t.runs.retryIn(formatElapsed(run.retry_at))}
              </div>
            ) : null}

            <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-[150px_1fr] sm:gap-y-2.5">
              <dt className="text-ink-subtle">{t.runs.idempotencyKey}</dt>
              <dd className="m-0 flex items-center gap-2">
                <span className="min-w-0 break-all font-mono">{run.idempotency_key}</span>
                <CopyButton value={run.idempotency_key} />
              </dd>

              <dt className="text-ink-subtle">{t.runs.correlationId}</dt>
              <dd className="m-0 break-all font-mono">{run.correlation_id ?? '—'}</dd>

              <dt className="text-ink-subtle">{t.runs.externalRef}</dt>
              <dd className="m-0 font-mono">
                {run.external_url === null ? (
                  (run.external_ref ?? '—')
                ) : (
                  <a href={run.external_url} target="_blank" rel="noreferrer noopener">
                    {run.external_ref ?? run.external_url}
                  </a>
                )}
              </dd>

              <dt className="text-ink-subtle">{t.runs.attempt}</dt>
              <dd className="m-0 tabular-nums">
                {run.attempt}/{run.max_attempts}
              </dd>

              <dt className="text-ink-subtle">{t.runs.scheduledFor}</dt>
              <dd className="m-0 tabular-nums">
                {formatDateTime(run.scheduled_for, { locale, timeZone: timezone })}
              </dd>

              <dt className="text-ink-subtle">{t.runs.duration}</dt>
              <dd className="m-0 tabular-nums">{formatDuration(run.duration_ms)}</dd>

              <dt className="text-ink-subtle">{t.runs.cost}</dt>
              <dd className="m-0 tabular-nums">
                {formatMoney(run.cost, run.currency, locale)}
              </dd>
            </dl>

            <JsonViewer label={t.runs.metadata} value={run.metadata} />

            <Button
              variant="secondary"
              className="w-fit"
              disabled={!canFire}
              title={canFire ? undefined : t.permission.needsFire}
              onClick={() => setConfirmRepeat(true)}
            >
              {t.runs.repeat}
            </Button>
          </>
        )}
      </SlideOver>

      {/*
        «Ripeti» crea un fire NUOVO con una chiave nuova, e il dialogo lo dice a parole.
        Chiamarlo «riprova» suggerirebbe che il motore riprenda dove si era fermato — e chi lo
        premesse dopo un fire che aveva già mandato l'email la manderebbe due volte.
      */}
      {confirmRepeat && run !== undefined ? (
        <ConfirmDialog
          open
          onOpenChange={setConfirmRepeat}
          title={t.runs.repeatTitle}
          body={t.runs.repeatBody}
          params={[
            { key: t.nav.routines, value: run.routine_name },
            { key: t.attention.fire, value: run.id },
            { key: appName, value: t.reason.manual },
          ]}
          confirmLabel={t.runs.repeat}
          pending={fire.isPending}
          error={fire.isError ? <ErrorState error={fire.error} /> : undefined}
          onConfirm={() => {
            fire.mutate(
              { routineId: run.routine_id },
              {
                onSuccess: (result) => {
                  setConfirmRepeat(false);
                  toast.push({
                    title: t.toast.repeated,
                    detail: result.data.id,
                    tone: 'accent',
                  });
                },
              },
            );
          }}
        />
      ) : null}
    </>
  );
}
