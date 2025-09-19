import React from 'react';
import type { Civilization, Character, War, Topic, User, Favorite, TimelineEvent } from '../types.ts';
import { FavoriteIcon } from './FavoriteIcon.tsx';
import { YoutubeIcon, WikipediaIcon, QuoraIcon } from './Icons.tsx';

interface RightSidebarProps {
    civilization: Civilization;
    currentEvent: TimelineEvent | null;
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
    civilization, currentEvent, onCharacterClick, onWarClick, onTopicClick, user, favorites, isFavorited, toggleFavorite, onFavoriteClick
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

    const renderRelatedLinks = () => {
        if (!currentEvent) return null;

        const query = encodeURIComponent(`${civilization.name} ${currentEvent.title}`);
        const links = [
            { name: 'YouTube', url: `https://www.youtube.com/results?search_query=${query}`, icon: YoutubeIcon },
            { name: 'Wikipedia', url: `https://en.wikipedia.org/wiki/Special:Search?search=${query}`, icon: WikipediaIcon },
            { name: 'Quora', url: `https://www.quora.com/search?q=${query}`, icon: QuoraIcon },
        ];

        return (
            <div className="mt-6 pt-6 border-t-2" style={{borderColor: 'var(--color-primary)'}}>
                <h3 className="text-lg font-bold font-heading mb-3">Related Links</h3>
                <ul className="space-y-2 text-sm">
                    {links.map(link => (
                        <li key={link.name}>
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200 py-1 group"
                            >
                                <link.icon className="w-5 h-5 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors" />
                                <span>Explore on {link.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <aside className="w-72 bg-black bg-opacity-20 backdrop-blur-sm p-4 z-30 shadow-left overflow-y-auto flex-shrink-0 animate-fade-in">
            <h2 className="text-xl font-bold font-heading mb-4" style={{ color: 'var(--color-accent)' }}>
                {civilization.name}
            </h2>
            <p className="text-sm text-[var(--color-secondary)] mb-6 leading-relaxed">
                {civilization.summary}
            </p>
            
            {renderSection('Key Characters', civilization.keyCharacters, onCharacterClick, 'character')}
            {renderSection('Major Wars', civilization.majorWars, onWarClick, 'war')}
            {renderSection('Cultural Topics', civilization.culturalTopics, onTopicClick, 'topic')}
            
            {civilization.sources && civilization.sources.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-bold font-heading mb-3 border-b-2" style={{borderColor: 'var(--color-primary)'}}>Sources</h3>
                    <ul className="space-y-2 text-sm">
                        {civilization.sources.map((source, index) => (
                            source.web?.uri && (
                                <li key={index} className="leading-tight">
                                    <a
                                        href={source.web.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={source.web.uri}
                                        className="text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200 break-words"
                                    >
                                    {source.web.title || source.web.uri}
                                    </a>
                                </li>
                            )
                        ))}
                    </ul>
                </div>
            )}

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
            
            {renderRelatedLinks()}
        </aside>
    );
};