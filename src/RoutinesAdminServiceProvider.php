<?php

declare(strict_types=1);

namespace Padosoft\RoutinesAdmin;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Monta la SPA.
 *
 * Questo pacchetto NON espone dati: l'API vive nel core (`padosoft/laravel-routines`), e il
 * pannello e' "solo un altro client" di quell'API. E' la stessa separazione di iam-console rispetto
 * a iam-server, e serve a una cosa precisa: se domani il pannello viene sostituito, l'API resta —
 * e finche' resta, resta anche tutto cio' che ci si integra sopra.
 */
final class RoutinesAdminServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/routines-admin.php', 'routines-admin');
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'routines-admin');

        $this->publishes([
            __DIR__.'/../config/routines-admin.php' => config_path('routines-admin.php'),
        ], 'routines-admin-config');

        $this->publishes([
            __DIR__.'/../public' => public_path('vendor/routines-admin'),
        ], 'routines-admin-assets');

        if (! config('routines-admin.enabled', true)) {
            return;
        }

        Route::prefix((string) config('routines-admin.route.prefix', 'admin/routines'))
            ->middleware((array) config('routines-admin.route.middleware', ['web', 'auth']))
            ->group(function (): void {
                // Una sola rotta: il routing vero e' lato client. Il `where` cattura le sotto-rotte
                // cosi' un refresh su /admin/routines/runs/xyz non da' 404.
                Route::get('/{any?}', fn () => view('routines-admin::app', [
                    'apiBase' => $this->apiBase(),
                    'appName' => config('routines-admin.app_name', 'Routines'),
                    'logoutUrl' => config('routines-admin.logout_url', '/logout'),
                ]))->where('any', '.*')->name('routines-admin.index');
            });
    }

    private function apiBase(): string
    {
        $configured = config('routines-admin.api_base');
        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        return '/'.trim((string) config('routines.api.prefix', 'api/routines/v1'), '/');
    }
}
