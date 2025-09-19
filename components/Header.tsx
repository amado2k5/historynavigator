import React from 'react';
import { SearchableSelect } from './SearchableSelect.tsx';
import type { Civilization, User } from '../types.ts';
import { UserProfile } from './UserProfile.tsx';
import { GlobeIcon } from './Icons.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface HeaderProps {
    civilizations: { name: string }[];
    selectedCivilization: Civilization | null;
    onCivilizationChange: (name: string) => void;
    onLanguageIconClick: () => void;
    isKidsMode: boolean;
    onKidsModeToggle: () => void;
    isLoading: boolean;
    user: User | null;
    onLogout: () => void;
    onProfileClick: () => void;
    onFavoritesClick: () => void;
    onSharesClick: () => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
    isDemoMode: boolean;
    demoSearchText: string;
    startDemo: () => void;
    stopDemo: () => void;
    showLoginPrompt: boolean;
    onLoginButtonClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    civilizations,
    selectedCivilization,
    onCivilizationChange,
    onLanguageIconClick,
    isKidsMode,
    onKidsModeToggle,
    isLoading,
    user,
    onLogout,
    onProfileClick,
    onFavoritesClick,
    onSharesClick,
    track,
    isDemoMode,
    demoSearchText,
    startDemo,
    stopDemo,
    showLoginPrompt,
    onLoginButtonClick
}) => {
    const { t } = useI18n();

    const SettingsControls = () => (
        <>
            <button 
                onClick={onLanguageIconClick} 
                className="p-2 rounded-full hover:bg-[var(--color-primary)] transition-colors"
                aria-label="Select language"
            >
                <GlobeIcon className="w-6 h-6 text-[var(--color-secondary)]" />
            </button>

            <div className="flex items-center">
                <label htmlFor="kids-mode-toggle" className="mr-2 text-sm text-[var(--color-secondary)]">{t('header.kidsMode')}</label>
                <button
                    id="kids-mode-toggle"
                    onClick={onKidsModeToggle}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isKidsMode ? 'bg-[var(--color-accent)]' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isKidsMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </>
    );

    return (
        <header className="w-full bg-black bg-opacity-40 backdrop-blur-sm p-2 z-30 shadow-bottom flex flex-col md:flex-row items-center md:justify-between gap-2">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                <img src="timelineThisLogo.png" alt="TimelineThis Logo" className="h-16" />
                {isDemoMode ? (
                     <button
                        onClick={stopDemo}
                        className="px-4 py-2 text-sm bg-red-600 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                        {t('header.exitDemoButton')}
                    </button>
                ) : (
                    <button
                        onClick={startDemo}
                        className="px-4 py-2 text-sm bg-[var(--color-accent)] text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                        {t('header.tourButton')}
                    </button>
                )}
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto flex-col sm:flex-row">
                <div className="text-right hidden sm:block flex-grow">
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">{t('header.exploreTopic')}</p>
                    <p className="text-xs text-[var(--color-secondary)]">{t('header.exploreSubtext')}</p>
                </div>

                <div className="w-full sm:w-64">
                    <SearchableSelect
                        items={civilizations}
                        selected={selectedCivilization}
                        onChange={onCivilizationChange}
                        placeholder={isLoading ? t('header.loading') : t('header.searchPlaceholder')}
                        isDemoMode={isDemoMode}
                        demoValue={demoSearchText}
                    />
                </div>
                
                {user ? (
                    <>
                        <SettingsControls />
                        <UserProfile
                            user={user}
                            onLogout={onLogout}
                            onProfileClick={onProfileClick}
                            onFavoritesClick={onFavoritesClick}
                            onSharesClick={onSharesClick}
                        />
                    </>
                ) : (
                    <>
                       <SettingsControls />
                       {!showLoginPrompt && (
                            <button
                                onClick={onLoginButtonClick}
                                className="px-6 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all animate-fade-in"
                            >
                                {t('header.loginButton')}
                            </button>
                        )}
                    </>
                )}
            </div>
        </header>
    );
};
