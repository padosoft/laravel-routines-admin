/** Durata di un fire: millisecondi dal server, forma leggibile qui. */
export function formatDuration(ms: number | null): string {
  if (ms === null) {
    return '—';
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    // Un decimale sotto il minuto: «4,1 s» dice qualcosa che «4 s» perde.
    return `${seconds.toFixed(1).replace('.', ',')} s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) {
    return `${minutes} m ${String(rest).padStart(2, '0')} s`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${String(minutes % 60).padStart(2, '0')} m`;
}
