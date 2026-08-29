/**
 * La configurazione arriva dai `data-*` del div montato dal Blade, non da un file compilato:
 * il pannello è spedito come pacchetto e l'applicazione ospite decide base URL, locale e fuso.
 */

export interface AdminConfig {
  apiBase: string;
  csrfToken: string;
  appName: string;
  locale: string;
  timezone: string;
  logoutUrl: string | null;
  /** Permessi concessi dall'host. Assente = negato: fail-closed, come il Gate lato server. */
  can: string[];
}

const DEFAULTS: AdminConfig = {
  apiBase: '/api/routines/v1',
  csrfToken: '',
  appName: 'Routines',
  locale: 'it',
  timezone: 'UTC',
  logoutUrl: null,
  can: [],
};

export function readConfig(root: HTMLElement | null): AdminConfig {
  if (root === null) {
    return DEFAULTS;
  }

  const can = (root.dataset.can ?? '')
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => slug !== '');

  return {
    apiBase: root.dataset.apiBase || DEFAULTS.apiBase,
    csrfToken: root.dataset.csrfToken ?? '',
    appName: root.dataset.appName || DEFAULTS.appName,
    locale: root.dataset.locale || DEFAULTS.locale,
    timezone: root.dataset.timezone || DEFAULTS.timezone,
    logoutUrl: root.dataset.logoutUrl || null,
    can,
  };
}
