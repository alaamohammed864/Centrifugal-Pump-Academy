import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENARIO_PRESETS,
  calcAffinityBySpeed,
  calcHydrostaticPressure,
  calcPumpPowers,
  convertUnitValue,
  generatePerformanceCurves,
  gradeExam,
  gradeMsqQuestion,
  simulatePumpOperation,
} from './pumpPhysics';
import type { MsqQuestion } from '../types/academy';

test('simulatePumpOperation: stopped state yields zero flow/head and static suction/discharge parity', () => {
  const out = simulatePumpOperation({
    isRunning: false,
    rpm: 0,
    suctionValvePct: 100,
    dischargeValvePct: 80,
    tankLevelM: 4.0,
    fluidTempC: 35,
    airIngressPct: 0,
  });
  assert.equal(out.flowM3h, 0);
  assert.equal(out.headM, 0);
  assert.equal(out.operatingZone, 'stopped');
  assert.equal(out.suctionPressureBar, out.dischargePressureBar);
});

test('simulatePumpOperation: normal preset operates in BEP zone with safe NPSH margin', () => {
  const base = SCENARIO_PRESETS.normal.inputs;
  const out = simulatePumpOperation({
    isRunning: true,
    rpm: base.rpm ?? 2950,
    suctionValvePct: base.suctionValvePct ?? 100,
    dischargeValvePct: base.dischargeValvePct ?? 78,
    tankLevelM: base.tankLevelM ?? 4.2,
    fluidTempC: base.fluidTempC ?? 35,
    airIngressPct: base.airIngressPct ?? 0,
  });
  assert.equal(out.isEducationalModel, true);
  assert.equal(out.operatingZone, 'bep_zone');
  assert.ok(out.efficiencyPct > 70, `expected >70% efficiency, got ${out.efficiencyPct}`);
  assert.ok(out.npshAvailableM > out.npshRequiredM);
  assert.equal(out.cavitationRisk, 'none');
});

test('simulatePumpOperation: low tank level & high temp or clogged suction triggers cavitation', () => {
  const clogged = simulatePumpOperation({
    isRunning: true,
    rpm: 2950,
    suctionValvePct: 15,
    dischargeValvePct: 85,
    tankLevelM: 1.0,
    fluidTempC: 70,
    airIngressPct: 0,
  });
  assert.equal(clogged.operatingZone, 'cavitation');
  assert.notEqual(clogged.cavitationRisk, 'none');
  assert.ok(clogged.vibrationMmS > 3.5);
});

test('simulatePumpOperation: air ingress above 45% causes air_bound degradation', () => {
  const out = simulatePumpOperation({
    isRunning: true,
    rpm: 2950,
    suctionValvePct: 100,
    dischargeValvePct: 78,
    tankLevelM: 3.8,
    fluidTempC: 35,
    airIngressPct: 70,
  });
  assert.equal(out.operatingZone, 'air_bound');
  assert.ok(out.flowM3h < 90);
});

test('generatePerformanceCurves produces monotonic series > single and valid operating point', () => {
  const curves = generatePerformanceCurves(2950, 78, 1.0);
  assert.ok(curves.points.length >= 20);
  assert.ok(curves.bepQ > 140 && curves.bepQ < 220);
  assert.ok(curves.operatingPoint.qM3h > 0);
  assert.ok(curves.points[0].headSeries > curves.points[0].headSingle);
});

test('calculators and unit conversions match physical equations', () => {
  const pWater = calcHydrostaticPressure(1000, 10, 9.81);
  assert.ok(Math.abs(pWater.bar - 0.981) < 0.001);

  const pwr = calcPumpPowers(180, 50, 1000, 75, 95);
  assert.ok(Math.abs(pwr.hydraulicKw - 24.53) < 0.05);
  assert.ok(Math.abs(pwr.shaftKw - 32.7) < 0.1);

  const aff = calcAffinityBySpeed(100, 40, 20, 3000, 1500);
  assert.equal(aff.q2, 50);
  assert.equal(aff.h2, 10);
  assert.equal(aff.p2Kw, 2.5);

  const psi = convertUnitValue('pressure', 1, 'bar', 'psi');
  assert.ok(Math.abs(psi - 14.5038) < 0.01);
});

test('strict MSQ grading awards 1 ONLY on exact match and 0 when wrong selected or correct omitted', () => {
  const sampleQ: MsqQuestion = {
    id: 'T1',
    chapterId: 1,
    chapterTitle: 'Test',
    difficulty: 'أساسي',
    role: 'operator',
    category: 'Test',
    prompt: 'Test prompt',
    options: ['A', 'B', 'C', 'D'],
    correctIndices: [0, 2],
    optionRationales: ['rA', 'rB', 'rC', 'rD'],
    concept: 'test',
    sourceTag: 'source',
  };

  assert.equal(gradeMsqQuestion(sampleQ, [0, 2]).isExactMatch, true);
  assert.equal(gradeMsqQuestion(sampleQ, [2, 0]).strictScore, 1);

  // Missing one correct -> 0
  const missed = gradeMsqQuestion(sampleQ, [0]);
  assert.equal(missed.isExactMatch, false);
  assert.equal(missed.strictScore, 0);
  assert.deepEqual(missed.missedCorrect, [2]);

  // Extra wrong -> 0
  const extra = gradeMsqQuestion(sampleQ, [0, 1, 2]);
  assert.equal(extra.isExactMatch, false);
  assert.equal(extra.strictScore, 0);
  assert.deepEqual(extra.wrongSelected, [1]);

  // Empty -> 0
  assert.equal(gradeMsqQuestion(sampleQ, []).strictScore, 0);

  const exam = gradeExam([sampleQ], { T1: [0] });
  assert.equal(exam.scorePct, 0);
  assert.deepEqual(exam.weakChapters, [1]);
});
