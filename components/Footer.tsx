import React from 'react';
import { useI18n } from '../contexts/I18nContext.tsx';

export const Footer: React.FC = () => {
    const { t } = useI18n();

    return (
        <footer className="w-full bg-black bg-opacity-20 backdrop-blur-sm p-2 text-center text-xs z-30 shadow-top flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
                <a
                    href="mailto:ahamdy@gmail.com"
                    className="text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors"
                >
                    {t('footer.contact')}
                </a>
                <p className="text-[var(--color-secondary)]">{t('footer.copyright')}</p>
                <p className="text-[var(--color-secondary)] opacity-75">
                    {t('footer.disclaimer')}
                </p>
            </div>
        </footer>
    );
};
