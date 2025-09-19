

import React from 'react';
import type { TimelineEvent, User, Favorite } from '../types.ts';
import { FavoriteIcon } from './FavoriteIcon.tsx';

interface TimelineProps {
    events: TimelineEvent[];
    currentEvent: TimelineEvent | null;
    onEventSelect: (event: TimelineEvent) => void;
    user: User | null;
    isFavorited: (type: Favorite['type'], id: string) => boolean;
    toggleFavorite: (favorite: Omit<Favorite, 'civilizationName'>) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ events, currentEvent, onEventSelect, user, isFavorited, toggleFavorite }) => {
    return (
        <div className="w-full bg-black bg-opacity-40 backdrop-blur-sm p-4 z-30 shadow-top overflow-hidden">
            <div className="overflow-x-auto pb-2 -mb-2">
                <div className="relative h-16 flex items-center min-w-[600px] px-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5" style={{backgroundColor: 'var(--color-primary)'}}></div>
                    <div className="w-full flex justify-between items-center">
                        {events.map((event, index) => {
                            const isCurrent = currentEvent?.id === event.id;
                            return (
                                <div key={event.id} className="relative flex flex-col items-center group">
                                    <button
                                        onClick={() => onEventSelect(event)}
                                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 flex-shrink-0 ${isCurrent ? 'w-6 h-6' : ''}`}
                                        style={{
                                            backgroundColor: isCurrent ? 'var(--color-accent)' : 'var(--color-background)',
                                            borderColor: isCurrent ? 'var(--color-accent)' : 'var(--color-primary)'
                                        }}
                                        aria-label={`Select event: ${event.title}`}
                                    />
                                    <div className={`absolute bottom-full mb-3 w-52 text-center p-2 rounded-md bg-[var(--color-background-light)] border border-[var(--color-primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isCurrent ? '!opacity-100' : ''}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-grow">
                                                <p className="font-bold text-sm" style={{color: 'var(--color-accent)'}}>{event.date}</p>
                                                <p className="text-xs" style={{color: 'var(--color-foreground)'}}>{event.title}</p>
                                            </div>
                                            {user && (
                                                <div className="pointer-events-auto flex-shrink-0">
                                                    <FavoriteIcon 
                                                        isFavorited={isFavorited('event', event.id)}
                                                        onToggle={() => toggleFavorite({ type: 'event', id: event.id, name: event.title })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};