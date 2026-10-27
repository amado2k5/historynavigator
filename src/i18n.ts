// Minimal UI strings. The product name ships in the three museum languages:
// ar متصفح الزمن, en Time Browser, ur ٹائم براؤزر (Urdu pending a native reviewer — DESIGN §8).
import type { Lang } from './types.ts';

export interface Strings {
  appName: string;
  searchPlaceholder: string;
  sources: string;
  kids: string;
  draft: string;
  openOnSite: string;
  noResults: string;
  notInBrowser: string;
  loading: string;
  loadError: string;
  closePanel: string;
  prevStop: string;
  nextStop: string;
  timeline: string;
  dir: 'rtl' | 'ltr';
}

const STRINGS: Record<Lang, Strings> = {
  ar: {
    appName: 'متصفح الزمن',
    searchPlaceholder: 'ابحث في سجلات متصفح الزمن…',
    sources: 'المصادر',
    kids: 'للصغار',
    draft: 'مسودة',
    openOnSite: 'افتح في المتحف',
    noResults: 'لا نتائج في متصفح الزمن بعد',
    notInBrowser: 'ليس في متصفح الزمن بعد',
    loading: 'يُحمَّل…',
    loadError: 'تعذَّر تحميل البيانات',
    closePanel: 'أغلق اللوحة',
    prevStop: 'الوقفة السابقة',
    nextStop: 'الوقفة التالية',
    timeline: 'الشريط الزمني',
    dir: 'rtl',
  },
  en: {
    appName: 'Time Browser',
    searchPlaceholder: 'Search Time Browser records…',
    sources: 'Sources',
    kids: 'For kids',
    draft: 'Draft',
    openOnSite: 'Open on islam.museum',
    noResults: 'No results in the Time Browser yet',
    notInBrowser: 'Not in the Time Browser yet',
    loading: 'Loading…',
    loadError: 'Could not load the data',
    closePanel: 'Close panel',
    prevStop: 'Previous stop',
    nextStop: 'Next stop',
    timeline: 'Timeline',
    dir: 'ltr',
  },
  ur: {
    appName: 'ٹائم براؤزر',
    searchPlaceholder: 'ٹائم براؤزر کے ریکارڈ میں تلاش کریں…',
    sources: 'مصادر',
    kids: 'بچوں کے لیے',
    draft: 'مسودہ',
    openOnSite: 'اسلام میوزیم پر کھولیں',
    noResults: 'ٹائم براؤزر میں ابھی کوئی نتیجہ نہیں',
    notInBrowser: 'ابھی ٹائم براؤزر میں نہیں',
    loading: 'لوڈ ہو رہا ہے…',
    loadError: 'ڈیٹا لوڈ نہیں ہو سکا',
    closePanel: 'پینل بند کریں',
    prevStop: 'پچھلا ٹھہراؤ',
    nextStop: 'اگلا ٹھہراؤ',
    timeline: 'ٹائم لائن',
    dir: 'rtl',
  },
};

export const strings = (lang: Lang): Strings => STRINGS[lang];
