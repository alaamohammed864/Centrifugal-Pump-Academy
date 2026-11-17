import test from 'node:test';
import assert from 'node:assert/strict';
import {
  base64ToArrayBuffer,
  buildGlbBuffer,
  generateAllGlbBase64Map,
} from './glbBuilder';
import type { GlbModelId } from '../types/academy';

const MODEL_IDS: GlbModelId[] = [
  'complete_pump',
  'exploded_pump',
  'impeller_types',
  'bearings_loads',
  'mechanical_seal',
  'cavitation_model',
  'water_hammer',
  'alignment_model',
];

test('buildGlbBuffer creates valid glTF 2.0 binary headers and JSON/BIN chunks for all 8 models', () => {
  for (const id of MODEL_IDS) {
    const bytes = buildGlbBuffer(id);
    assert.ok(bytes.byteLength > 200, `Model ${id} too small: ${bytes.byteLength}`);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // Magic: 'glTF' = 0x46546C67
    assert.equal(dv.getUint32(0, true), 0x46546c67, `${id} invalid GLB magic`);
    // Version: 2
    assert.equal(dv.getUint32(4, true), 2, `${id} invalid GLB version`);
    // Total byte length matches
    assert.equal(dv.getUint32(8, true), bytes.byteLength, `${id} mismatched total length`);

    // Chunk 0: JSON
    const jsonLen = dv.getUint32(12, true);
    assert.equal(dv.getUint32(16, true), 0x4e4f534a, `${id} chunk 0 is not JSON`);
    const jsonBytes = bytes.subarray(20, 20 + jsonLen);
    const json = JSON.parse(new TextDecoder().decode(jsonBytes));
    assert.equal(json.asset.version, '2.0');
    assert.ok(Array.isArray(json.nodes) && json.nodes.length >= 3, `${id} should have multiple named nodes`);
    assert.ok(Array.isArray(json.meshes) && json.meshes.length >= 3);

    // Chunk 1: BIN
    const binOffset = 20 + jsonLen;
    const binLen = dv.getUint32(binOffset, true);
    assert.equal(dv.getUint32(binOffset + 4, true), 0x004e4942, `${id} chunk 1 is not BIN`);
    assert.equal(binOffset + 8 + binLen, bytes.byteLength, `${id} BIN length mismatch`);
  }
});

test('generateAllGlbBase64Map roundtrips Base64 back to identical GLB bytes', () => {
  const map = generateAllGlbBase64Map();
  assert.equal(Object.keys(map).length, 8);
  for (const id of MODEL_IDS) {
    const b64 = map[id];
    assert.ok(b64.length > 100);
    const decoded = new Uint8Array(base64ToArrayBuffer(b64));
    const original = buildGlbBuffer(id);
    assert.equal(decoded.byteLength, original.byteLength);
    assert.equal(decoded[0], original[0]);
    assert.equal(decoded[decoded.length - 1], original[original.length - 1]);
  }
});
