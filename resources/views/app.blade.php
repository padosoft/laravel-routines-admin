<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $appName }}</title>
    <script>
        // Applica il tema prima del primo paint, cosi' non c'e' un lampo bianco in tema scuro.
        (function () {
            try {
                var t = localStorage.getItem('routines-admin-theme');
                var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
            } catch (e) { /* storage bloccato: resta il tema chiaro */ }
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
         data-can="{{ implode(',', \Padosoft\RoutinesAdmin\Support\Permissions::forCurrentUser()) }}"></div>
    @if($manifest['entry'])
        <script type="module" src="{{ asset('vendor/routines-admin/'.$manifest['entry']) }}"></script>
    @endif
</body>
</html>
