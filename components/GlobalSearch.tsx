

import React, { useState, useEffect, useRef } from 'react';
// FIX: Added .ts extension to the import path.
import { globalSearch } from '../services/geminiService.ts';
// FIX: Added .ts extension to the import path.
import type { Civilization } from '../types.ts';
// FIX: Added .tsx extension to the import path.
import { SearchIcon } from './Icons.tsx';

interface GlobalSearchProps {
    civilization: Civilization | null;
    onResultClick: (item: any) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ civilization, onResultClick, track }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!civilization) {
            setResults([]);
            setQuery('');
            return;
        }

        if (query.length > 2) {
            const performSearch = async () => {
                track('global_search', { query });
                const searchResults = await globalSearch(query, civilization, 'English', false); // Note: Global search doesn't use language/kids mode from UI yet
                setResults(searchResults);
                setIsOpen(true);
            };
            const timeoutId = setTimeout(performSearch, 300);
            return () => clearTimeout(timeoutId);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    }, [query, civilization, track]);
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleItemClick = (item: any) => {
        onResultClick(item);
        setQuery('');
        setIsOpen(false);
    }

    return (
        <div className="relative w-full md:w-72" ref={wrapperRef}>
            <div className="relative">
                 <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={civilization ? `Search within ${civilization.name}...` : 'Select a civilization to search'}
                    disabled={!civilization}
                    className="w-full bg-[var(--color-background-light)] border border-[var(--color-primary)] rounded-md py-2 pl-10 pr-4 text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-[var(--color-secondary)]" />
                </div>
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute mt-1 w-full rounded-md bg-[var(--color-background-light)] shadow-lg z-20 border border-[var(--color-primary)]">
                    <ul className="max-h-80 overflow-auto p-2">
                        {results.map((item, index) => (
                            <li key={`${item.type}-${item.id || item.name}-${index}`}
                                className="text-[var(--color-foreground)] cursor-pointer select-none relative p-3 rounded-md hover:bg-[var(--color-accent)] hover:text-[var(--color-background)]"
                                onClick={() => handleItemClick(item)}>
                                <div className="flex justify-between">
                                    <span className="font-semibold block truncate">{item.name || item.title}</span>
                                    <span className="text-xs uppercase font-bold text-[var(--color-primary)]">{item.type}</span>
                                </div>
                                <p className="text-sm opacity-80 mt-1">{item.summary || item.description || item.outcome}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};