import { Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { formatElapsed } from '../../lib/format/date';
import { t } from '../../lib/i18n';

interface AwaitingBannerProps {
  count: number;
  oldestSince: string | null;
}

/**
 * A zero questa fascia NON ESISTE — e non viene sostituita da un riquadro verde «tutto ok».
 *
 * Un riquadro che compare sempre smette di essere letto nel giro di una settimana; uno che
 * compare solo quando c'è qualcosa da fare resta la prima cosa che si guarda per anni.
 */
export function AwaitingBanner({ count, oldestSince }: AwaitingBannerProps) {
  const navigate = useNavigate();

  if (count === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-border border-l-[3px] border-l-attention bg-attention-subtle px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
      <Pause
        className="size-[18px] shrink-0 text-attention"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <strong className="text-sm font-semibold">{t.overview.awaitingHeadline(count)}</strong>
        {oldestSince === null ? null : (
          <span className="text-xs text-ink-muted">
            {t.overview.awaitingOldest(formatElapsed(oldestSince))}
          </span>
        )}
      </div>
      {/*
        `shrink-0`: comprimere il comando che porta ALLA coda in attesa e' l'ultima cosa da
        fare in questa fascia. Su telefono va a capo e prende tutta la riga.
      */}
      <Button
        variant="attention"
        className="w-full shrink-0 sm:ml-auto sm:w-auto"
        onClick={() => navigate('/attention')}
      >
        {t.overview.seeThem}
      </Button>
    </div>
  );
}
