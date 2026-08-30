import '@testing-library/jest-dom/vitest';

/**
 * jsdom non implementa `matchMedia`, e il pannello lo interroga in due punti: `useTheme` per la
 * preferenza di sistema e `useMediaQuery` per le scelte strutturali del layout.
 *
 * Le `min-width` rispondono `true`: i test girano come su un desktop, che è il caso in cui la
 * tabella ha tutte le sue colonne. Un test che vuole il telefono ridefinisce `matchMedia` da sé.
 */
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
