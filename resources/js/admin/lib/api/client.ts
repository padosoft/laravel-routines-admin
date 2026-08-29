import type { Problem } from './types';

/**
 * Un errore che porta con sé il problem+json del server.
 *
 * Il `detail` che arriva dal server è già scritto per una persona: mostrarlo è meglio che
 * sostituirlo con «qualcosa è andato storto», che non dice a nessuno cosa fare dopo.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: Problem | null,
    public readonly url: string,
  ) {
    super(problem?.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
  }

  /** Errori per campo di una 422, da mostrare SOTTO il campo e mai in un toast. */
  get fieldErrors(): Record<string, string[]> {
    return this.problem?.errors ?? {};
  }

  get detail(): string | null {
    return this.problem?.detail ?? null;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  csrfToken: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Generata ALLA CONFERMA, mai all'apertura del dialogo: le reti ritentano. */
  idempotencyKey?: string;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | null | undefined>;
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.url(path, options.query);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };
    if (this.options.csrfToken !== '') {
      headers['X-CSRF-TOKEN'] = this.options.csrfToken;
    }
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.idempotencyKey !== undefined) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      credentials: 'same-origin',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new ApiError(response.status, await readProblem(response), url);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private url(path: string, query?: RequestOptions['query']): string {
    const base = this.options.baseUrl.replace(/\/$/, '');
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    if (query === undefined) {
      return url;
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      // Un filtro assente e un filtro vuoto sono la stessa cosa e non vanno in query string:
      // finirebbero nella chiave di cache e produrrebbero due entry per la stessa richiesta.
      if (value === null || value === undefined || value === '') {
        continue;
      }
      params.set(key, String(value));
    }

    const qs = params.toString();
    return qs === '' ? url : `${url}?${qs}`;
  }
}

async function readProblem(response: Response): Promise<Problem | null> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'title' in body) {
      return body as Problem;
    }
  } catch {
    // Un 502 da un proxy non parla problem+json: lo status basta a dire cosa è successo.
  }
  return null;
}

/** UUID v4. `crypto.randomUUID` non c'è ovunque (contesti non sicuri), quindi c'è il ripiego. */
export function uuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
