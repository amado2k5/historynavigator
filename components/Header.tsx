
import React from 'react';
import { SearchableSelect } from './SearchableSelect.tsx';
import { GlobalSearch } from './GlobalSearch.tsx';
import type { Civilization, User } from '../types.ts';
import { LANGUAGES } from '../constants.ts';
import { UserProfile } from './UserProfile.tsx';

interface HeaderProps {
    civilizations: { name: string }[];
    selectedCivilization: Civilization | null;
    onCivilizationChange: (name: string) => void;
    language: string;
    onLanguageChange: (lang: string) => void;
    isKidsMode: boolean;
    onKidsModeToggle: () => void;
    onSearchResultClick: (item: any) => void;
    isLoading: boolean;
    user: User | null;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    civilizations,
    selectedCivilization,
    onCivilizationChange,
    language,
    onLanguageChange,
    isKidsMode,
    onKidsModeToggle,
    onSearchResultClick,
    isLoading,
    user,
    onLogout
}) => {
    const languageItems = LANGUAGES.map(lang => ({ name: lang }));

    return (
        <header className="w-full bg-black bg-opacity-40 backdrop-blur-sm p-4 z-30 shadow-bottom flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>History Navigator</h1>
            
            <div className="flex items-center gap-4 flex-wrap">
                <SearchableSelect
                    items={civilizations}
                    selected={selectedCivilization}
                    onChange={onCivilizationChange}
                    placeholder={isLoading ? "Loading..." : "Select Civilization"}
                />
                
                <GlobalSearch
                    civilization={selectedCivilization}
                    language={language}
                    isKidsMode={isKidsMode}
                    onResultClick={onSearchResultClick}
                />
                
                {user ? (
                    <UserProfile user={user} onLogout={onLogout} />
                ) : (
                    <>
                        <SearchableSelect
                            items={languageItems}
                            selected={{ name: language }}
                            onChange={onLanguageChange}
                            placeholder="Select Language"
                        />

                        <div className="flex items-center">
                            <label htmlFor="kids-mode-toggle" className="mr-2 text-sm text-[var(--color-secondary)]">Kids Mode</label>
                            <button
                                id="kids-mode-toggle"
                                onClick={onKidsModeToggle}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isKidsMode ? 'bg-[var(--color-accent)]' : 'bg-gray-600'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isKidsMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};
