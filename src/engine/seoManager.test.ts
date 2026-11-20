import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_ORIGIN,
  buildCanonicalPath,
  buildSeoMetadata,
  resolveRouteFromLocation,
  VALID_WORKSPACE_TABS,
} from './seoManager';
import { LESSONS } from '../data/lessons';

test('resolveRouteFromLocation handles root, workspace tabs, lessons, autostart, and 404 routes', () => {
  assert.deepEqual(resolveRouteFromLocation('/', ''), {
    tab: 'home',
    searchQuery: undefined,
    isNotFound: false,
  });

  assert.deepEqual(resolveRouteFromLocation('/', '?tab=lessons&lesson=5'), {
    tab: 'lessons',
    lessonId: 5,
    searchQuery: undefined,
    isNotFound: false,
  });

  assert.deepEqual(resolveRouteFromLocation('/', '?autostart=1'), {
    tab: 'lab3d',
    searchQuery: undefined,
    isNotFound: false,
  });

  const badPath = resolveRouteFromLocation('/non-existent-route', '');
  assert.equal(badPath.isNotFound, true);

  const badTab = resolveRouteFromLocation('/', '?tab=invalid_section');
  assert.equal(badTab.isNotFound, true);
});

test('buildSeoMetadata generates unique titles, descriptions, HTTPS canonicals, and valid JSON-LD for all tabs', () => {
  const seenTitles = new Set<string>();
  const seenDescriptions = new Set<string>();
  const seenCanonicals = new Set<string>();

  for (const tab of VALID_WORKSPACE_TABS) {
    const meta = buildSeoMetadata({ tab, origin: 'http://localhost:3000' });
    assert.ok(meta.title.length >= 25, `Title too short for ${tab}`);
    assert.ok(meta.description.length >= 100 && meta.description.length <= 185, `Description out of range for ${tab}`);
    assert.ok(meta.canonicalUrl.startsWith(PRODUCTION_ORIGIN), 'Canonical must use HTTPS production origin');
    assert.ok(meta.robots.includes('index, follow'));
    assert.equal(seenTitles.has(meta.title), false, `Duplicate title for ${tab}`);
    assert.equal(seenDescriptions.has(meta.description), false, `Duplicate description for ${tab}`);
    assert.equal(seenCanonicals.has(meta.canonicalUrl), false, `Duplicate canonical for ${tab}`);
    seenTitles.add(meta.title);
    seenDescriptions.add(meta.description);
    seenCanonicals.add(meta.canonicalUrl);
    assert.doesNotThrow(() => JSON.stringify(meta.jsonLd));
  }
});

test('buildSeoMetadata handles specific lesson article schema and 404 noindex', () => {
  const lessonMeta = buildSeoMetadata({ tab: 'lessons', lesson: LESSONS[3] });
  assert.ok(lessonMeta.title.includes(LESSONS[3].title));
  assert.equal(lessonMeta.canonicalUrl, `${PRODUCTION_ORIGIN}${buildCanonicalPath('lessons', LESSONS[3].id)}`);
  assert.equal(lessonMeta.ogType, 'article');

  const notFoundMeta = buildSeoMetadata({ tab: 'home', isNotFound: true });
  assert.equal(notFoundMeta.robots, 'noindex, follow');
  assert.ok(notFoundMeta.title.includes('404'));
});
