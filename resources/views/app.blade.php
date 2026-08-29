<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $appName }}</title>
    <script>
        // Il tema si applica PRIMA del primo paint: applicarlo in React significherebbe un
        // lampo del tema sbagliato a ogni caricamento, e il pannello e' scuro di default.
        // La classe e' `light`, non `dark`: scuro e' la base, chiaro la sovrascrive.
        (function () {
            try {
                var stored = localStorage.getItem('routines-admin-theme');
                var light = stored
                    ? stored === 'light'
                    : window.matchMedia('(prefers-color-scheme: light)').matches;
                if (light) document.documentElement.classList.add('light');
            } catch (e) { /* storage bloccato: resta il tema scuro di default */ }
        })();
    </script>
    @php($manifest = \Padosoft\RoutinesAdmin\Support\ViteManifest::read())
    @foreach($manifest['css'] as $href)
        <link rel="stylesheet" href="{{ asset('vendor/routines-admin/'.$href) }}">
    @endforeach
</head>
<body>
    <div id="routines-admin"
         data-api-base="{{ $apiBase }}"
         data-csrf-token="{{ csrf_token() }}"
         data-app-name="{{ $appName }}"
         data-locale="{{ app()->getLocale() }}"
         data-timezone="{{ config('app.timezone') }}"
         data-logout-url="{{ $logoutUrl }}"
         data-basename="{{ $basename ?? '' }}"
         data-can="{{ implode(',', \Padosoft\RoutinesAdmin\Support\Permissions::forCurrentUser()) }}"></div>
    @if($manifest['entry'])
        <script type="module" src="{{ asset('vendor/routines-admin/'.$manifest['entry']) }}"></script>
    @endif
</body>
</html>
