import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionCard } from './AttentionCard';
import { ConfirmDialog, type ConfirmParam } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SkeletonCards } from '../../components/Skeleton';
import { PermissionBanner } from '../../components/PermissionGate';
import { useApproveRun, useAttention, useRejectRun } from '../../lib/api/queries';
import { usePermission } from '../../lib/hooks/usePermission';
import { useToast } from '../../lib/hooks/useToast';
import { useConfig } from '../../lib/hooks/useConfig';
import { formatDateTime } from '../../lib/format/date';
import { t } from '../../lib/i18n';
import type { Run } from '../../lib/api/types';

type Pending = { kind: 'approve' | 'reject'; run: Run } | null;

export function AttentionScreen() {
  const [pending, setPending] = useState<Pending>(null);
  const { locale, timezone } = useConfig();
  const navigate = useNavigate();
  const toast = useToast();

  const canApprove = usePermission('routines.approve');
  const { data, isLoading, isError, error, refetch } = useAttention();
  const approve = useApproveRun();
  const reject = useRejectRun();

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const params = (run: Run): ConfirmParam[] => [
    { key: t.attention.fire, value: run.id },
    { key: t.attention.actionClass, value: run.action_class ?? '—' },
    { key: t.nav.routines, value: run.routine_name },
    { key: t.attention.at, value: formatDateTime(run.started_at, { locale, timeZone: timezone }) },
  ];

  return (
    <div className="flex max-w-[820px] flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 text-xl font-semibold tracking-[-0.02em]">{t.attention.title}</h1>
        <p className="m-0 text-[13px] text-ink-muted">{t.attention.subtitle}</p>
      </header>

      <PermissionBanner permission="routines.approve" message={t.permission.needsApprove} />

      {isLoading || data === undefined ? (
        <SkeletonCards count={2} />
      ) : data.length === 0 ? (
        <div className="rounded-[10px] border border-border bg-surface">
          <EmptyState title={t.attention.empty} />
        </div>
      ) : (
        data.map((run) => (
          <AttentionCard
            key={run.id}
            run={run}
            canApprove={canApprove && run.can_approve}
            deniedReason={t.permission.needsApprove}
            onApprove={(r) => setPending({ kind: 'approve', run: r })}
            onReject={(r) => setPending({ kind: 'reject', run: r })}
          />
        ))
      )}

      {/*
        Il secondo passo RIDICE cosa succederà, con i parametri esatti. «Sei sicuro?» non
        aggiunge informazione: si impara a cliccarci sopra in due giorni, e da lì in poi
        la conferma non conferma più niente.
      */}
      {pending?.kind === 'approve' ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={t.attention.approveTitle}
          body={`${pending.run.message ?? ''} ${t.attention.approveTail}`}
          params={params(pending.run)}
          confirmLabel={t.attention.approve}
          confirmVariant="attention"
          pending={approve.isPending}
          error={approve.isError ? <ErrorState error={approve.error} /> : undefined}
          onConfirm={() => {
            const run = pending.run;
            approve.mutate(
              { runId: run.id },
              {
                onSuccess: () => {
                  setPending(null);
                  toast.push({
                    title: t.toast.approved,
                    detail: run.id,
                    tone: 'attention',
                    action: { label: t.toast.seeLedger, onClick: () => navigate('/runs') },
                  });
                },
              },
            );
          }}
        />
      ) : null}

      {pending?.kind === 'reject' ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={t.attention.rejectTitle}
          body={t.attention.rejectBody(
            pending.run.routine_name,
            pending.run.action_class ?? '—',
          )}
          confirmLabel={t.attention.reject}
          confirmVariant="danger"
          requireReason
          reasonLabel={t.attention.reasonLabel}
          reasonPlaceholder={t.attention.reasonPlaceholder}
          pending={reject.isPending}
          error={reject.isError ? <ErrorState error={reject.error} /> : undefined}
          onConfirm={(reason) => {
            const run = pending.run;
            reject.mutate(
              { runId: run.id, reason },
              {
                onSuccess: () => {
                  setPending(null);
                  toast.push({
                    title: t.toast.rejected,
                    detail: t.toast.rejectedDetail,
                    tone: 'danger',
                    action: { label: t.toast.seeLedger, onClick: () => navigate('/runs') },
                  });
                },
              },
            );
          }}
        />
      ) : null}
    </div>
  );
}
