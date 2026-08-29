<?php

declare(strict_types=1);

namespace Padosoft\RoutinesAdmin;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Padosoft\RoutinesAdmin\Support\Cfg;

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

        if (! Cfg::bool('routines-admin.enabled', true)) {
            return;
        }

        Route::prefix(Cfg::string('routines-admin.route.prefix', 'admin/routines'))
            ->middleware(Cfg::stringList('routines-admin.route.middleware', ['web', 'auth']))
            ->group(function (): void {
                // Una sola rotta: il routing vero e' lato client. Il `where` cattura le sotto-rotte
                // cosi' un refresh su /admin/routines/runs/xyz non da' 404.
                // `View::make` e non l'helper `view()`: la firma dell'helper vuole una
                // `view-string`, che un analizzatore non puo' risolvere per una vista di
                // pacchetto — e zittirlo con un cast direbbe una cosa che non e' stata verificata.
                Route::get('/{any?}', fn () => View::make('routines-admin::app', [
                    'apiBase' => $this->apiBase(),
                    'appName' => Cfg::string('routines-admin.app_name', 'Routines'),
                    'logoutUrl' => Cfg::string('routines-admin.logout_url', '/logout'),
                    // Il router client e' relativo al prefisso su cui l'host ha montato il
                    // pannello: senza, un'installazione sotto /admin/routines vedrebbe ogni
                    // link puntare alla radice del sito.
                    'basename' => '/'.trim(Cfg::string('routines-admin.route.prefix', 'admin/routines'), '/'),
                ]))->where('any', '.*')->name('routines-admin.index');
            });
    }

    private function apiBase(): string
    {
        $configured = config('routines-admin.api_base');
        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        return '/'.trim(Cfg::string('routines.api.prefix', 'api/routines/v1'), '/');
    }
}
