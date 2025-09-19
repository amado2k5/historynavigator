import React from 'react';

interface ViewModeToggleProps {
    viewMode: '2D' | '3D';
    onToggle: () => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 bg-black bg-opacity-50 backdrop-blur-md text-white font-bold py-2 px-4 rounded-full border-2 transition-all duration-300 hover:bg-[var(--color-accent)] hover:text-black hover:border-[var(--color-accent)] animate-fade-in"
            style={{ borderColor: 'var(--color-primary)' }}
            aria-label={`Switch to ${viewMode === '2D' ? '3D' : '2D'} view`}
        >
            {viewMode === '2D' ? '3D' : '2D'}
        </button>
    );
};