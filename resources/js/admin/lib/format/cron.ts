/**
 * Validazione SINTATTICA di un'espressione cron, per dare un riscontro mentre si scrive.
 *
 * Non produce mai la frase in italiano: quella è `schedule_human`, e arriva dal server. Un
 * pannello che la componesse da sé direbbe una cosa e il ledger un'altra, e la persona che le
 * legge entrambe non saprebbe a quale credere.
 */

const RANGES: Array<[number, number]> = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];

export function isValidCron(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return false;
  }
  return parts.every((part, index) => {
    const range = RANGES[index];
    return range !== undefined && isValidField(part, range[0], range[1]);
  });
}

function isValidField(field: string, min: number, max: number): boolean {
  if (field === '') {
    return false;
  }
  return field.split(',').every((chunk) => {
    const [rangePart, stepPart] = chunk.split('/');
    if (rangePart === undefined || chunk.split('/').length > 2) {
      return false;
    }
    if (stepPart !== undefined) {
      const step = Number(stepPart);
      if (!Number.isInteger(step) || step < 1) {
        return false;
      }
    }
    if (rangePart === '*') {
      return true;
    }
    const bounds = rangePart.split('-');
    if (bounds.length > 2) {
      return false;
    }
    const numbers = bounds.map(Number);
    if (numbers.some((n) => !Number.isInteger(n))) {
      return false;
    }
    const lo = numbers[0];
    const hi = numbers.length > 1 ? numbers[1] : numbers[0];
    if (lo === undefined || hi === undefined) {
      return false;
    }
    return lo >= min && hi <= max && lo <= hi;
  });
}

export const CRON_PRESETS: Array<{ label: string; cron: string }> = [
  { label: 'Ogni ora', cron: '0 * * * *' },
  { label: 'Ogni giorno alle 6', cron: '0 6 * * *' },
  { label: 'Ogni lunedì alle 9', cron: '0 9 * * 1' },
  { label: 'Primo del mese', cron: '0 0 1 * *' },
  { label: 'Giorni feriali alle 9', cron: '0 9 * * 1-5' },
  { label: 'Ogni 30 minuti', cron: '*/30 * * * *' },
];
