import React from 'react';
import { Modal } from './Modal.tsx';
import { GlobeIcon } from './Icons.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface Language {
    name: string;
    nativeName: string;
    region: string;
    code: string;
}

interface LanguageModalProps {
    isOpen: boolean;
    onClose: () => void;
    languages: Language[];
    currentLanguageCode: string;
    onSelectLanguage: (languageCode: string) => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
    isOpen,
    onClose,
    languages,
    currentLanguageCode,
    onSelectLanguage,
}) => {
    const { t } = useI18n();

    const groupedLanguages = languages.reduce((acc, lang) => {
        (acc[lang.region] = acc[lang.region] || []).push(lang);
        return acc;
    }, {} as Record<string, Language[]>);

    const sortedRegions = Object.keys(groupedLanguages).sort();

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="flex items-center gap-4 mb-6">
                <GlobeIcon className="w-8 h-8 text-[var(--color-accent)]" />
                <h2 className="text-2xl font-bold font-heading" style={{ color: 'var(--color-accent)' }}>
                    {t('modals.languageTitle')}
                </h2>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {sortedRegions.map((region) => (
                    <div key={region}>
                        <h3 className="font-bold text-[var(--color-foreground)] mb-2 sticky top-0 bg-[var(--color-background)] py-1">
                            {region}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {groupedLanguages[region].map((lang) => (
                                <button
                                    key={lang.name}
                                    onClick={() => onSelectLanguage(lang.code)}
                                    className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${
                                        currentLanguageCode === lang.code
                                            ? 'bg-[var(--color-accent)] text-black font-bold'
                                            : 'bg-[var(--color-background-light)] text-[var(--color-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)]'
                                    }`}
                                >
                                    <span className="block font-semibold">{lang.name}</span>
                                    <span className="text-xs opacity-80">{lang.nativeName}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};
