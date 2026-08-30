import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { ToastViewport } from '../components/Toast';
import { t } from '../lib/i18n';

const CRUMBS: Array<[RegExp, string]> = [
  [/^\/$/, t.nav.overview],
  [/^\/routines\/new$/, t.wizard.title],
  [/^\/routines\/[^/]+$/, t.nav.routines],
  [/^\/routines$/, t.nav.routines],
  [/^\/attention$/, t.attention.title],
  [/^\/runs$/, t.nav.runs],
  [/^\/health$/, t.nav.health],
];

export function Shell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const crumb = CRUMBS.find(([pattern]) => pattern.test(location.pathname))?.[1] ?? t.app.title;

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  // Il cassetto si chiude quando la rotta cambia — anche se il cambio non è arrivato da una
  // voce di menu (una scorciatoia `g r`, il back del browser, la palette). Chiudere solo
  // nell'`onClick` del link lascerebbe il pannello aperto sopra la pagina nuova.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      // Le scorciatoie a lettera restano ferme mentre si scrive: `g` dentro un campo di
      // ricerca è una lettera, non un comando.
      if (typing || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === 'g') {
        const onSecond = (next: KeyboardEvent) => {
          const map: Record<string, string> = {
            r: '/routines',
            a: '/attention',
            u: '/runs',
            h: '/health',
            o: '/',
          };
          const to = map[next.key];
          if (to !== undefined) {
            next.preventDefault();
            navigate(to);
          }
          window.removeEventListener('keydown', onSecond);
        };
        window.addEventListener('keydown', onSecond, { once: true });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="grid min-h-screen grid-cols-1 bg-canvas text-ink lg:grid-cols-[240px_1fr]">
      <Sidebar open={navOpen} onNavigate={closeNav} />

      {/*
        La tendina esiste solo mentre il cassetto è aperto e solo sotto `lg`. È un `button` e
        non un `div` con `onClick`: toccare fuori per chiudere è un'azione, e chi naviga da
        tastiera deve poterla raggiungere invece di restare intrappolato dietro al pannello.
      */}
      {navOpen ? (
        <button
          type="button"
          aria-label={t.nav.closeMenu}
          onClick={closeNav}
          className="fixed inset-0 z-30 cursor-pointer bg-ink/40 lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <Topbar crumb={crumb} onOpenPalette={openPalette} onOpenNav={openNav} />
        <main className="w-full max-w-[1320px] flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ToastViewport />
    </div>
  );
}
