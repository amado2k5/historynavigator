import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons.tsx';

interface SidebarToggleProps {
    isVisible: boolean;
    onToggle: () => void;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ isVisible, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`fixed top-1/2 -translate-y-1/2 z-40 bg-black bg-opacity-50 backdrop-blur-md text-white font-bold p-2 rounded-full border-2 transition-all duration-300 hover:bg-[var(--color-accent)] hover:text-black hover:border-[var(--color-accent)] animate-fade-in ${isVisible ? 'right-72' : 'right-4'}`}
            style={{ borderColor: 'var(--color-primary)' }}
            aria-label={isVisible ? 'Hide sidebar' : 'Show sidebar'}
        >
            {isVisible ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
        </button>
    );
};