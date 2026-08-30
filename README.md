# laravel-routines-admin

Pannello di amministrazione per [`padosoft/laravel-routines`](https://github.com/padosoft/laravel-routines).
**React 19 · Vite 8 · Tailwind 4 · TanStack Query 5**, interamente su API — nessuno stato server-side,
nessun Blade oltre alla view di mount.

```bash
composer require padosoft/laravel-routines-admin
php artisan vendor:publish --tag=routines-admin-config
```

Il pannello vive su `/admin/routines` (configurabile) dietro il guard che decidi tu.

![Panoramica](art/overview.png)

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

### In attesa di te

La schermata firma. Una routine che si e' fermata per chiedere un permesso **non ha fallito**: sta
facendo esattamente quello per cui e' stata scritta. Per questo non compare in nessun log di errore
e non fa scattare nessun monitor — l'unico posto dove la si vede e' qui.

![In attesa di te](art/attention.png)

### Routine, dettaglio e creazione guidata

| | |
|---|---|
| ![Elenco routine](art/routines.png) | ![Dettaglio routine](art/routine-detail.png) |
| L'elenco: stato, prossima esecuzione, esito dell'ultima. | Il dettaglio, con il mandato e le prossime occorrenze. |
| ![Creazione guidata](art/wizard.png) | ![Salute](art/health.png) |
| Il wizard mostra **cinque date vere** prima che ci sia qualcosa da salvare. | Ultimo tick, routine in ritardo, bersagli registrati. |

### Il ledger e il tema chiaro

| | |
|---|---|
| ![Esecuzioni](art/runs.png) | ![Tema chiaro](art/overview-light.png) |
| Ogni fire: esito, motivo, durata, costo, chiave di idempotenza. | Chiaro e scuro sono di pari dignita', non uno il ripiego dell'altro. |

## Le decisioni di interfaccia che contano

Un pannello per automazioni non si giudica su quanto e' bello a schermo pieno, ma su cosa succede
nei casi in cui qualcosa e' andato storto e nessuno stava guardando. Queste sono le scelte fatte
per quei casi, e ognuna ha un test che la tiene ferma.

**La fascia «in attesa» a zero non esiste.** Non viene sostituita da un riquadro verde «tutto ok»:
un riquadro che compare sempre smette di essere letto nel giro di una settimana, e il giorno che
segna 3 nessuno lo guarda piu'. Stessa regola per il badge nella navigazione.

**«In pausa» e «in attesa» sono parole diverse.** Una routine `paused` e' una scelta di chi la
possiede; un fire `paused` e' una domanda rivolta a una persona. Colore diverso, etichetta diversa,
mai fuse — e il viola e' riservato al secondo, che e' l'unica cosa in tutto il pannello che merita
un colore di richiamo.

**Il segmento viola del grafico non scende mai sotto 3px.** Due fire in attesa dentro una giornata
da quattrocento sparirebbero nell'arrotondamento, e sono esattamente i due che qualcuno deve vedere.
Il grafico perde un po' di proporzione e guadagna l'unica cosa per cui lo si guarda.

**Il testo leggibile lo compone il server.** `schedule_human`, `suspension_reason_label`,
`tick_diagnosis` e il messaggio di un fire in pausa non passano dal layer i18n: sono **evidenza**.
Un pannello che traducesse `target_not_registered` per conto proprio lo tradurrebbe diversamente
dal comando CLI e dall'audit, e tre persone che guardano lo stesso evento leggerebbero tre cose
diverse.

**La conferma ridice cosa succedera', non chiede «sei sicuro?».** Il secondo passo di
un'approvazione ripete i parametri esatti in una griglia mono. «Sei sicuro?» non aggiunge
informazione: si impara a cliccarci sopra in due giorni, e da li' in poi non conferma piu' niente.

**Un rifiuto senza motivo non parte, e terminare richiede di digitare il nome.** Il motivo finisce
nel ledger e qualcuno lo leggera' — tipicamente chi si chiede perche' quella cosa non e' stata
fatta. Terminare e' definitivo: la differenza fra «ho letto» e «ho cliccato» li' vale una routine.

**La chiave di idempotenza nasce alla conferma**, non all'apertura del dialogo: aprire, chiudere e
riaprire non deve produrre una chiave che il server ha gia' visto e che farebbe rifiutare come
duplicato un fire nuovo.

**Ottimismo solo su pausa/ripresa.** Approvare, rifiutare ed eseguire hanno effetti nel mondo
reale: mostrarli come riusciti prima che lo siano vorrebbe dire raccontare una cosa non ancora vera.

**Chi non ha il permesso vede la pagina**, con i comandi spenti e una fascia che dice cosa gli
manca. Nasconderla lascerebbe la persona a chiedersi se esista.

## Sul telefono

Il pannello non e' un'app mobile e non finge di esserlo: e' un pannello desktop che **si adatta**,
perche' le due domande che si fanno dal telefono sono «devo approvare qualcosa?» e «sta girando
tutto?», e per quelle non serve un secondo prodotto.

Sotto `lg` la navigazione diventa un cassetto che entra da sinistra, con un velo che lo chiude al
tocco. Sotto `md` le tabelle **smontano** le colonne secondarie invece di comprimerle: sette colonne
su 375px non sono una tabella stretta, sono sette troncamenti. Restano lo stato, il nome e il
comando — il resto e' a un tocco di distanza, nel dettaglio, dove c'e' tutto, e il «quando gira»
lo dice gia' la Panoramica, che e' la schermata da cui si entra.

Due dettagli che sembrano estetici e non lo sono. Le colonne nascoste **non ci sono**, non sono
`display:none`: una colonna nascosta col CSS resta nel DOM e uno screen reader la legge comunque,
riga per riga, come rumore. E lo scheletro di caricamento cambia forma insieme alla tabella: sette
barrette dove poi compaiono tre colonne promettono una griglia che non arriva.

| | | | |
|---|---|---|---|
| ![In attesa, su telefono](art/mobile-attention.png) | ![Panoramica su telefono](art/mobile-overview.png) | ![Elenco su telefono](art/mobile-routines.png) | ![Navigazione a cassetto](art/mobile-nav.png) |
| «Devo approvare qualcosa?» | «Sta girando tutto?» | Stato, nome, comando. | La navigazione a cassetto. |

Le foto qui sopra non sono un mockup: escono dal pannello compilato, quello che il pacchetto
spedisce. E sono servite. La prima versione dell'adattamento sembrava a posto in ogni test — il
bottone «esegui ora» esisteva nel DOM, era cliccabile, ogni asserzione su di esso passava — ma
fotografata era **fuori dal bordo destro**: `minmax(220px,1fr)` ha un minimo che non cede, e
spingeva fuori tutto quello che veniva dopo. Da li' e' nato il test che misura la larghezza
incomprimibile della griglia contro un telefono.

## Tema

Scuro di default, chiaro di pari dignita'. La classe `light` sull'`<html>` e' applicata dal Blade
**prima del primo paint** — applicarla in React vorrebbe dire un lampo del tema sbagliato a ogni
caricamento. Nessun componente scrive un colore letterale: solo token, definiti in `@theme`, e ogni
sfondo su token ha la sua controparte di testo.

## Sviluppo

```bash
npm install
npm run dev          # Vite in watch
npm run typecheck    # TypeScript strict
npm test             # vitest
npm run build        # in public/, e' cio' che il pacchetto spedisce

composer test        # pest
vendor/bin/pint --test
vendor/bin/phpstan analyse
```

Gli asset compilati sono **committati**: chi installa il pacchetto fa `vendor:publish` e ha il
pannello, senza dover avere Node.

## Licenza

MIT © [Padosoft](https://padosoft.com)
