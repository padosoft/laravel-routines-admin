import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'routines-admin-theme';

export type Theme = 'dark' | 'light';

function preferredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    // Storage bloccato (finestra privata, cookie di terze parti): resta la preferenza di sistema.
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

/** Scuro di default; la classe `light` sull'`<html>` è ciò che ribalta i token. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(preferredTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Il tema resta applicato per questa sessione: non poterlo ricordare non è un errore.
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggle };
}
