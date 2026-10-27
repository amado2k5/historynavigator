// Stop visual: real image if the record carries one, else its generated SVG card,
// else its cluster map. All prepared at build time on islam-museum — nothing generated here.
import React from 'react';
import type { Lang, TimeBrowserRecord } from '../types.ts';
import { mediaUrl, pick } from '../services/data.ts';

export const StopMedia: React.FC<{ record: TimeBrowserRecord; lang: Lang }> = ({ record, lang }) => {
  const img = record.image;
  if (img?.src) {
    return (
      <figure>
        <img
          src={mediaUrl(img.src)}
          alt={pick(img.alt, lang)}
          loading="lazy"
          className="w-full rounded-md border object-cover"
          style={{ borderColor: 'var(--tb-line)' }}
        />
        {img.credit && (
          <figcaption className="mt-1 text-xs" style={{ color: 'var(--tb-muted)' }}>
            {img.credit}{img.licence ? ` · ${img.licence}` : ''}
          </figcaption>
        )}
      </figure>
    );
  }
  const card = record.card;
  if (card?.src) {
    return (
      <img
        src={mediaUrl(card.src)}
        alt={pick(record.title, lang)}
        loading="lazy"
        className="w-full rounded-md border object-cover"
        style={{ borderColor: 'var(--tb-line)' }}
      />
    );
  }
  if (record.map?.src) {
    return (
      <img
        src={mediaUrl(record.map.src)}
        alt={pick(record.map.alt, lang) || pick(record.title, lang)}
        loading="lazy"
        className="w-full rounded-md border object-cover"
        style={{ borderColor: 'var(--tb-line)', background: 'var(--tb-sea)' }}
      />
    );
  }
  return null;
};
