import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorState } from '../../components/ErrorState';
import { useFireRoutine } from '../../lib/api/queries';
import { useToast } from '../../lib/hooks/useToast';
import { t } from '../../lib/i18n';
import type { RoutineSummary } from '../../lib/api/types';

interface RunNowDialogProps {
  routine: RoutineSummary | null;
  onClose: () => void;
}

/**
 * La conferma dice COSA sta per succedere, non «sei sicuro?».
 *
 * La chiave di idempotenza nasce dentro la mutazione, alla conferma — non qui all'apertura:
 * aprire, chiudere e riaprire il dialogo non deve produrre una chiave che il server ha già visto
 * e che farebbe rifiutare come duplicato un fire nuovo.
 */
export function RunNowDialog({ routine, onClose }: RunNowDialogProps) {
  const fire = useFireRoutine();
  const toast = useToast();
  const navigate = useNavigate();

  if (routine === null) {
    return null;
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.dialog.runNowTitle}
      body={t.dialog.runNowBody(routine.name, routine.target_label)}
      params={[
        { key: t.nav.routines, value: routine.name },
        { key: t.routines.colTarget, value: routine.target_label },
        { key: t.runs.colReason, value: t.reason.manual },
      ]}
      confirmLabel={t.dialog.runNowConfirm}
      confirmVariant="primary"
      pending={fire.isPending}
      error={fire.isError ? <ErrorState error={fire.error} /> : undefined}
      onConfirm={() => {
        fire.mutate(
          { routineId: routine.id },
          {
            onSuccess: (result) => {
              onClose();
              toast.push({
                title: t.toast.fireStarted,
                detail: result.data.id,
                tone: 'accent',
                action: {
                  label: t.toast.openRun,
                  onClick: () => navigate(`/runs?run=${result.data.id}`),
                },
              });
            },
          },
        );
      }}
    />
  );
}
