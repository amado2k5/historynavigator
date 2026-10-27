import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  indexUrl, loadIndex, mediaUrl, pick, pickLang, recordHref, resetCache,
  searchRecords, sortRecords, useSampleIndex,
} from './data.ts';
import type { TimeBrowserIndex } from '../types.ts';

const sample: TimeBrowserIndex = {
  records: [
    { id: 'event/b', kind: 'event', title: { ar: 'ب', en: 'B' }, date: { edtf: '0622', earliest: 622, latest: 622 }, status: 'published' },
    { id: 'event/a', kind: 'event', title: { ar: 'أ', en: 'A' }, date: { edtf: '0624', earliest: 624, latest: 624 }, status: 'draft' },
    { id: 'concept/x', kind: 'concept', title: { ar: 'س', en: 'X' }, status: 'draft' },
  ],
};

beforeEach(resetCache);

describe('data service', () => {
  it('builds the index URL from the single base constant', () => {
    expect(indexUrl('ar')).toBe('https://islam.museum/time-browser-data/ar/index.json');
  });

  it('caches the index per language and supports a sample fallback', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    // primary fails -> falls back to /sample/index.json which also fails -> rejects
    await expect(loadIndex('en')).rejects.toThrow('offline');
    resetCache();
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      url.includes('/sample/index.json')
        ? new Response(JSON.stringify(sample), { status: 200 })
        : Promise.reject(new Error('no feed')),
    ) as never);
    const ix = await loadIndex('en');
    expect(ix.records).toHaveLength(3);
    vi.unstubAllGlobals();
  });

  it('sorts dated records by earliest year, undated last', () => {
    const sorted = sortRecords(sample.records).map((r) => r.id);
    expect(sorted).toEqual(['event/b', 'event/a', 'concept/x']);
  });

  it('searches titles and summaries across languages', () => {
    expect(searchRecords(sample.records, 'x')).toHaveLength(1);
    expect(searchRecords(sample.records, '')).toHaveLength(3);
    expect(searchRecords(sample.records, 'zzz')).toHaveLength(0);
  });

  it('prefers the page language, falls back ar then en, never machine-translates', () => {
    const l = { ar: 'أهلاً', en: 'Hello' };
    expect(pick(l, 'ur')).toBe('أهلاً');
    expect(pickLang(l, 'ur')).toEqual({ text: 'أهلاً', lang: 'ar' });
  });

  it('resolves media against the serving origin; absolute URLs pass through', () => {
    useSampleIndex('en', sample, 'http://localhost:5173');
    expect(mediaUrl('media/time-browser/cards/c.svg')).toBe('http://localhost:5173/media/time-browser/cards/c.svg');
    expect(mediaUrl('https://upload.wikimedia.org/x.jpg')).toBe('https://upload.wikimedia.org/x.jpg');
  });

  it('builds entity deep links under the site base', () => {
    const rec = { ...sample.records[0], href: '/event/b/' };
    expect(recordHref(rec, 'ar')).toBe('https://islam.museum/ar/event/b/');
    expect(recordHref({ ...sample.records[0], href: '/en/event/b/' }, 'ar')).toBe('https://islam.museum/en/event/b/');
    expect(recordHref({ ...sample.records[0], href: undefined }, 'ar')).toBeNull();
  });

  it('normalizes the real TB1 index shape (topics map, draft flag, EDTF string)', async () => {
    const raw = {
      base: '/time-browser-data',
      topics: {
        event: [
          { id: 'event/x', kind: 'event', timelineKey: 622.5, date: '0622', title: { ar: 'س', en: 'X' }, summary: { ar: 's' }, href: '/ar/event/x/', sources: ['source/a'], draft: true, kids: [] },
        ],
      },
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      url === indexUrl('en') ? new Response(JSON.stringify(raw), { status: 200 }) : Promise.reject(new Error('only feed')),
    ) as never);
    const ix = await loadIndex('en');
    expect(ix.records).toHaveLength(1);
    expect(ix.records[0].status).toBe('draft');
    expect(ix.records[0].date).toEqual({ edtf: '0622', earliest: 622.5, latest: 622.5 });
    vi.unstubAllGlobals();
  });
});
