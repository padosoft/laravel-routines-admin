import { useConfig } from './useConfig';

export type Permission =
  | 'routines.read'
  | 'routines.write'
  | 'routines.fire'
  | 'routines.approve';

/**
 * Fail-closed, come il Gate lato server: un permesso che non compare nella lista è negato.
 *
 * Il costo di doverli dichiarare è un fastidio; il costo del contrario è un'automazione avviata
 * da chi non doveva.
 */
export function usePermission(permission: Permission): boolean {
  return useConfig().can.includes(permission);
}
