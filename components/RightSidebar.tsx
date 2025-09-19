
import React from 'react';
import type { Civilization, Character, War, Topic, User, Favorite } from '../types.ts';
import { FavoriteIcon } from './FavoriteIcon.tsx';

interface RightSidebarProps {
    civilization: Civilization;
    onCharacterClick: (character: Character) => void;
    onWarClick: (war: War) => void;
    onTopicClick: (topic: Topic) => void;
    user: User | null;
    favorites: Favorite[];
    isFavorited: (type: Favorite['type'], id: string) => boolean;
    toggleFavorite: (favorite: Omit<Favorite, 'civilizationName'>) => void;
    onFavoriteClick: (favorite: Favorite) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ 
    civilization, onCharacterClick, onWarClick, onTopicClick, user, favorites, isFavorited, toggleFavorite, onFavoriteClick
}) => {
    
    const renderSection = <T extends { name: string }>(
        title: string, 
        items: T[], 
        onClick: (item: T) => void, 
        type: Favorite['type']
    ) => (
        <div className="mb-6">
            <h3 className="text-lg font-bold font-heading mb-3 border-b-2" style={{borderColor: 'var(--color-primary)'}}>{title}</h3>
            <ul className="space-y-1 text-sm">
                {items.map((item) => (
                    <li key={item.name} className="flex items-center justify-between group">
                        <button 
                            onClick={() => onClick(item)}
                            className="flex-grow text-left text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200 py-1"
                        >
                           {item.name}
                        </button>
                        {user && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <FavoriteIcon
                                    isFavorited={isFavorited(type, item.name)}
                                    onToggle={() => toggleFavorite({ type, id: item.name, name: item.name })}
                                />
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    const groupedFavorites = favorites.reduce((acc, fav) => {
        (acc[fav.civilizationName] = acc[fav.civilizationName] || []).push(fav);
        return acc;
    }, {} as Record<string, Favorite[]>);

    return (
        <aside className="w-72 bg-black bg-opacity-20 backdrop-blur-sm p-4 z-30 shadow-left overflow-y-auto flex-shrink-0">
            <h2 className="text-xl font-bold font-heading mb-4" style={{ color: 'var(--color-accent)' }}>
                {civilization.name}
            </h2>
            <p className="text-sm text-[var(--color-secondary)] mb-6 leading-relaxed">
                {civilization.summary}
            </p>
            
            {renderSection('Key Characters', civilization.keyCharacters, onCharacterClick, 'character')}
            {renderSection('Major Wars', civilization.majorWars, onWarClick, 'war')}
            {renderSection('Cultural Topics', civilization.culturalTopics, onTopicClick, 'topic')}
            
            {user && favorites.length > 0 && (
                <div className="mb-6">
                     <h3 className="text-lg font-bold font-heading mb-3 border-b-2" style={{borderColor: 'var(--color-primary)'}}>My Favorites</h3>
                     <div className="space-y-4 text-sm">
                        {Object.entries(groupedFavorites).map(([civName, favs]) => (
                            <div key={civName}>
                                <h4 className="font-bold text-[var(--color-secondary)] mb-2">{civName}</h4>
                                <ul className="space-y-2 pl-2 border-l-2" style={{borderColor: 'var(--color-primary)'}}>
                                    {favs.map((fav) => (
                                        <li key={`${fav.type}-${fav.id}`}>
                                            <button 
                                                onClick={() => onFavoriteClick(fav)}
                                                className="w-full text-left text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200"
                                            >
                                                {fav.name}
                                                <span className="text-xs opacity-60 ml-2 capitalize">({fav.type})</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                     </div>
                </div>
            )}
        </aside>
    );
};
