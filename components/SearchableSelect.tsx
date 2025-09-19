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
    isDemoMode?: boolean;
    demoValue?: string;
}

const animatedTexts = [
    "Ancient Egypt",
    "Michael Jackson",
    "Trump Era",
    "Free Masons",
    "COVID Pandemic",
    "Human Space Exploration",
    "Internet",
    "Telecommunications",
    "Iphone",
    "Apple",
    "Google",
    "Human Migrations",
];

export const SearchableSelect = <T extends SelectItem>({ items, selected, onChange, placeholder, isDemoMode = false, demoValue = '' }: SearchableSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isDisabled = items.length === 0;

    // Effect to sync the input value with the selected item from parent, but not when focused.
    useEffect(() => {
        if (!isFocused) {
            setInputValue(selected ? selected.name : '');
        }
    }, [selected, isFocused]);


    // Typing animation effect
    useEffect(() => {
        // Conditions to stop the animation
        if (isFocused || inputValue || isDisabled || isDemoMode) {
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
    }, [isFocused, inputValue, isDisabled, isDemoMode]);
    
    // Cursor blinking effect
    useEffect(() => {
        if (isFocused || inputValue || isDisabled || isDemoMode) {
            setCursorVisible(true); // Ensure cursor doesn't get stuck invisible
            return;
        }
        const cursorInterval = setInterval(() => {
            setCursorVisible(v => !v);
        }, 500);
        return () => clearInterval(cursorInterval);
    }, [isFocused, inputValue, isDisabled, isDemoMode]);


    // Handle clicks outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const filteredItems = items.filter(item =>
        inputValue && item.name.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    const exactMatch = items.some(item => item.name.toLowerCase() === inputValue?.toLowerCase());
    const showSearchOption = inputValue && inputValue.length > 2 && !exactMatch;

    const handleSelect = (name: string) => {
        onChange(name);
        setInputValue(name);
        setIsOpen(false);
        setIsFocused(false);
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsOpen(true);
        if (newValue === '') {
            onChange(''); // This signals to the parent to clear the selection
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (showSearchOption) {
                handleSelect(inputValue);
            }
        }
    };
    
    const shouldAnimate = !isFocused && !inputValue && !isDisabled && !isDemoMode;
    const cursor = (shouldAnimate || isDemoMode) && cursorVisible ? '|' : '';
    const displayPlaceholder = shouldAnimate ? `${animatedPlaceholder}${cursor}` : placeholder;
    const finalValue = isDemoMode ? `${demoValue}${cursor}` : inputValue;

    return (
        <div className="relative w-full md:w-64" ref={wrapperRef}>
            <div className="w-full">
                <input
                    type="text"
                    className="bg-[var(--color-background-light)] border border-[var(--color-primary)] rounded-md py-2 pl-3 pr-10 w-full focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none text-[var(--color-foreground)]"
                    placeholder={displayPlaceholder}
                    value={finalValue}
                    onFocus={() => {
                        setIsOpen(true);
                        setIsFocused(true);
                    }}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isDisabled || isDemoMode}
                />
                 <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-[var(--color-secondary)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </span>
            </div>

            {isOpen && !isDemoMode && (
                <div className="absolute mt-1 w-full rounded-md bg-[var(--color-background-light)] shadow-lg z-10 border border-[var(--color-primary)]">
                    <ul className="max-h-60 overflow-auto">
                        {showSearchOption && (
                             <li
                                className="text-black bg-[var(--color-accent)] cursor-pointer select-none relative py-2 px-3 font-semibold"
                                onClick={() => handleSelect(inputValue)}
                            >
                                <span className="flex items-center gap-2">
                                    <SearchIcon className="w-4 h-4" />
                                    Search for "{inputValue}"
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