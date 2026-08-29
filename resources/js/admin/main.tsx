import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { readConfig } from './config';
import './index.css';

const root = document.getElementById('routines-admin');

if (root !== null) {
  const config = readConfig(root);
  // Il basename è il path su cui l'host ha montato il pannello: le rotte del router sono
  // relative a quello, così l'applicazione ospite decide dove vive senza che questo file sappia.
  const basename = root.dataset.basename ?? undefined;

  createRoot(root).render(
    <StrictMode>
      <App config={config} basename={basename} />
    </StrictMode>,
  );
}
