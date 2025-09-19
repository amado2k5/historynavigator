
import React from 'react';
import { StarIcon } from './Icons.tsx';

interface FavoriteIconProps {
    isFavorited: boolean;
    onToggle: () => void;
}

export const FavoriteIcon: React.FC<FavoriteIconProps> = ({ isFavorited, onToggle }) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent clicks from bubbling up to parent elements
        onToggle();
    };

    return (
        <button
            onClick={handleClick}
            className={`p-2 rounded-full transition-colors duration-200 group relative ${isFavorited ? 'text-[var(--color-accent)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-accent)]'}`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
            <StarIcon className="w-6 h-6" filled={isFavorited} />
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-[var(--color-background)] text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {isFavorited ? 'Unfavorite' : 'Favorite'}
            </span>
        </button>
    );
};
