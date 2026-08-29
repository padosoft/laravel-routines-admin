import { CRON_PRESETS, isValidCron } from '../lib/format/cron';
import { t } from '../lib/i18n';

interface CronBuilderProps {
  cron: string;
  timezone: string;
  timezones: string[];
  onCronChange: (cron: string) => void;
  onTimezoneChange: (timezone: string) => void;
}

/**
 * Preset e campo cron. La validazione qui è solo sintattica e serve a dare un riscontro mentre
 * si scrive: la frase in italiano e le date vere arrivano dal server (vedi `SchedulePreview`).
 */
export function CronBuilder({
  cron,
  timezone,
  timezones,
  onCronChange,
  onTimezoneChange,
}: CronBuilderProps) {
  const valid = isValidCron(cron);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CRON_PRESETS.map((preset) => {
          const on = preset.cron === cron;
          return (
            <button
              key={preset.cron}
              type="button"
              aria-pressed={on}
              onClick={() => onCronChange(preset.cron)}
              className={`h-8 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                on
                  ? 'border-accent bg-accent-subtle text-accent'
                  : 'border-border bg-surface text-ink-muted hover:border-border-strong'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3.5 rounded-[10px] border border-border bg-surface p-5 shadow-card">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">{t.wizard.cronLabel}</span>
          <input
            value={cron}
            aria-label={t.wizard.cronLabel}
            aria-invalid={!valid}
            onChange={(e) => onCronChange(e.target.value)}
            className={`h-9 rounded-[6px] border bg-canvas px-2.5 font-mono text-[13px] text-ink outline-none ${
              valid ? 'border-border focus:border-accent' : 'border-danger'
            }`}
          />
          {valid ? null : <span className="text-xs text-danger">{t.wizard.cronInvalid}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">{t.wizard.timezoneLabel}</span>
          <select
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="h-[34px] rounded-[6px] border border-border bg-canvas px-2 text-[13px] text-ink outline-none focus:border-accent"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-ink-subtle">{t.wizard.timezoneHelp}</span>
        </label>
      </div>
    </div>
  );
}
