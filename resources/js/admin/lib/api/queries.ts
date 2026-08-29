import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { uuidV4 } from './client';
import { keys, type RoutineFilters, type RunFilters } from './keys';
import type {
  Capabilities,
  Health,
  Overview,
  Page,
  Routine,
  RoutineSummary,
  Run,
  RunSummary,
  SchedulePreview,
  TargetDescriptor,
  TimelinePoint,
} from './types';

/**
 * Un solo data layer, e le sue due regole.
 *
 * `staleTime`: liste 15 s, dettagli 30 s, capabilities e targets `Infinity` — non cambiano
 * mentre la pagina è aperta, e rileggerli sarebbe rumore.
 *
 * `refetchIntervalInBackground: false` ovunque: una scheda dimenticata in secondo piano non deve
 * interrogare il server per giorni.
 */

const LIST_STALE = 15_000;
const DETAIL_STALE = 30_000;

export function useCapabilities() {
  const api = useApi();
  return useQuery({
    queryKey: keys.capabilities(),
    queryFn: () => api.request<Capabilities>('/capabilities'),
    staleTime: Infinity,
  });
}

export function useTargets() {
  const api = useApi();
  return useQuery({
    queryKey: keys.targets(),
    queryFn: () => api.request<{ data: TargetDescriptor[] }>('/targets'),
    staleTime: Infinity,
    select: (payload) => payload.data,
  });
}

export function useRoutines(filters: RoutineFilters) {
  const api = useApi();
  return useQuery({
    queryKey: keys.routines(filters),
    queryFn: () =>
      api.request<Page<RoutineSummary>>('/routines', {
        query: {
          status: filters.status === 'all' ? undefined : filters.status,
          q: filters.q,
          target_type: filters.target_type,
          cursor: filters.cursor,
        },
      }),
    staleTime: LIST_STALE,
  });
}

export function useRoutine(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: keys.routine(id ?? ''),
    queryFn: () => api.request<{ data: Routine }>(`/routines/${id ?? ''}`),
    enabled: id !== undefined && id !== '',
    staleTime: DETAIL_STALE,
    select: (payload) => payload.data,
  });
}

export function useRuns(filters: RunFilters) {
  const api = useApi();
  return useQuery({
    queryKey: keys.runs(filters),
    queryFn: () =>
      api.request<Page<RunSummary>>('/runs', {
        query: {
          routine_id: filters.routine_id,
          outcome: filters.outcome === 'all' ? undefined : filters.outcome,
          reason: filters.reason,
          cursor: filters.cursor,
        },
      }),
    staleTime: LIST_STALE,
  });
}

/**
 * Il dettaglio di un fire IN CORSO si aggiorna ogni 5 s, e smette appena `outcome` esiste.
 * Continuare a interrogare un run concluso è lavoro che non cambierà mai risposta.
 */
export function useRun(id: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: keys.run(id ?? ''),
    queryFn: () => api.request<{ data: Run }>(`/runs/${id ?? ''}`),
    enabled: id !== null && id !== '',
    staleTime: DETAIL_STALE,
    select: (payload) => payload.data,
    refetchInterval: (query) =>
      query.state.data?.data.outcome === null ? 5_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useOverview() {
  const api = useApi();
  return useQuery({
    queryKey: keys.overview(),
    queryFn: () => api.request<{ data: Overview }>('/stats/overview'),
    staleTime: LIST_STALE,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    select: (payload) => payload.data,
  });
}

export function useTimeline(days = 30) {
  const api = useApi();
  return useQuery({
    queryKey: keys.timeline(days),
    queryFn: () =>
      api.request<{ data: TimelinePoint[] }>('/stats/timeline', { query: { days } }),
    staleTime: 60_000,
    select: (payload) => payload.data,
  });
}

/** La coda che dà il nome al prodotto: più vecchia in cima, ricontrollata ogni 30 s. */
export function useAttention() {
  const api = useApi();
  return useQuery({
    queryKey: keys.attention(),
    queryFn: () => api.request<{ data: Run[] }>('/attention'),
    staleTime: LIST_STALE,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    select: (payload) => payload.data,
  });
}

/** 15 s, ma solo mentre la pagina Salute è aperta: è il senso di `enabled`. */
export function useHealth(enabled = true) {
  const api = useApi();
  return useQuery({
    queryKey: keys.health(),
    queryFn: () => api.request<{ data: Health }>('/health'),
    enabled,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    select: (payload) => payload.data,
  });
}

/**
 * L'anteprima delle prossime esecuzioni. Non richiede una routine esistente perché serve nel
 * wizard, PRIMA che ci sia qualcosa da salvare — ed è la cosa che previene la classe di bug più
 * comune del prodotto: uno schedule che sembra giusto e parte a un'altra ora.
 */
export function useSchedulePreview(cron: string, timezone: string, enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: keys.schedulePreview(cron, timezone),
    queryFn: () =>
      api.request<{ data: SchedulePreview }>('/schedule/preview', {
        method: 'POST',
        body: { cron, timezone, count: 5 },
      }),
    enabled,
    staleTime: DETAIL_STALE,
    select: (payload) => payload.data,
  });
}

// ── Mutazioni ───────────────────────────────────────────────────────────────

interface FireVariables {
  routineId: string;
  input?: Record<string, unknown>;
}

/**
 * Esegui adesso. Nessun ottimismo: è un'azione con un effetto nel mondo reale, e il pannello deve
 * mostrare quello che è successo davvero, non quello che sperava succedesse.
 *
 * La chiave di idempotenza nasce QUI, alla conferma — non all'apertura del dialogo: se nascesse
 * prima, un dialogo aperto, chiuso e riaperto rifiuterebbe il secondo tentativo come duplicato.
 */
export function useFireRoutine(): UseMutationResult<{ data: RunSummary }, Error, FireVariables> {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: FireVariables) =>
      api.request<{ data: RunSummary }>(`/routines/${vars.routineId}/fire`, {
        method: 'POST',
        body: { input: vars.input ?? {} },
        idempotencyKey: uuidV4(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['runs'] });
      void queryClient.invalidateQueries({ queryKey: ['overview'] });
      void queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

interface ResolveVariables {
  runId: string;
  note?: string;
}

export function useApproveRun(): UseMutationResult<{ data: Run }, Error, ResolveVariables> {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: ResolveVariables) =>
      api.request<{ data: Run }>(`/runs/${vars.runId}/approve`, {
        method: 'POST',
        body: { note: vars.note ?? '' },
        idempotencyKey: uuidV4(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attention'] });
      void queryClient.invalidateQueries({ queryKey: ['overview'] });
      void queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

interface RejectVariables {
  runId: string;
  reason: string;
}

/** Il motivo è obbligatorio: qualcuno lo leggerà, tipicamente chi si chiede perché non è stato fatto. */
export function useRejectRun(): UseMutationResult<{ data: Run }, Error, RejectVariables> {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: RejectVariables) =>
      api.request<{ data: Run }>(`/runs/${vars.runId}/reject`, {
        method: 'POST',
        body: { reason: vars.reason },
        idempotencyKey: uuidV4(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attention'] });
      void queryClient.invalidateQueries({ queryKey: ['overview'] });
      void queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

interface LifecycleVariables {
  routineId: string;
  action: 'pause' | 'resume';
}

/**
 * L'unica mutazione ottimistica del pannello, e vale la pena dire perché: mettere in pausa è
 * reversibile, immediato e senza effetti fuori dal sistema. Approvare, rifiutare ed eseguire no —
 * mostrarli come riusciti prima che lo siano sarebbe raccontare una cosa non ancora vera.
 */
export function usePauseResume(): UseMutationResult<
  { data: Routine },
  Error,
  LifecycleVariables,
  { previous: unknown }
> {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: LifecycleVariables) =>
      api.request<{ data: Routine }>(`/routines/${vars.routineId}/${vars.action}`, {
        method: 'POST',
      }),
    onMutate: async (vars) => {
      const key = keys.routine(vars.routineId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: { data: Routine } | undefined) =>
        old === undefined
          ? old
          : {
              data: { ...old.data, status: vars.action === 'pause' ? 'paused' : 'active' },
            },
      );
      return { previous };
    },
    onError: (_error, vars, context) => {
      if (context !== undefined) {
        queryClient.setQueryData(keys.routine(vars.routineId), context.previous);
      }
    },
    onSettled: (_data, _error, vars) => {
      void queryClient.invalidateQueries({ queryKey: keys.routine(vars.routineId) });
      void queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

interface EndVariables {
  routineId: string;
  reason: string;
}

export function useEndRoutine(): UseMutationResult<{ data: Routine }, Error, EndVariables> {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: EndVariables) =>
      api.request<{ data: Routine }>(`/routines/${vars.routineId}/end`, {
        method: 'POST',
        body: { reason: vars.reason },
      }),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: keys.routine(vars.routineId) });
      void queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export interface CreateRoutinePayload {
  name: string;
  description: string | null;
  target_type: string;
  target_payload: Record<string, unknown>;
  trigger_kind: string;
  cron: string | null;
  once_at: string | null;
  event_name: string | null;
  timezone: string;
  overlap_policy: string;
  missed_run_policy: string;
  max_attempts: number;
  timeout_seconds: number | null;
  budget_per_run: number | null;
}

export function useCreateRoutine(): UseMutationResult<
  { data: Routine },
  Error,
  CreateRoutinePayload
> {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRoutinePayload) =>
      api.request<{ data: Routine }>('/routines', { method: 'POST', body: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}
