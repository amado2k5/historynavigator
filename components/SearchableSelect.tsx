import React, { useState, useRef, useEffect } from 'react';

interface SelectItem {
    name: string;
}

interface SearchableSelectProps<T extends SelectItem> {
    items: T[];
    selected: T | null;
    onChange: (value: string) => void;
    placeholder: string;
}

export const SearchableSelect = <T extends SelectItem>({ items, selected, onChange, placeholder }: SearchableSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase())
    );

    const handleSelect = (name: string) => {
        onChange(name);
        setFilter('');
        setIsOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative w-full md:w-64" ref={wrapperRef}>
            <button
                type="button"
                className="bg-[var(--color-background-light)] border border-[var(--color-primary)] rounded-md py-2 pl-3 pr-10 text-left w-full focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
                disabled={items.length === 0}
            >
                <span className="block truncate text-[var(--color-foreground)]">{selected?.name || placeholder}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-[var(--color-secondary)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </span>
            </button>
            {isOpen && (
                <div className="absolute mt-1 w-full rounded-md bg-[var(--color-background-light)] shadow-lg z-10 border border-[var(--color-primary)]">
                    <div className="p-2">
                        <input
                            type="text"
                            autoFocus
                            className="w-full bg-[var(--color-background)] text-[var(--color-foreground)] rounded-md border border-[var(--color-primary)] px-3 py-2 focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none"
                            placeholder="Search..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <ul className="max-h-60 overflow-auto">
                        {filteredItems.map(item => (
                            <li key={item.name}
                                className="text-[var(--color-foreground)] cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[var(--color-accent)] hover:text-[var(--color-background)]"
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