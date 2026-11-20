import test from 'node:test';
import assert from 'node:assert/strict';
import { CDN_GLB_BASE_URL, GLB_MODELS_META, GLB_MODEL_URLS, getGlbModelUrl } from './glbCatalog';
import { PUMP_TYPE_PROFILES } from './pumpPhysics';
import { LESSONS } from '../data/lessons';
import type { GlbModelId } from '../types/academy';

const EXPECTED_IDS: GlbModelId[] = [
  'alignment_model',
  'axial_mixed_pump',
  'barrel_pump',
  'bearings_loads',
  'cavitation_model',
  'complete_pump',
  'exploded_pump',
  'gear_pump',
  'impeller_types',
  'lobe_vane_pump',
  'mechanical_seal',
  'multistage_pump',
  'reciprocating_pump',
  'screw_pump',
  'split_case_double_suction',
  'vertical_pump',
  'water_hammer',
];

test('glbCatalog maps all 17 models directly to GitHub jsdelivr CDN URLs without Base64', () => {
  assert.equal(Object.keys(GLB_MODEL_URLS).length, 17);
  assert.equal(GLB_MODELS_META.length, 17);

  for (const id of EXPECTED_IDS) {
    const url = getGlbModelUrl(id);
    assert.equal(url, `${CDN_GLB_BASE_URL}/${id}.glb`);
    assert.ok(url.startsWith('https://cdn.jsdelivr.net/gh/alaamohammed864/complete_pump@main/'));
    assert.ok(!url.startsWith('data:'));

    const meta = GLB_MODELS_META.find((m) => m.id === id);
    assert.ok(meta, `Missing metadata for ${id}`);
    assert.ok(LESSONS.some((l) => l.id === meta.relatedLessonId), `Invalid lessonId for ${id}`);
  }
});

test('all 12 simulator pump types link to valid real GLB CDN models', () => {
  const profiles = Object.values(PUMP_TYPE_PROFILES);
  assert.equal(profiles.length, 12);
  for (const p of profiles) {
    const url = getGlbModelUrl(p.relatedGlbModel);
    assert.ok(url.endsWith(`/${p.relatedGlbModel}.glb`));
  }
});
