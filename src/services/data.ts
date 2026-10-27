// Data service: the ONLY network the client talks to is the static JSON on islam.museum.
// No AI, no model calls, no telemetry (DESIGN.md §1 "Zero runtime AI").
// One base-URL constant: moving to a subdomain later is a one-line change (DESIGN §1).
import type { Lang, RawTBIndex, TimeBrowserIndex, TimeBrowserRecord } from '../types.ts';

export const DATA_BASE = 'https://islam.museum/time-browser-data';
export const SITE_BASE = 'https://islam.museum';

const indexCache = new Map<Lang, Promise<TimeBrowserIndex>>();
// Relative media paths resolve against the origin that served index.json, so a locally
// hosted sample works the same as the real islam.museum files.
let mediaBase = SITE_BASE;

export function indexUrl(lang: Lang): string {
  return `${DATA_BASE}/${lang}/index.json`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

/** Normalize either wire shape into the client's TimeBrowserIndex. */
function normalize(ix: TimeBrowserIndex | RawTBIndex): TimeBrowserIndex {
  if ('records' in ix && Array.isArray(ix.records)) return ix as TimeBrowserIndex;
  const raw = ix as RawTBIndex;
  const records: TimeBrowserRecord[] = Object.values(raw.topics ?? {}).flat().map((r) => ({
    id: r.id,
    kind: r.kind,
    date: r.date ? { edtf: r.date, earliest: r.timelineKey, latest: r.timelineKey } : undefined,
    title: r.title,
    summary: r.summary,
    href: r.href,
    sources: r.sources,
    status: r.draft ? 'draft' : 'published',
    image: r.image,
    map: r.map,
    card: r.card,
    kids: r.kids?.length ? { en: r.kids.join('\n') } : undefined,
    perspectives: r.perspectives,
  }));
  return { records };
}

/** Fetch the record index for a language, cached per session. */
export function loadIndex(lang: Lang, url: string = indexUrl(lang)): Promise<TimeBrowserIndex> {
  if (!indexCache.has(lang)) {
    indexCache.set(lang, fetchJson<TimeBrowserIndex | RawTBIndex>(url)
      // Fallbacks, in order: a locally served real feed (dev/staging), then the sample.
      .catch(() => fetchJson<TimeBrowserIndex | RawTBIndex>(`/time-browser-data/${lang}/index.json`))
      .catch(() => fetchJson<TimeBrowserIndex>('/sample/index.json').then((ix) => ({ ...ix, _fallback: true })))
      .then((ix) => {
        try { mediaBase = new URL(url, location.href).origin; } catch { /* keep SITE_BASE */ }
        if ((ix as TimeBrowserIndex & { _fallback?: boolean })._fallback) mediaBase = '';
        return normalize(ix);
      }));
  }
  return indexCache.get(lang)!;
}

/** For tests and offline dev: inject an index without touching the cache of other langs. */
export function useSampleIndex(lang: Lang, index: TimeBrowserIndex, base: string = SITE_BASE): void {
  indexCache.set(lang, Promise.resolve(index));
  mediaBase = base;
}

export function resetCache(): void {
  indexCache.clear();
  mediaBase = SITE_BASE;
}

/**
 * Media URLs in records may be relative to the data base or absolute.
 * Map/card/image `src` values like `media/time-browser/...` resolve under SITE_BASE.
 */
export function mediaUrl(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${mediaBase}/${src.replace(/^\//, '')}`.replace(/^\//, '/');
}

/** Absolute deep link to the entity page on islam.museum.
 * TB1 writes href as "/<lang>/<class>/<slug>/"; older records may omit the lang. */
export function recordHref(rec: TimeBrowserRecord, lang: Lang): string | null {
  if (!rec.href) return null;
  if (rec.href.startsWith('http')) return rec.href;
  if (/^\/(ar|en|ur)\//.test(rec.href)) return `${SITE_BASE}${rec.href}`;
  const [cls, slug] = rec.id.split('/');
  return `${SITE_BASE}/${lang}/${cls}/${slug}/`;
}

/** Pick the best localized string: requested lang, then ar, then en, then ur. */
export function pick(l: Record<string, string> | undefined, lang: Lang): string {
  if (!l) return '';
  return l[lang] ?? l.ar ?? l.en ?? l.ur ?? '';
}

/** Urdu missing → show Arabic with lang="ar", never machine translation (DESIGN §3). */
export function pickLang(l: Record<string, string> | undefined, lang: Lang): { text: string; lang: Lang | null } {
  if (!l) return { text: '', lang: null };
  if (l[lang]) return { text: l[lang]!, lang };
  if (l.ar) return { text: l.ar, lang: 'ar' };
  if (l.en) return { text: l.en, lang: 'en' };
  if (l.ur) return { text: l.ur, lang: 'ur' };
  return { text: '', lang: null };
}

/** Records sorted for the strip: dated records by earliest year, undated last (stable by id). */
export function sortRecords(records: TimeBrowserRecord[]): TimeBrowserRecord[] {
  return [...records].sort((a, b) => {
    const ae = a.date?.earliest, be = b.date?.earliest;
    if (ae == null && be == null) return a.id.localeCompare(b.id);
    if (ae == null) return 1;
    if (be == null) return -1;
    return ae - be || a.id.localeCompare(b.id);
  });
}

/** Search the prepared records only (DESIGN §5). Case-insensitive over titles+summaries. */
export function searchRecords(records: TimeBrowserRecord[], query: string): TimeBrowserRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return records;
  return records.filter((r) =>
    Object.values(r.title ?? {}).concat(Object.values(r.summary ?? {})).some((v) => v.toLowerCase().includes(q)),
  );
}
