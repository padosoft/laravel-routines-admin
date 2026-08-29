# laravel-routines-admin

Pannello di amministrazione per [`padosoft/laravel-routines`](https://github.com/padosoft/laravel-routines).
**React 19 · Vite 8 · Tailwind 4 · TanStack Query 5**, interamente su API — nessuno stato server-side,
nessun Blade oltre alla view di mount.

```bash
composer require padosoft/laravel-routines-admin
php artisan vendor:publish --tag=routines-admin-config
```

Il pannello vive su `/admin/routines` (configurabile) dietro il guard che decidi tu.

## Cosa contiene

| Schermata | A cosa serve |
|---|---|
| **Panoramica** | Serve qualcosa da me? Sta girando tutto? Cosa e' successo? |
| **Routine** | Elenco, creazione guidata, dettaglio, schedule, mandato |
| **In attesa di te** | I fire fermi che aspettano una risposta umana — la schermata firma del prodotto |
| **Esecuzioni** | Il ledger completo: esito, motivo, durata, costo, chiave di idempotenza |
| **Salute** | Ultimo tick, routine in ritardo, lock bloccati, bersagli registrati |

La creazione guidata mostra **l'anteprima delle prossime esecuzioni nel fuso del proprietario**, con
la sigla del fuso e l'annotazione sui cambi di ora legale: e' il modo piu' veloce per accorgersi che
un orario e' sbagliato di un fuso, prima che la routine giri cosi' per un mese.

## Licenza

MIT © [Padosoft](https://padosoft.com)
