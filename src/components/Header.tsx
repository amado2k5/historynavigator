import React from 'react';
import type { Lang } from '../types.ts';
import { LANGS } from '../types.ts';
import { strings } from '../i18n.ts';

interface Props {
  lang: Lang;
  onLang: (l: Lang) => void;
  query: string;
  onQuery: (q: string) => void;
  dark: boolean;
  onDark: (d: boolean) => void;
}

const LANG_LABEL: Record<Lang, string> = { ar: 'العربية', en: 'English', ur: 'اردو' };

export const Header: React.FC<Props> = ({ lang, onLang, query, onQuery, dark, onDark }) => {
  const s = strings(lang);
  return (
    <header
      className="flex shrink-0 items-center gap-3 border-b px-4 py-2"
      style={{ borderColor: 'var(--tb-line)', background: 'var(--tb-bg-raised)' }}
    >
      <h1 className="text-lg font-bold" style={{ color: 'var(--tb-accent)' }}>{s.appName}</h1>
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={s.searchPlaceholder}
        aria-label={s.searchPlaceholder}
        className="min-w-0 flex-1 rounded-md border bg-transparent px-3 py-1.5 text-sm"
        style={{ borderColor: 'var(--tb-line)', color: 'var(--tb-fg)' }}
      />
      <div className="flex items-center gap-1" role="group" aria-label="Language">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLang(l)}
            aria-pressed={l === lang}
            className="rounded-md border px-2 py-1 text-xs"
            style={{
              borderColor: l === lang ? 'var(--tb-accent)' : 'var(--tb-line)',
              color: l === lang ? 'var(--tb-accent)' : 'var(--tb-muted)',
            }}
          >
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onDark(!dark)}
        aria-pressed={dark}
        aria-label="Dark mode"
        className="rounded-md border px-2 py-1 text-xs"
        style={{ borderColor: 'var(--tb-line)', color: 'var(--tb-muted)' }}
      >
        {dark ? '☾' : '☀'}
      </button>
    </header>
  );
};
