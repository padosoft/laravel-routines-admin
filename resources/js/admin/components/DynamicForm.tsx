import type { TargetField } from '../lib/api/types';

interface DynamicFormProps {
  fields: Record<string, TargetField>;
  values: Record<string, unknown>;
  /** Errori 422 per campo. Vanno SOTTO il campo: in un toast sparirebbero prima di essere letti. */
  errors: Record<string, string[]>;
  onChange: (key: string, value: unknown) => void;
}

/**
 * Il form è GENERATO dai `fields` del `TargetDescriptor`.
 *
 * È ciò che permette al pannello di disegnare la configurazione di un bersaglio che non ha mai
 * visto: chi scrive un bersaglio dichiara i suoi campi, e il pannello li rende — senza che questo
 * pacchetto debba conoscerne uno solo.
 */
export function DynamicForm({ fields, values, errors, onChange }: DynamicFormProps) {
  const entries = Object.entries(fields);

  if (entries.length === 0) {
    return (
      <p className="m-0 text-[13px] text-ink-muted">
        Questo bersaglio non ha parametri da configurare.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {entries.map(([key, field]) => {
        const fieldErrors = errors[key] ?? [];
        const invalid = fieldErrors.length > 0;
        const value = values[key];
        const describedBy = `${key}-help`;

        return (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">
              {field.label}
              {field.required === true ? <span className="text-danger"> *</span> : null}
            </span>

            {renderControl(key, field, value, invalid, describedBy, onChange)}

            {invalid ? (
              <span id={describedBy} className="text-[11px] text-danger">
                {fieldErrors.join(' ')}
              </span>
            ) : field.help !== undefined && field.help !== '' ? (
              <span id={describedBy} className="text-[11px] text-ink-subtle">
                {field.help}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

const CONTROL =
  'rounded-[6px] border bg-canvas px-2.5 text-[13px] text-ink outline-none transition-colors duration-150 ease-out';

function renderControl(
  key: string,
  field: TargetField,
  value: unknown,
  invalid: boolean,
  describedBy: string,
  onChange: (key: string, value: unknown) => void,
) {
  const border = invalid ? 'border-danger' : 'border-border focus:border-accent';
  const common = {
    id: key,
    'aria-invalid': invalid,
    'aria-describedby': describedBy,
  };

  if (field.type === 'text' || field.type === 'json') {
    return (
      <textarea
        {...common}
        rows={field.type === 'json' ? 5 : 3}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(key, e.target.value)}
        className={`${CONTROL} ${border} resize-y py-2 ${field.type === 'json' ? 'font-mono text-xs' : ''}`}
      />
    );
  }

  if (field.type === 'bool') {
    return (
      <input
        {...common}
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(key, e.target.checked)}
        className="size-4 accent-[var(--color-accent)]"
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        {...common}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(key, e.target.value)}
        className={`${CONTROL} ${border} h-[34px]`}
      >
        <option value="">—</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const inputType =
    field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text';

  return (
    <input
      {...common}
      type={inputType}
      value={value === null || value === undefined ? '' : String(value)}
      onChange={(e) =>
        onChange(key, field.type === 'number' ? Number(e.target.value) : e.target.value)
      }
      className={`${CONTROL} ${border} h-[34px]`}
    />
  );
}
