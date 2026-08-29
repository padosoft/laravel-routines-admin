<?php

declare(strict_types=1);

namespace Padosoft\RoutinesAdmin\Tests;

use Illuminate\Foundation\Application;

/**
 * La base dell'API si risolve al boot del provider, quindi cambiarla dentro un test non basta:
 * serve un ambiente configurato prima che le rotte esistano. Da qui una classe a parte invece
 * di uno `skip` — un test saltato non asserisce niente e nasconde proprio il caso che copre.
 */
final class DerivedApiBaseTest extends TestCase
{
    /**
     * @param  Application  $app
     */
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        // Nessuna base configurata per il pannello: deve derivarla dal prefisso del core, così
        // un'applicazione che sposta l'API non deve ricordarsi di aggiornare anche il pannello.
        $app['config']->set('routines-admin.api_base', null);
        $app['config']->set('routines.api.prefix', 'api/automazioni/v2');
    }

    public function test_it_derives_the_api_base_from_the_core_prefix(): void
    {
        $this->get('/admin/routines')
            ->assertOk()
            ->assertSee('data-api-base="/api/automazioni/v2"', false);
    }
}
