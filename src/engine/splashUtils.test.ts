import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSplashProgress, shouldSkipSplash, SPLASH_DURATION_MS } from './splashUtils';

test('computeSplashProgress starts at 0 and completes at 100 at 3000ms', () => {
  const start = computeSplashProgress(0);
  assert.equal(start.progressPct, 0);
  assert.equal(start.isComplete, false);

  const mid = computeSplashProgress(SPLASH_DURATION_MS / 2);
  assert.ok(mid.progressPct > 45 && mid.progressPct < 85, `Expected mid progress, got ${mid.progressPct}`);
  assert.equal(mid.isComplete, false);

  const almost = computeSplashProgress(SPLASH_DURATION_MS - 1);
  assert.ok(almost.progressPct <= 99);
  assert.equal(almost.isComplete, false);

  const done = computeSplashProgress(SPLASH_DURATION_MS);
  assert.equal(done.progressPct, 100);
  assert.equal(done.isComplete, true);

  const over = computeSplashProgress(SPLASH_DURATION_MS + 500);
  assert.equal(over.progressPct, 100);
  assert.equal(over.isComplete, true);
});

test('computeSplashProgress is monotonic from 0 to 100', () => {
  let prev = -1;
  for (let ms = 0; ms <= SPLASH_DURATION_MS; ms += 50) {
    const { progressPct } = computeSplashProgress(ms);
    assert.ok(progressPct >= prev, `Non-monotonic at ${ms}ms: ${progressPct} < ${prev}`);
    prev = progressPct;
  }
  assert.equal(prev, 100);
});

test('shouldSkipSplash handles normal load vs autostart and deep-link tabs', () => {
  assert.equal(shouldSkipSplash(''), false);
  assert.equal(shouldSkipSplash('?tab=home'), false);
  assert.equal(shouldSkipSplash('?autostart=1'), true);
  assert.equal(shouldSkipSplash('?nosplash=1'), true);
  assert.equal(shouldSkipSplash('?tab=lab3d'), true);
});
