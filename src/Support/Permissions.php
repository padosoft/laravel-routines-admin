<?php

declare(strict_types=1);

namespace Padosoft\RoutinesAdmin\Support;

use Illuminate\Support\Facades\Gate;

/**
 * Cosa puo' fare l'utente corrente, in forma leggibile dal client.
 *
 * Serve alla UI per disabilitare — e SPIEGARE — cio' che non e' permesso, non per autorizzare:
 * l'autorizzazione vera e' server-side su ogni endpoint dell'API. Un pannello che nasconde un
 * pulsante non ha protetto niente; l'ha solo reso meno confuso.
 *
 * Le ability si risolvono via Gate, cosi' l'applicazione ospite le definisce con le proprie regole
 * senza che questo pacchetto imponga un modello di permessi.
 */
final class Permissions
{
    private const ABILITIES = [
        'routines.read',
        'routines.write',
        'routines.fire',
        'routines.approve',
    ];

    /** @return list<string> */
    public static function forCurrentUser(): array
    {
        $granted = [];
        foreach (self::ABILITIES as $ability) {
            // Nessuna policy definita per l'ability ⇒ Gate::allows() e' false: fail-closed.
            // Un'applicazione che non definisce nulla ottiene un pannello in sola lettura, che e'
            // il default giusto per uno strumento che fa partire automazioni.
            if (Gate::has($ability) ? Gate::allows($ability) : $ability === 'routines.read') {
                $granted[] = $ability;
            }
        }

        return $granted;
    }
}
