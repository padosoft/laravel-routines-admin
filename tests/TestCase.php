<?php

declare(strict_types=1);

namespace Padosoft\RoutinesAdmin\Tests;

use Illuminate\Foundation\Application;
use Orchestra\Testbench\TestCase as Orchestra;
use Padosoft\RoutinesAdmin\RoutinesAdminServiceProvider;

abstract class TestCase extends Orchestra
{
    /**
     * @param  Application  $app
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [RoutinesAdminServiceProvider::class];
    }

    /**
     * @param  Application  $app
     */
    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
        // Le rotte del pannello si registrano al boot: la configurazione va decisa qui, non
        // dentro un test, o il provider avra' gia' letto i valori di default.
        $app['config']->set('routines-admin.route.middleware', ['web']);
    }
}
