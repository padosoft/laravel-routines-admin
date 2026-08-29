<?php

declare(strict_types=1);

namespace Padosoft\RoutinesAdmin\Support;

/**
 * Legge il manifest di Vite dagli asset pubblicati.
 *
 * Non usa `Vite::` di Laravel perche' gli asset di un pacchetto vivono sotto
 * `public/vendor/routines-admin`, fuori dal build dell'applicazione ospite: l'helper del framework
 * cercherebbe nel posto sbagliato e fallirebbe in modo poco chiaro.
 *
 * @phpstan-type Manifest array{entry: string|null, css: list<string>}
 */
final class ViteManifest
{
    /** @var Manifest|null */
    private static ?array $cache = null;

    /** @return Manifest */
    public static function read(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }

        $path = public_path('vendor/routines-admin/.vite/manifest.json');
        if (! is_file($path)) {
            // Asset non pubblicati: la pagina si carica comunque e non esplode. Chi la apre vede
            // un contenitore vuoto, ed e' un sintomo piu' leggibile di una eccezione.
            return self::$cache = ['entry' => null, 'css' => []];
        }

        /** @var array<string, array{file?: string, isEntry?: bool, css?: list<string>}> $manifest */
        $manifest = json_decode((string) file_get_contents($path), true) ?: [];

        foreach ($manifest as $chunk) {
            if (($chunk['isEntry'] ?? false) === true) {
                return self::$cache = [
                    'entry' => $chunk['file'] ?? null,
                    'css' => array_values($chunk['css'] ?? []),
                ];
            }
        }

        return self::$cache = ['entry' => null, 'css' => []];
    }
}
