import { useCallback, useSyncExternalStore } from 'react';

/**
 * Le scelte STRUTTURALI del layout — una colonna che sparisce, una sidebar che diventa un
 * cassetto, `inert` su un pannello fuori schermo — non si possono fare con una classe Tailwind:
 * quella nasconde, non smonta. Un elemento nascosto con `hidden` resta nel DOM, resta
 * raggiungibile col tab e resta annunciato dallo screen reader. Per quelle serve sapere
 * davvero quanto è largo lo schermo.
 *
 * Lo styling (padding, dimensioni, gap) resta invece nelle classi `sm:`/`md:`/`lg:`: quello
 * il CSS lo fa meglio, e senza un render in più.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** I due punti di rottura che il pannello usa per decidere la struttura, non lo stile. */
export const DESKTOP = '(min-width: 1024px)';
export const WIDE_TABLE = '(min-width: 768px)';
