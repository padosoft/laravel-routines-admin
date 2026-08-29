import '@testing-library/jest-dom/vitest';

/**
 * jsdom non implementa `matchMedia`, e `useTheme` lo interroga per la preferenza di sistema.
 * Senza questo ogni test che monta la Shell fallisce prima di arrivare all'asserzione.
 */
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
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
