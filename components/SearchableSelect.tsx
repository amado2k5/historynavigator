import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon } from './Icons.tsx';

interface SelectItem {
    name: string;
}

interface SearchableSelectProps<T extends SelectItem> {
    items: T[];
    selected: T | null;
    onChange: (value: string) => void;
    placeholder: string;
}

const animatedTexts = [
    "Ancient Egypt",
    "Michael Jackson",
    "Trump Era",
    "Free Masons",
    "COVID Pandemic",
];

export const SearchableSelect = <T extends SelectItem>({ items, selected, onChange, placeholder }: SearchableSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isDisabled = items.length === 0;

    // Typing animation effect
    useEffect(() => {
        // Conditions to stop the animation
        if (isFocused || filter || selected?.name || isDisabled) {
            return;
        }

        let currentTextIndex = 0;
        let currentCharIndex = 0;
        let isDeleting = false;
        let timeoutId: number;

        const type = () => {
            const currentText = animatedTexts[currentTextIndex];
            
            if (isDeleting) {
                setAnimatedPlaceholder(currentText.substring(0, currentCharIndex - 1));
                currentCharIndex--;
                if (currentCharIndex === 0) {
                    isDeleting = false;
                    currentTextIndex = (currentTextIndex + 1) % animatedTexts.length;
                    timeoutId = window.setTimeout(type, 1200); // Pause before typing next word
                } else {
                    timeoutId = window.setTimeout(type, 80); // Deleting speed
                }
            } else {
                setAnimatedPlaceholder(currentText.substring(0, currentCharIndex + 1));
                currentCharIndex++;
                if (currentCharIndex > currentText.length) {
                    isDeleting = true;
                    timeoutId = window.setTimeout(type, 2000); // Pause at end of word
                } else {
                    timeoutId = window.setTimeout(type, 120); // Typing speed
                }
            }
        };

        timeoutId = window.setTimeout(type, 500); // Initial delay

        return () => clearTimeout(timeoutId);
    }, [isFocused, filter, selected, isDisabled]);
    
    // Cursor blinking effect
    useEffect(() => {
        if (isFocused || filter || selected?.name || isDisabled) {
            return;
        }
        const cursorInterval = setInterval(() => {
            setCursorVisible(v => !v);
        }, 500);
        return () => clearInterval(cursorInterval);
    }, [isFocused, filter, selected, isDisabled]);


    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase())
    );
    
    const exactMatch = items.some(item => item.name.toLowerCase() === filter.toLowerCase());
    const showSearchOption = filter.length > 2 && !exactMatch;

    const handleSelect = (name: string) => {
        onChange(name);
        setFilter('');
        setIsOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setFilter('');
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const shouldAnimate = !isFocused && !filter && !selected?.name && !isDisabled;
    const cursor = shouldAnimate && cursorVisible ? '|' : '';
    const displayPlaceholder = shouldAnimate ? `${animatedPlaceholder}${cursor}` : placeholder;

    return (
        <div className="relative w-full md:w-64" ref={wrapperRef}>
            <div className="w-full">
                <input
                    type="text"
                    className="bg-[var(--color-background-light)] border border-[var(--color-primary)] rounded-md py-2 pl-3 pr-10 w-full focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none text-[var(--color-foreground)]"
                    placeholder={displayPlaceholder}
                    value={filter || selected?.name || ''}
                    onFocus={() => {
                        setIsOpen(true);
                        setIsFocused(true);
                    }}
                    onChange={(e) => {
                        setFilter(e.target.value);
                        setIsOpen(true);
                    }}
                    disabled={isDisabled}
                />
                 <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-[var(--color-secondary)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </span>
            </div>

            {isOpen && (
                <div className="absolute mt-1 w-full rounded-md bg-[var(--color-background-light)] shadow-lg z-10 border border-[var(--color-primary)]">
                    <ul className="max-h-60 overflow-auto">
                        {showSearchOption && (
                             <li
                                className="text-black bg-[var(--color-accent)] cursor-pointer select-none relative py-2 px-3 font-semibold"
                                onClick={() => handleSelect(filter)}
                            >
                                <span className="flex items-center gap-2">
                                    <SearchIcon className="w-4 h-4" />
                                    Search for "{filter}"
                                </span>
                            </li>
                        )}
                        {filteredItems.map(item => (
                            <li key={item.name}
                                className="text-[var(--color-foreground)] cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[var(--color-primary)]"
                                onClick={() => handleSelect(item.name)}>
                                <span className="font-normal block truncate">{item.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};