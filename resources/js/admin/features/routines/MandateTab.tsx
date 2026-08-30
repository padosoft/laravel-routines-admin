import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CopyButton } from '../../components/CopyButton';
import { useConfig } from '../../lib/hooks/useConfig';
import { formatDateTime } from '../../lib/format/date';
import { formatMoney } from '../../lib/format/money';
import { t } from '../../lib/i18n';
import type { Mandate } from '../../lib/api/types';

interface MandateTabProps {
  mandate: Mandate | null;
  currency: string;
}

export function MandateTab({ mandate, currency }: MandateTabProps) {
  const { locale, timezone } = useConfig();

  if (mandate === null) {
    return (
      <Card>
        <p className="m-0 text-[13px] text-ink-muted">{t.detail.mandateNone}</p>
      </Card>
    );
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-4">
      {/*
        `payload_matches === false` significa che la configurazione è cambiata DOPO il consenso.
        Non è un dettaglio da nota a piè di pagina: il mandato non copre più ciò che la routine
        farebbe, ed è lo stesso principio del dynamic linking PSD2 — cambiare l'importo dopo la
        conferma invalida la conferma.
      */}
      {mandate.payload_matches ? null : (
        <div className="flex items-center gap-3.5 rounded-[10px] border border-border border-l-[3px] border-l-danger bg-danger-subtle px-[18px] py-3.5">
          <span className="text-[13px] font-semibold text-danger">{t.detail.mandateStale}</span>
          <Button variant="danger" className="ml-auto">
            {t.detail.mandateRenew}
          </Button>
        </div>
      )}

      <Card>
        <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-[200px_1fr] sm:gap-y-3">
          <dt className="text-ink-subtle">{t.detail.actorChain}</dt>
          <dd className="m-0 font-mono text-xs">
            {mandate.actor_chain.map((actor) => actor.label ?? actor.subject).join(' → ')}
          </dd>

          <dt className="text-ink-subtle">{t.detail.actionClasses}</dt>
          <dd className="m-0 flex flex-wrap gap-1.5">
            {mandate.action_classes.map((actionClass) => (
              <span
                key={actionClass}
                className="inline-flex items-center gap-1.5 rounded-full bg-ok-subtle px-2.5 py-1 font-mono text-[11px] text-ok"
              >
                ✓ {actionClass}
              </span>
            ))}
          </dd>

          <dt className="text-ink-subtle">{t.detail.ceiling}</dt>
          <dd className="m-0 tabular-nums">
            {formatMoney(mandate.budget_ceiling, mandate.currency || currency, locale)}
          </dd>

          <dt className="text-ink-subtle">{t.detail.notAfter}</dt>
          <dd className="m-0 tabular-nums">
            {formatDateTime(mandate.not_after, { locale, timeZone: timezone })}
          </dd>

          <dt className="text-ink-subtle">{t.detail.consent}</dt>
          <dd className="m-0">
            {mandate.consent_aal ?? '—'} ·{' '}
            {formatDateTime(mandate.granted_at, { locale, timeZone: timezone })}
          </dd>

          <dt className="text-ink-subtle">{t.detail.digest}</dt>
          <dd className="m-0 flex items-center gap-2">
            <span className="min-w-0 break-all font-mono text-xs">{mandate.payload_digest}</span>
            <CopyButton value={mandate.payload_digest} />
          </dd>
        </dl>
      </Card>
    </div>
  );
}
