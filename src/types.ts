// Time Browser record shapes — time-browser-plan/DESIGN.md §3 (islam-museum repo).
// One record per stop; produced by the islam-museum build pipeline, served as static JSON.

export type Lang = 'ar' | 'en' | 'ur';
export const LANGS: Lang[] = ['ar', 'en', 'ur'];

export type Localized = Partial<Record<Lang, string>>;

export type RecordKind =
  | 'event' | 'person' | 'place' | 'polity' | 'period' | 'theme'
  | 'work' | 'concept' | 'practice' | 'building' | 'object' | 'group'
  | 'journey' | 'exhibit' | 'question' | string;

export interface StopDate {
  edtf?: string;
  hijri?: string;
  calendar?: string;
  precision?: string;
  /** sortable numeric extent, when the stop has a date */
  earliest?: number;
  latest?: number;
}

export interface StopImage {
  id: string;
  /** file path relative to the data base URL, or absolute https URL */
  src: string;
  alt: Localized;
  credit?: string;
  licence?: string;
}

export interface StopMap {
  id: string;
  src: string;
  alt?: Localized;
}

export interface Perspective {
  label: string;
  text: Localized;
  sources?: string[];
}

export interface TimeBrowserRecord {
  id: string;
  kind: RecordKind;
  date?: StopDate;
  title: Localized;
  summary?: Localized;
  /** deep link on islam.museum */
  href?: string;
  sources?: string[];
  image?: StopImage;
  map?: StopMap;
  card?: { id: string; src: string };
  kids?: Localized;
  related?: string[];
  perspectives?: Perspective[];
  /** 'draft' records render with a visible label (DESIGN §1) */
  status?: 'draft' | 'published' | 'reviewed' | 'verified';
}

/** /time-browser-data/<lang>/index.json — search index + topic list */
export interface TimeBrowserIndex {
  generated?: string;
  lang?: Lang;
  topics?: { id: string; title: Localized; count?: number }[];
  records: TimeBrowserRecord[];
}

// ---- Raw wire shape written by islam-museum's TB1 build (scripts/time-browser.ts) --------
// { base, topics: { <topic>: RawRecord[] } }; normalized into TimeBrowserRecord by the
// data service. Media fields (image/map/card) arrive with the TB2 media wiring.
export interface RawTBRecord {
  id: string;
  kind: string;
  timelineKey: number;
  date: string; // EDTF string
  title: Record<string, string>;
  summary: Record<string, string>;
  href: string; // "/<lang>/<class>/<slug>/"
  sources: string[];
  draft: boolean;
  /** TB1 post-#2433: kids-mode text per lang (empty while content is written). */
  kids?: Partial<Record<Lang, string>> | null;
  /** TB1 post-#2433: related stop ids (graph edges). */
  related?: string[];
  /** TB1 derived-position flag (D9/D11): true when the timelineKey came from a
   * linked period rather than the record's own or a founded date. */
  derived?: boolean;
  image?: { id: string; src: string; alt: Localized; credit?: string; licence?: string };
  map?: { id: string; src: string; alt?: Localized };
  card?: { id: string; src: string };
  perspectives?: Perspective[];
}

export interface RawTBIndex {
  base: string;
  topics: Record<string, RawTBRecord[]>;
}
