import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, PUMP_PARTS_CATALOG } from './lessons';
import { QUESTIONS } from './questions';
import { DIAGNOSTIC_MISSIONS, TROUBLE_GUIDES } from './troubleshooting';
import { MAINTENANCE_TASKS } from './maintenance';
import { ABBREVIATIONS, CASE_STUDIES, COMPARISONS, GLOSSARY_TERMS } from './toolsData';

test('curriculum contains all 27 lessons with complete structured fields and English terms', () => {
  assert.equal(LESSONS.length, 27);
  const ids = new Set(LESSONS.map((l) => l.id));
  assert.equal(ids.size, 27);
  for (let i = 1; i <= 27; i++) {
    assert.ok(ids.has(i), `Missing lesson ${i}`);
  }
  for (const l of LESSONS) {
    assert.ok(l.title.length > 5);
    assert.ok(l.englishTitle.length > 3);
    assert.ok(l.sourcePages.length > 0);
    assert.ok(l.simpleDef.text.length > 15);
    assert.ok(l.engineeringExp.length >= 1);
    assert.ok(l.englishTerms.length >= 2);
    assert.ok(l.reviewQuestions.length >= 1);
  }
  assert.ok(PUMP_PARTS_CATALOG.length >= 10);
});

test('question bank has >= 150 unique MSQ questions across all 27 chapters with valid rationales', () => {
  assert.ok(QUESTIONS.length >= 150, `Expected >=150 questions, got ${QUESTIONS.length}`);
  const ids = new Set<string>();
  const prompts = new Set<string>();
  const chaptersCovered = new Set<number>();

  for (const q of QUESTIONS) {
    assert.ok(!ids.has(q.id), `Duplicate ID ${q.id}`);
    ids.add(q.id);
    assert.ok(!prompts.has(q.prompt), `Duplicate prompt in ${q.id}`);
    prompts.add(q.prompt);
    chaptersCovered.add(q.chapterId);

    assert.ok(q.options.length >= 4 && q.options.length <= 6, `${q.id} options length`);
    assert.equal(q.optionRationales.length, q.options.length, `${q.id} rationales length mismatch`);
    assert.ok(q.correctIndices.length >= 1, `${q.id} must have >=1 correct index`);
    for (const idx of q.correctIndices) {
      assert.ok(idx >= 0 && idx < q.options.length, `${q.id} invalid correct index ${idx}`);
    }
  }

  for (let ch = 1; ch <= 27; ch++) {
    assert.ok(chaptersCovered.has(ch), `Chapter ${ch} has no questions`);
  }
});

test('troubleshooting, preventive maintenance, and tools data are complete', () => {
  // 8 PDF guides + expanded piping guide
  assert.ok(TROUBLE_GUIDES.length >= 8);
  const pdfIndices = new Set(TROUBLE_GUIDES.map((g) => g.pdfIndex).filter(Boolean));
  for (let i = 1; i <= 8; i++) {
    assert.ok(pdfIndices.has(i), `Missing PDF fault table ${i}`);
  }
  assert.ok(DIAGNOSTIC_MISSIONS.length >= 5);

  const pmPeriods = new Set(MAINTENANCE_TASKS.map((t) => t.period));
  for (const p of ['daily', 'monthly', 'quarterly', 'halfyear', 'annual'] as const) {
    assert.ok(pmPeriods.has(p), `Missing PM period ${p}`);
  }

  assert.ok(GLOSSARY_TERMS.length >= 45);
  assert.ok(ABBREVIATIONS.length >= 15);
  assert.ok(COMPARISONS.length >= 5);
  assert.ok(CASE_STUDIES.length >= 4);
});
