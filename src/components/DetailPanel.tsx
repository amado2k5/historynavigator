// Detail panel: sidebar on tablet/desktop, bottom sheet on phones (DESIGN §1).
// Scrolls internally; shows the record, its media, sources and a visible draft label.
import React from 'react';
import type { Lang, TimeBrowserRecord } from '../types.ts';
import { pick, pickLang, recordHref } from '../services/data.ts';
import { strings } from '../i18n.ts';
import { StopMedia } from './StopMedia.tsx';

interface Props {
  record: TimeBrowserRecord | null;
  lang: Lang;
  onClose: () => void;
}

export const DetailPanel: React.FC<Props> = ({ record, lang, onClose }) => {
  const s = strings(lang);
  if (!record) return null;
  const title = pick(record.title, lang);
  const summary = pickLang(record.summary, lang);
  const href = recordHref(record, lang);
  const dateBits = [record.date?.edtf, record.date?.hijri].filter(Boolean).join(' · ');

  return (
    <aside
      className="tb-panel pointer-events-auto absolute inset-x-0 bottom-20 max-h-[55vh] rounded-t-2xl border-t p-5 shadow-xl md:static md:bottom-auto md:max-h-none md:w-80 md:shrink-0 md:rounded-none md:border-t-0 md:border-s"
      style={{ background: 'var(--tb-bg-raised)', borderColor: 'var(--tb-line)' }}
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--tb-muted)' }}>
            {record.kind}
            {record.status === 'draft' && (
              <span className="ms-2 rounded-sm border px-1 py-0.5 text-[10px]" style={{ borderColor: 'var(--tb-accent-soft)', color: 'var(--tb-accent-soft)' }}>
                {s.draft}
              </span>
            )}
          </p>
          <h2 className="mt-1 text-xl font-bold" style={{ color: 'var(--tb-fg)' }}>{title}</h2>
          {dateBits && <p className="mt-0.5 text-sm" style={{ color: 'var(--tb-accent)' }}>{dateBits}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={s.closePanel}
          className="rounded-md border px-2 py-1 text-sm"
          style={{ borderColor: 'var(--tb-line)', color: 'var(--tb-muted)' }}
        >
          ✕
        </button>
      </div>

      <div className="mt-4">
        <StopMedia record={record} lang={lang} />
      </div>

      {summary.text && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--tb-fg)' }} lang={summary.lang ?? undefined}>
          {summary.text}
        </p>
      )}

      {record.kids && (
        <div className="mt-4 rounded-md border p-3" style={{ borderColor: 'var(--tb-line)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--tb-accent)' }}>{s.kids}</h3>
          <p className="mt-1 text-sm" lang={pickLang(record.kids, lang).lang ?? undefined} style={{ color: 'var(--tb-fg)' }}>
            {pickLang(record.kids, lang).text}
          </p>
        </div>
      )}

      {record.perspectives?.map((p, i) => (
        <div key={i} className="mt-3 rounded-md border p-3" style={{ borderColor: 'var(--tb-line)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--tb-muted)' }}>{p.label}</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--tb-fg)' }}>{pick(p.text, lang)}</p>
        </div>
      ))}

      {record.sources && record.sources.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--tb-muted)' }}>{s.sources}</h3>
          <ul className="mt-1 list-inside list-disc text-xs" style={{ color: 'var(--tb-muted)' }}>
            {record.sources.map((src) => <li key={src}>{src}</li>)}
          </ul>
        </div>
      )}

      {href && (
        <a
          href={href}
          className="mt-5 inline-block rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: 'var(--tb-accent)', color: 'var(--tb-accent)' }}
        >
          {s.openOnSite} →
        </a>
      )}
    </aside>
  );
};
