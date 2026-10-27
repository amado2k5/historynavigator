// Islam Museum Time Browser client. Static JSON in, timeline out. No AI at runtime.
import { useEffect, useMemo, useState } from 'react';
import type { Lang, TimeBrowserIndex, TimeBrowserRecord } from './types.ts';
import { loadIndex, pick, searchRecords } from './services/data.ts';
import { strings } from './i18n.ts';
import { Header } from './components/Header.tsx';
import { TimelineStrip } from './components/TimelineStrip.tsx';
import { DetailPanel } from './components/DetailPanel.tsx';
import { StopMedia } from './components/StopMedia.tsx';

const DEFAULT_LANG: Lang = 'ar';

export default function App() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [dark, setDark] = useState(false);
  const [index, setIndex] = useState<TimeBrowserIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // 'unset' = no explicit choice yet: open at the deep-linked stop or the first record.
  const UNSET = 'unset';
  const [chosenId, setChosenId] = useState<string | null>(UNSET);

  useEffect(() => {
    let live = true;
    loadIndex(lang)
      .then((ix) => { if (live) { setIndex(ix); setError(null); } })
      .catch((e) => live && setError(String(e)));
    return () => { live = false; };
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = strings(lang).dir;
    document.documentElement.classList.toggle('dark', dark);
  }, [lang, dark]);

  const s = strings(lang);
  const visible = useMemo(() => searchRecords(index?.records ?? [], query), [index, query]);
  const records = index?.records ?? [];
  // Deep link: #<kind>/<slug>. Chosen id may point outside the current filter — still show it.
  const currentId = chosenId === UNSET
    ? (decodeURIComponent(location.hash.slice(1)) || records[0]?.id || null)
    : chosenId;
  const current: TimeBrowserRecord | null =
    (currentId ? records.find((r) => r.id === currentId) : null) ??
    (chosenId === UNSET ? (visible[0] ?? null) : null);

  useEffect(() => {
    if (current) history.replaceState(null, '', `#${current.id}`);
  }, [current]);

  return (
    <div className="flex h-full flex-col" dir={s.dir}>
      <Header lang={lang} onLang={setLang} query={query} onQuery={setQuery} dark={dark} onDark={setDark} />

      <div className="relative flex min-h-0 flex-1">
        {/* main stage */}
        <main className="tb-panel relative min-w-0 flex-1 p-4 md:p-8" aria-live="polite">
          {error && (
            <p role="alert" className="rounded-md border p-3 text-sm" style={{ borderColor: 'var(--tb-line)', color: 'var(--tb-muted)' }}>
              {s.loadError}
            </p>
          )}
          {!error && !index && <p style={{ color: 'var(--tb-muted)' }}>{s.loading}</p>}
          {index && !visible.length && (
            <p className="text-sm" style={{ color: 'var(--tb-muted)' }}>
              {query ? s.noResults : s.notInBrowser}
            </p>
          )}
          {current && (
            <article className="mx-auto max-w-2xl">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--tb-muted)' }}>{current.kind}</p>
              <h2 className="mt-1 text-3xl font-bold">{pick(current.title, lang)}</h2>
              <div className="mt-4">
                <StopMedia record={current} lang={lang} />
              </div>
            </article>
          )}
        </main>

        {/* detail panel: side on md+, bottom sheet on phones (panel is absolute there) */}
        <DetailPanel record={current} lang={lang} onClose={() => setChosenId(null)} />
      </div>

      <TimelineStrip records={visible} currentId={currentId} onSelect={setChosenId} lang={lang} />
    </div>
  );
}
