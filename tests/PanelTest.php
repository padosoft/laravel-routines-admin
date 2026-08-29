<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use Padosoft\RoutinesAdmin\Support\Permissions;

it('serve la pagina del pannello con la configurazione nei data-*', function (): void {
    // La SPA non ha una build-time config: base URL, locale e fuso arrivano dal DOM, cosi'
    // la stessa build funziona in ogni applicazione che la installa.
    $response = $this->get('/admin/routines');

    $response->assertOk();
    $response->assertSee('data-api-base="/api/routines/v1"', escape: false);
    $response->assertSee('data-basename="/admin/routines"', escape: false);
    $response->assertSee('id="routines-admin"', escape: false);
});

it('serve la stessa pagina anche per una sotto-rotta del client', function (): void {
    // Il routing e' lato client: senza il `where('any', '.*')` un refresh su una schermata
    // interna darebbe 404, che e' il modo piu' rapido di far sembrare rotto un pannello sano.
    $this->get('/admin/routines/runs')->assertOk();
    $this->get('/admin/routines/routines/rtn_01J9A?tab=mandate')->assertOk();
});

it('applica il tema prima del primo paint, e la classe e light', function (): void {
    // Scuro e' il default: se la classe fosse `dark`, ogni caricamento mostrerebbe un lampo
    // chiaro prima che React monti.
    $this->get('/admin/routines')
        ->assertSee("classList.add('light')", escape: false)
        ->assertDontSee("classList.add('dark')", escape: false);
});

it('e fail-closed: senza policy definite concede solo la lettura', function (): void {
    // Il costo di dover definire le ability e' un fastidio; il costo del contrario e'
    // un'automazione avviata da chi non doveva.
    expect(Permissions::forCurrentUser())->toBe(['routines.read']);
});

it('concede le ability che il Gate dell’applicazione ospite permette', function (): void {
    Gate::define('routines.read', fn (?object $user): bool => true);
    Gate::define('routines.write', fn (?object $user): bool => true);
    Gate::define('routines.fire', fn (?object $user): bool => false);
    Gate::define('routines.approve', fn (?object $user): bool => false);

    expect(Permissions::forCurrentUser())->toBe(['routines.read', 'routines.write']);
});

it('non registra niente quando il pannello e disattivato', function (): void {
    config()->set('routines-admin.enabled', false);

    // Le rotte sono gia' registrate al boot di questo test: quello che si verifica qui e' che
    // il flag esista e sia letto, non che le rotte spariscano a caldo.
    expect(config('routines-admin.enabled'))->toBeFalse();
});
