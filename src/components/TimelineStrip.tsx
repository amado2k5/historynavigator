// Bottom timeline strip, kept from the original design: a horizontal rail of stops,
// current stop enlarged, arrow-key navigation. Scrolls internally; the page never does.
import React, { useEffect, useRef } from 'react';
import type { Lang, TimeBrowserRecord } from '../types.ts';
import { pick, sortRecords } from '../services/data.ts';
import { strings } from '../i18n.ts';

interface Props {
  records: TimeBrowserRecord[];
  currentId: string | null;
  onSelect: (id: string) => void;
  lang: Lang;
}

export const TimelineStrip: React.FC<Props> = ({ records, currentId, onSelect, lang }) => {
  const s = strings(lang);
  const ordered = sortRecords(records);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.querySelector<HTMLButtonElement>(`[data-stop="${CSS.escape(currentId ?? '')}"]`)
      ?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [currentId]);

  const move = (dir: 1 | -1) => {
    const i = ordered.findIndex((r) => r.id === currentId);
    const next = ordered[i + dir];
    if (next) onSelect(next.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const fwd = s.dir === 'rtl' ? e.key === 'ArrowLeft' : e.key === 'ArrowRight';
    const back = s.dir === 'rtl' ? e.key === 'ArrowRight' : e.key === 'ArrowLeft';
    if (fwd) { e.preventDefault(); move(1); }
    else if (back) { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); if (ordered[0]) onSelect(ordered[0].id); }
    else if (e.key === 'End') { e.preventDefault(); const last = ordered[ordered.length - 1]; if (last) onSelect(last.id); }
  };

  return (
    <nav
      aria-label={s.timeline}
      className="w-full shrink-0 border-t backdrop-blur-sm"
      style={{ borderColor: 'var(--tb-line)', background: 'color-mix(in srgb, var(--tb-bg-raised) 80%, transparent)' }}
      onKeyDown={onKeyDown}
    >
      <div ref={listRef} className="tb-strip relative h-20 px-6">
        <div className="absolute top-1/2 left-0 right-0 h-0.5" style={{ background: 'var(--tb-line)' }} />
        <div className="relative flex h-full items-center gap-8">
          {ordered.map((r) => {
            const current = r.id === currentId;
            const label = pick(r.title, lang);
            const dateLabel = r.date?.hijri ?? r.date?.edtf ?? '';
            return (
              <div key={r.id} className="group relative flex flex-col items-center">
                <button
                  type="button"
                  data-stop={r.id}
                  onClick={() => onSelect(r.id)}
                  aria-label={`${label}${dateLabel ? ` — ${dateLabel}` : ''}`}
                  aria-current={current ? 'true' : undefined}
                  className="tb-dot rounded-full border-2"
                  style={{
                    width: current ? 20 : 14,
                    height: current ? 20 : 14,
                    background: current ? 'var(--tb-accent)' : 'var(--tb-bg)',
                    borderColor: current ? 'var(--tb-accent)' : 'var(--tb-muted)',
                  }}
                />
                <div
                  className="pointer-events-none absolute bottom-full mb-3 w-52 rounded-md border p-2 text-center shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  style={{ background: 'var(--tb-bg-raised)', borderColor: 'var(--tb-line)' }}
                >
                  {dateLabel && <p className="text-xs font-bold" style={{ color: 'var(--tb-accent)' }}>{dateLabel}</p>}
                  <p className="text-xs" style={{ color: 'var(--tb-fg)' }}>{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {currentId ? pick(ordered.find((r) => r.id === currentId)?.title, lang) : ''}
      </div>
    </nav>
  );
};
