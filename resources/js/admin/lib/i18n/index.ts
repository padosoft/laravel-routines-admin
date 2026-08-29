import { it, type Dictionary } from './it';

/**
 * Il dizionario è tipizzato e si accede direttamente: `t.routines.title`.
 *
 * Nessun `t('routines.title')` con chiave stringa, deliberatamente — una chiave sbagliata
 * scritta così è un errore di compilazione invece di una stringa mancante che si scopre
 * guardando lo schermo.
 */
export const t: Dictionary = it;

export type { Dictionary };
