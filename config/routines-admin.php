<?php

declare(strict_types=1);

return [
    /*
    |---------------------------------------------------------------------------
    | Dove vive il pannello
    |---------------------------------------------------------------------------
    | La SPA e' montata qui; l'API che consuma vive in padosoft/laravel-routines
    | sotto `api_base` (sessione + CSRF, stesso dominio).
    */
    'enabled' => env('ROUTINES_ADMIN_ENABLED', true),

    'route' => [
        'prefix' => env('ROUTINES_ADMIN_PREFIX', 'admin/routines'),
        // Metti qui il tuo guard. `auth` usa il guard web di Laravel.
        'middleware' => ['web', 'auth'],
    ],

    /*
    | Base dell'API del core. null = derivata a render time dal prefisso
    | configurato in routines.api.prefix.
    */
    'api_base' => env('ROUTINES_ADMIN_API_BASE'),

    'app_name' => env('ROUTINES_ADMIN_APP_NAME', 'Routines'),

    'logout_url' => env('ROUTINES_ADMIN_LOGOUT_URL', '/logout'),
];
