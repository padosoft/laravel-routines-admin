<?php

declare(strict_types=1);

namespace Padosoft\RoutinesAdmin\Support;

/**
 * Letture di configurazione tipizzate.
 *
 * `config()` restituisce `mixed`, e un `(string) config(...)` sparso nel codice nasconde una cosa
 * vera: quei valori arrivano da un file che qualcuno scrive a mano. Un `'prefix' => ['admin']`
 * diventerebbe «Array» in silenzio, e il pannello si monterebbe su una rotta che non esiste.
 * Qui il default vince su qualsiasi valore non utilizzabile.
 */
final class Cfg
{
    public static function string(string $key, string $default): string
    {
        $value = config($key, $default);

        return is_string($value) && $value !== '' ? $value : $default;
    }

    public static function bool(string $key, bool $default): bool
    {
        $value = config($key, $default);

        return is_bool($value) ? $value : $default;
    }

    /**
     * @param  list<string>  $default
     * @return list<string>
     */
    public static function stringList(string $key, array $default): array
    {
        $value = config($key, $default);
        if (! is_array($value)) {
            return $default;
        }

        $out = array_values(array_filter($value, 'is_string'));

        return $out === [] ? $default : $out;
    }
}
