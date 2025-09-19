// services/i18n.ts

// Since we can't statically import for type inference, define a generic type.
type Translations = Record<string, any>;

const translations: { [key: string]: Translations } = {};

/**
 * Fetches all language JSON files and populates the translations object.
 * This must be called before the application renders.
 */
export const initializeI18n = async (): Promise<void> => {
    try {
        const [enRes, esRes, frRes, jaRes] = await Promise.all([
            fetch('/locales/en.json'),
            fetch('/locales/es.json'),
            fetch('/locales/fr.json'),
            fetch('/locales/ja.json'),
        ]);

        if (!enRes.ok || !esRes.ok || !frRes.ok || !jaRes.ok) {
            throw new Error('Failed to fetch one or more translation files.');
        }

        const [en, es, fr, ja] = await Promise.all([
            enRes.json(),
            esRes.json(),
            frRes.json(),
            jaRes.json(),
        ]);

        translations['en'] = en;
        translations['es'] = es;
        translations['fr'] = fr;
        translations['ja'] = ja;
    } catch (error) {
        console.error('Could not initialize i18n. Loading English as a fallback.', error);
        // Attempt to load English so the app is at least partially functional.
        try {
            const enRes = await fetch('/locales/en.json');
            if (enRes.ok) {
                translations['en'] = await enRes.json();
            } else {
                 throw new Error('Fallback to English also failed.');
            }
        } catch (fallbackError) {
             console.error('Critical: Could not load any translation files.', fallbackError);
        }
    }
};


// A function to get a nested property from an object using a string key
const getNestedTranslation = (obj: any, key: string): string | undefined => {
    return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

/**
 * Translates a key into the given language, with placeholders.
 * @param lang - The language code (e.g., 'en', 'es').
 * @param key - The translation key (e.g., 'header.title').
 * @param replacements - An object of placeholders to replace (e.g., { name: 'John' }).
 * @returns The translated string.
 */
export const translate = (lang: string, key: string, replacements?: Record<string, string | number>): string => {
    const langTranslations = translations[lang] || translations.en;
    
    if (!langTranslations) {
        console.error("i18n not initialized or failed to load. Returning key.");
        return key;
    }

    let translation = getNestedTranslation(langTranslations, key);

    // Fallback to English if the key doesn't exist in the selected language
    if (!translation) {
        translation = getNestedTranslation(translations.en, key);
    }
    
    // If still no translation, return the key itself as a fallback
    if (!translation) {
        console.warn(`Translation key not found: ${key}`);
        return key;
    }

    // Replace placeholders
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation!.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
        });
    }

    return translation;
};