/**
 * Il contratto dell'Admin API di `padosoft/laravel-routines`, trascritto.
 *
 * Alcuni campi esistono in coppia — `suspension_reason` e `suspension_reason_label`,
 * `cron` e `schedule_human` — e in ogni coppia si mostra SEMPRE la seconda. Il testo leggibile lo
 * compone il server: un pannello che traducesse `target_not_registered` per conto proprio lo
 * tradurrebbe diversamente dal comando CLI, dall'email di notifica e dall'audit, e tre persone che
 * guardano lo stesso evento leggerebbero tre cose diverse.
 */

export type RoutineStatus = 'active' | 'paused' | 'suspended' | 'ended';
export type TriggerKind = 'cron' | 'once_at' | 'manual' | 'event' | 'webhook';
export type OverlapPolicy = 'skip' | 'queue' | 'overlap';
export type MissedRunPolicy = 'catch_up' | 'skip_to_next';
export type FireReason =
  | 'scheduled'
  | 'manual'
  | 'catch_up'
  | 'event'
  | 'webhook'
  | 'retry'
  | 'resumed';
export type RunOutcome = 'succeeded' | 'failed' | 'skipped' | 'paused';

export interface Capabilities {
  version: string;
  delegation: boolean;
  budgets: boolean;
  channels: boolean;
  approvals: boolean;
  timezone: string;
  currency: string;
}

export interface TargetField {
  label: string;
  type: 'string' | 'text' | 'email' | 'url' | 'number' | 'bool' | 'select' | 'json';
  required?: boolean;
  help?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface TargetDescriptor {
  type: string;
  label: string;
  summary: string;
  icon: string | null;
  fields: Record<string, TargetField>;
  action_classes: string[];
  supports_pause: boolean;
  reports_cost: boolean;
  routines_count: number;
}

export interface RoutineSummary {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  /** Mostra questo, non `owner`: `user:42` non dice niente a nessuno. */
  owner_label: string | null;
  organization_id: string | null;
  status: RoutineStatus;
  /** Slug: serve per i test e per il supporto, non per l'interfaccia. */
  suspension_reason: string | null;
  /** Già in italiano, composto dal server: è QUESTO che si mostra. */
  suspension_reason_label: string | null;
  ended_reason: string | null;
  target_type: string;
  target_label: string;
  target_icon: string | null;
  trigger_kind: TriggerKind;
  cron: string | null;
  schedule_human: string | null;
  timezone: string;
  next_run_at: string | null;
  is_overdue: boolean;
  last_fired_at: string | null;
  last_outcome: RunOutcome | null;
  runs_24h: number;
  success_rate_7d: number | null;
}

export interface Routine extends RoutineSummary {
  target_payload: Record<string, unknown>;
  once_at: string | null;
  event_name: string | null;
  overlap_policy: OverlapPolicy;
  missed_run_policy: MissedRunPolicy;
  max_attempts: number;
  timeout_seconds: number | null;
  budget_per_run: number | null;
  budget_per_period: number | null;
  budget_period: 'day' | 'week' | 'month' | null;
  budget_used_period: number | null;
  currency: string;
  initiation: 'human_request' | 'human_schedule' | 'own_followup' | 'own_initiative';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  mandate: Mandate | null;
  next_occurrences: Occurrence[];
}

export interface Occurrence {
  at: string;
  local: string;
  timezone_abbr: string;
  /** Vero quando qui cambia l'ora legale: è la domanda che l'utente si fa due volte l'anno. */
  dst_transition: boolean;
}

export interface Mandate {
  digest: string;
  payload_digest: string;
  /** Falso ⇒ il consenso era per un'altra configurazione, e va richiesto di nuovo. */
  payload_matches: boolean;
  action_classes: string[];
  budget_ceiling: number | null;
  currency: string;
  not_after: string | null;
  granted_at: string;
  consent_aal: string | null;
  delegation_grant_id: string | null;
  actor_chain: Array<{ subject: string; label: string | null }>;
}

export interface RunSummary {
  id: string;
  routine_id: string;
  routine_name: string;
  reason: FireReason;
  /** `null` = in corso. */
  outcome: RunOutcome | null;
  attempt: number;
  max_attempts: number;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  message: string | null;
  cost: number | null;
  currency: string;
  retry_at: string | null;
}

export interface Run extends RunSummary {
  idempotency_key: string;
  correlation_id: string | null;
  external_ref: string | null;
  external_url: string | null;
  metadata: Record<string, unknown> | null;
  pending_approval_id: string | null;
  /** Per un fire in pausa: che cosa voleva fare. */
  action_class: string | null;
  owner_label: string | null;
  can_approve: boolean;
}

export interface Overview {
  awaiting_human: number;
  oldest_awaiting_since: string | null;
  active_routines: number;
  paused_routines: number;
  suspended_routines: number;
  runs_24h: number;
  failed_24h: number;
  success_rate_7d: number | null;
  success_rate_delta: number | null;
  spend_7d: number | null;
  budget_utilisation: number | null;
  currency: string;
}

export interface TimelinePoint {
  date: string;
  succeeded: number;
  failed: number;
  skipped: number;
  paused: number;
}

export interface Health {
  last_tick_at: string | null;
  tick_age_seconds: number | null;
  tick_healthy: boolean;
  /** Diagnosi, non numero: «lo scheduler non gira, controlla il cron» risolve, «47 minuti fa» informa. */
  tick_diagnosis: string | null;
  overdue: Array<{ id: string; name: string; next_run_at: string; late_seconds: number }>;
  stuck_locks: Array<{ id: string; name: string; locked_until: string; locked_for_seconds: number }>;
  targets: Array<{ type: string; label: string | null; registered: boolean; routines_count: number }>;
}

export interface Page<T> {
  data: T[];
  meta: { total: number | null; per_page: number; next_cursor: string | null };
}

export interface SchedulePreview {
  occurrences: Occurrence[];
  schedule_human: string | null;
  valid: boolean;
  error: string | null;
}

/** RFC 9457 `application/problem+json`. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
