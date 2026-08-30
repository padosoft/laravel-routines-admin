import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { DynamicForm } from '../../components/DynamicForm';
import { CronBuilder } from '../../components/CronBuilder';
import { SchedulePreview } from '../../components/SchedulePreview';
import { ErrorState } from '../../components/ErrorState';
import { ApiError } from '../../lib/api/client';
import {
  useCapabilities,
  useCreateRoutine,
  useTargets,
  type CreateRoutinePayload,
} from '../../lib/api/queries';
import { useConfig } from '../../lib/hooks/useConfig';
import { useToast } from '../../lib/hooks/useToast';
import { isValidCron } from '../../lib/format/cron';
import { t } from '../../lib/i18n';

const LIMITS = {
  overlap: [
    { value: 'skip', label: 'Salta', help: 'Questa occorrenza non parte e resta nel ledger come saltata.' },
    { value: 'queue', label: 'Accoda', help: 'Parte appena il fire precedente finisce.' },
    { value: 'overlap', label: 'Esegui comunque', help: 'Due esecuzioni in parallelo. Solo se il bersaglio è idempotente.' },
  ],
  missed: [
    { value: 'catch_up', label: 'Recupera le esecuzioni perse', help: 'Esegue una volta per ogni occorrenza mancata.' },
    { value: 'skip_to_next', label: 'Riparti dalla prossima', help: 'Dimentica il passato e riprende dal prossimo orario.' },
  ],
  attempts: [
    { value: '1', label: '1 tentativo', help: 'Nessun nuovo tentativo in caso di errore.' },
    { value: '3', label: '3 tentativi', help: 'Riproverà dopo 1′, 2′, 4′.' },
    { value: '5', label: '5 tentativi', help: 'Riproverà dopo 1′, 2′, 4′, 8′, 16′.' },
  ],
  timeout: [
    { value: '30', label: '30 secondi', help: 'Per bersagli sincroni e veloci.' },
    { value: '300', label: '5 minuti', help: 'Default per agenti e flussi.' },
    { value: '1800', label: '30 minuti', help: 'Per elaborazioni lunghe.' },
  ],
} as const;

const TIMEZONES = [
  'Europe/Rome',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Berlin',
  'America/New_York',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'UTC',
];

type Kind = 'cron' | 'once_at' | 'manual' | 'event';

export function WizardScreen() {
  const { timezone: defaultTimezone } = useConfig();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: targets } = useTargets();
  const { data: capabilities } = useCapabilities();
  const create = useCreateRoutine();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<string | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [kind, setKind] = useState<Kind>('cron');
  const [cron, setCron] = useState('0 6 * * 1-5');
  const [onceAt, setOnceAt] = useState('');
  const [eventName, setEventName] = useState('');
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [limits, setLimits] = useState({
    overlap: 'skip',
    missed: 'skip_to_next',
    attempts: '3',
    timeout: '300',
  });

  const target = useMemo(
    () => (targets ?? []).find((candidate) => candidate.type === targetType) ?? null,
    [targets, targetType],
  );

  // Gli errori 422 arrivano dal server per campo e restano attaccati al campo. In un toast
  // scomparirebbero dopo sette secondi, e la persona resterebbe davanti a un form che non le
  // dice più che cosa non andava.
  const fieldErrors = create.error instanceof ApiError ? create.error.fieldErrors : {};

  const scheduleValid =
    kind === 'cron' ? isValidCron(cron) : kind === 'once_at' ? onceAt !== '' : kind === 'event' ? eventName !== '' : true;
  const canContinue =
    step === 1 ? name.trim() !== '' && target !== null : step === 2 ? scheduleValid : true;

  const submit = () => {
    if (target === null) {
      return;
    }
    const body: CreateRoutinePayload = {
      name: name.trim(),
      description: description.trim() === '' ? null : description.trim(),
      target_type: target.type,
      target_payload: payload,
      trigger_kind: kind,
      cron: kind === 'cron' ? cron : null,
      once_at: kind === 'once_at' && onceAt !== '' ? new Date(onceAt).toISOString() : null,
      event_name: kind === 'event' ? eventName : null,
      timezone,
      overlap_policy: limits.overlap,
      missed_run_policy: limits.missed,
      max_attempts: Number(limits.attempts),
      timeout_seconds: Number(limits.timeout),
      budget_per_run: null,
    };

    create.mutate(body, {
      onSuccess: (result) => {
        toast.push({ title: t.toast.created, detail: result.data.name, tone: 'ok' });
        navigate(`/routines/${result.data.id}`);
      },
      // Un 422 riporta al passo che contiene i campi sbagliati: lasciare la persona sul
      // riepilogo, con l'errore due passi indietro, è il modo più sicuro di farla arrendere.
      onError: (error) => {
        if (error instanceof ApiError && error.status === 422) {
          setStep(1);
        }
      },
    });
  };

  return (
    <div className="flex max-w-[820px] flex-col gap-5">
      <Link to="/routines" className="w-fit text-xs text-ink-subtle no-underline hover:text-ink">
        {t.wizard.cancel}
      </Link>
      <h1 className="m-0 text-xl font-semibold tracking-[-0.02em]">{t.wizard.title}</h1>

      {/*
        Sotto `sm` restano i quattro numeri con la linea che li unisce: l'etichetta di ogni
        passo («Bersaglio», «Pianificazione», …) non ci sta e troncata non aiuta nessuno.
        Il titolo del passo corrente è comunque scritto sopra la scheda che si sta compilando.
      */}
      <ol className="m-0 flex list-none items-center gap-2 p-0">
        {[t.wizard.step1, t.wizard.step2, t.wizard.step3, t.wizard.step4].map((label, index) => {
          const n = index + 1;
          const active = step === n;
          const done = step > n;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(n)}
                aria-current={active ? 'step' : undefined}
                className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span
                  className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    active
                      ? 'bg-accent text-on-accent'
                      : done
                        ? 'bg-accent-subtle text-accent'
                        : 'bg-surface-muted text-ink-subtle'
                  }`}
                >
                  {n}
                </span>
                <span
                  className={`hidden whitespace-nowrap text-xs font-medium sm:inline ${active ? 'text-ink' : 'text-ink-subtle'}`}
                >
                  {label}
                </span>
                <span className="sr-only sm:hidden">{label}</span>
              </button>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </li>
          );
        })}
      </ol>

      {create.isError && !(create.error instanceof ApiError && create.error.status === 422) ? (
        <ErrorState error={create.error} />
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">{t.wizard.nameLabel}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.wizard.namePlaceholder}
                aria-invalid={(fieldErrors['name'] ?? []).length > 0}
                className={`h-[34px] rounded-[6px] border bg-canvas px-2.5 text-[13px] text-ink outline-none ${
                  (fieldErrors['name'] ?? []).length > 0
                    ? 'border-danger'
                    : 'border-border focus:border-accent'
                }`}
              />
              {(fieldErrors['name'] ?? []).length > 0 ? (
                <span className="text-[11px] text-danger">{fieldErrors['name']?.join(' ')}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">{t.wizard.descriptionLabel}</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.wizard.descriptionPlaceholder}
                className="h-[34px] rounded-[6px] border border-border bg-canvas px-2.5 text-[13px] text-ink outline-none focus:border-accent"
              />
            </label>
          </Card>

          <span className="text-[13px] font-semibold">{t.wizard.step1}</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {(targets ?? []).map((candidate) => (
              <button
                key={candidate.type}
                type="button"
                aria-pressed={candidate.type === targetType}
                onClick={() => {
                  setTargetType(candidate.type);
                  setPayload({});
                }}
                className={`flex cursor-pointer flex-col gap-1.5 rounded-[10px] border bg-surface p-4 text-left shadow-card transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  candidate.type === targetType
                    ? 'border-accent'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                <span className="text-sm font-semibold">{candidate.label}</span>
                <span className="text-xs text-ink-muted">{candidate.summary}</span>
                <span className="mt-1 font-mono text-[11px] text-ink-subtle">
                  {candidate.action_classes.join(' · ')}
                </span>
              </button>
            ))}
          </div>

          {target === null ? null : (
            <Card className="flex flex-col gap-3.5">
              <span className="text-[13px] font-semibold">{t.wizard.params(target.label)}</span>
              {/* Il form è generato dai `fields` del descrittore: il pannello non conosce i bersagli. */}
              <DynamicForm
                fields={target.fields}
                values={payload}
                errors={fieldErrors}
                onChange={(key, value) =>
                  setPayload((current) => ({ ...current, [key]: value }))
                }
              />
            </Card>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-0.5 border-b border-border">
            {(
              [
                ['cron', t.wizard.kindCron],
                ['once_at', t.wizard.kindOnce],
                ['manual', t.wizard.kindManual],
                ['event', t.wizard.kindEvent],
              ] as Array<[Kind, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={`h-[34px] cursor-pointer border-0 border-b-2 bg-transparent px-3.5 text-[13px] font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  kind === value
                    ? 'border-b-accent text-accent'
                    : 'border-b-transparent text-ink-subtle hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {kind === 'cron' ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <CronBuilder
                cron={cron}
                timezone={timezone}
                timezones={TIMEZONES}
                onCronChange={setCron}
                onTimezoneChange={setTimezone}
              />
              {/* Cinque date vere prima di salvare: è ciò che evita lo schedule «ovvio» e sbagliato. */}
              <SchedulePreview cron={cron} timezone={timezone} enabled={isValidCron(cron)} />
            </div>
          ) : null}

          {kind === 'once_at' ? (
            <Card>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">{t.wizard.onceLabel}</span>
                <input
                  type="datetime-local"
                  value={onceAt}
                  onChange={(e) => setOnceAt(e.target.value)}
                  className="h-[34px] w-fit rounded-[6px] border border-border bg-canvas px-2.5 text-[13px] text-ink outline-none focus:border-accent"
                />
                <span className="text-[11px] text-ink-subtle">{t.wizard.timezoneHelp}</span>
              </label>
            </Card>
          ) : null}

          {kind === 'manual' ? (
            <Card>
              <p className="m-0 text-[13px] text-ink-muted">{t.wizard.manualHelp}</p>
            </Card>
          ) : null}

          {kind === 'event' ? (
            <Card>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">{t.wizard.eventLabel}</span>
                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder={t.wizard.eventPlaceholder}
                  className="h-[34px] rounded-[6px] border border-border bg-canvas px-2.5 font-mono text-[13px] text-ink outline-none focus:border-accent"
                />
              </label>
            </Card>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-3">
          {(
            [
              ['overlap', 'Se il fire precedente sta ancora girando'],
              ['missed', 'Se il sistema era fermo'],
              ['attempts', t.detail.settingAttempts],
              ['timeout', t.detail.settingTimeout],
            ] as Array<[keyof typeof LIMITS, string]>
          ).map(([key, title]) => (
            <Card key={key} className="flex flex-col gap-2.5">
              <span className="text-[13px] font-semibold">{title}</span>
              <div className="flex flex-wrap gap-2">
                {LIMITS[key].map((option) => {
                  const on = limits[key] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setLimits((current) => ({ ...current, [key]: option.value }))}
                      className={`flex min-w-[180px] flex-1 cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        on
                          ? 'border-accent bg-accent-subtle'
                          : 'border-border bg-surface hover:border-border-strong'
                      }`}
                    >
                      <span
                        className={`text-[13px] font-medium ${on ? 'text-accent' : 'text-ink'}`}
                      >
                        {option.label}
                      </span>
                      {/* Il backoff scritto in chiaro: «3 tentativi» non dice quando. */}
                      <span className="text-[11px] text-ink-muted">{option.help}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 !p-6">
            <p className="m-0 max-w-[60ch] text-base leading-[1.6]">
              {t.wizard.summarySentence(
                name || '—',
                target?.label ?? '—',
                kind === 'cron' ? cron : kind === 'manual' ? t.wizard.kindManual : kind,
                timezone,
              )}
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-ink-muted">{t.wizard.grantedClasses}</span>
              <div className="flex flex-wrap gap-2">
                {(target?.action_classes ?? []).map((actionClass) => (
                  <span
                    key={actionClass}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ok-subtle px-2.5 py-1 font-mono text-[11px] text-ok"
                  >
                    ✓ {actionClass}
                  </span>
                ))}
              </div>
            </div>
          </Card>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep(3)}>
              {t.app.back}
            </Button>
            <Button variant="primary" disabled={create.isPending} onClick={submit}>
              {capabilities?.delegation === true
                ? t.wizard.authorizeAndActivate
                : t.wizard.activate}
            </Button>
          </div>
        </div>
      ) : null}

      {step < 4 ? (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
            {t.app.back}
          </Button>
          <Button variant="primary" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
            {t.app.continue}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
