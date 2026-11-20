export const SPLASH_DURATION_MS = 3000;
export const SPLASH_ASSET_PATH = '/assets/aistudio/________________________________bcb28203.png';

export interface SplashProgressState {
  progressPct: number;
  rawRatio: number;
  isComplete: boolean;
}

/**
 * Computes smooth 0..100 splash progress over `durationMs` (default 3000 ms).
 * Uses a mild ease-out curve so the counter starts promptly at 0 and lands crisply on 100.
 */
export function computeSplashProgress(
  elapsedMs: number,
  durationMs: number = SPLASH_DURATION_MS
): SplashProgressState {
  if (durationMs <= 0) {
    return { progressPct: 100, rawRatio: 1, isComplete: true };
  }
  const clamped = Math.max(0, Math.min(durationMs, elapsedMs));
  const t = clamped / durationMs;
  // Gentle quadratic-cubic blend: responsive start, smooth finish at 100
  const eased = 1 - Math.pow(1 - t, 1.65);
  const progressPct = clamped >= durationMs ? 100 : Math.min(99, Math.floor(eased * 100));
  return {
    progressPct,
    rawRatio: eased,
    isComplete: elapsedMs >= durationMs,
  };
}

/**
 * Allows automated tests or explicit deep-links (?autostart=1, ?nosplash=1, ?tab=lab3d)
 * to bypass the 3-second intro screen cleanly while keeping normal root entry showing the splash.
 */
export function shouldSkipSplash(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  if (params.get('autostart') === '1' || params.get('nosplash') === '1') {
    return true;
  }
  const tab = params.get('tab');
  if (tab && tab !== 'home') {
    return true;
  }
  return false;
}
