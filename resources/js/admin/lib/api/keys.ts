import type { RoutineStatus, RunOutcome } from './types';

export interface RoutineFilters {
  status?: RoutineStatus | 'all';
  q?: string;
  target_type?: string;
  cursor?: string;
}

export interface RunFilters {
  routine_id?: string;
  outcome?: RunOutcome | 'running' | 'all';
  reason?: string;
  cursor?: string;
}

/**
 * Chiavi gerarchiche: invalidare `['routines']` invalida ogni lista filtrata, e non serve
 * ricordarsi quali filtri erano attivi quando la mutazione è partita.
 */
export const keys = {
  capabilities: () => ['capabilities'] as const,
  targets: () => ['targets'] as const,
  routines: (filters: RoutineFilters = {}) => ['routines', filters] as const,
  routine: (id: string) => ['routine', id] as const,
  runs: (filters: RunFilters = {}) => ['runs', filters] as const,
  run: (id: string) => ['run', id] as const,
  overview: () => ['overview'] as const,
  timeline: (days: number) => ['timeline', days] as const,
  attention: () => ['attention'] as const,
  health: () => ['health'] as const,
  schedulePreview: (cron: string, timezone: string) =>
    ['schedule-preview', cron, timezone] as const,
} as const;
