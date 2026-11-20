import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAspectAwareFitDistance, getModelViewDirection } from './cameraFraming';

test('computeAspectAwareFitDistance pulls camera back on narrow portrait mobile viewports so wide pumps do not crop', () => {
  const widePumpSize = { x: 4.8, y: 1.6, z: 1.8 };
  const dir = getModelViewDirection('complete_pump');

  const desktop = computeAspectAwareFitDistance({
    size: widePumpSize,
    viewDir: dir,
    fovDeg: 42,
    aspect: 1.85,
  });

  const mobilePortrait = computeAspectAwareFitDistance({
    size: widePumpSize,
    viewDir: dir,
    fovDeg: 42,
    aspect: 0.72,
  });

  const fullscreenPhonePortrait = computeAspectAwareFitDistance({
    size: widePumpSize,
    viewDir: dir,
    fovDeg: 42,
    aspect: 390 / 844,
  });

  assert.ok(
    mobilePortrait.distance > desktop.distance,
    `Expected portrait mobile distance (${mobilePortrait.distance}) > desktop distance (${desktop.distance})`,
  );
  assert.ok(
    fullscreenPhonePortrait.distance > mobilePortrait.distance,
    `Expected fullscreen portrait distance (${fullscreenPhonePortrait.distance}) > card portrait distance (${mobilePortrait.distance})`,
  );

  // Verify projected half-width actually fits inside horizontal frustum half-width at computed distance
  const tanV = Math.tan((42 * Math.PI) / 360);
  const halfScreenWidthAtCenter =
    (fullscreenPhonePortrait.distance - fullscreenPhonePortrait.projectedDepth * 0.5) *
    tanV *
    (390 / 844);
  assert.ok(
    halfScreenWidthAtCenter >= fullscreenPhonePortrait.projectedWidth * 0.5,
    'Model width must fit inside horizontal frustum on fullscreen portrait mobile',
  );
});

test('computeAspectAwareFitDistance keeps tall vertical pumps fully visible vertically', () => {
  const tallSize = { x: 1.2, y: 5.0, z: 1.2 };
  const dir = getModelViewDirection('vertical_pump');
  const fit = computeAspectAwareFitDistance({
    size: tallSize,
    viewDir: dir,
    fovDeg: 42,
    aspect: 0.9,
  });

  const tanV = Math.tan((42 * Math.PI) / 360);
  const halfScreenHeight = (fit.distance - fit.projectedDepth * 0.5) * tanV;
  assert.ok(halfScreenHeight >= fit.projectedHeight * 0.5);
});
