
import React, { useState } from 'react';
import type { TimelineEvent, Character, User } from '../types.ts';
import { BookOpenIcon, MapIcon } from './Icons.tsx';
import { EventDetailsModal } from './EventDetailsModal.tsx';
import { MapModal } from './MapModal.tsx';
import { FavoriteIcon } from './FavoriteIcon.tsx';

interface EventBubbleProps {
    event: TimelineEvent;
    character: Character | null;
    language: string;
    civilizationName: string;
    isKidsMode: boolean;
    user: User | null;
    isFavorited: boolean;
    toggleFavorite: () => void;
}

export const EventBubble: React.FC<EventBubbleProps> = ({ event, character, language, civilizationName, isKidsMode, user, isFavorited, toggleFavorite }) => {
    const [isDetailsOpen, setDetailsOpen] = useState(false);
    const [isMapOpen, setMapOpen] = useState(false);

    return (
        <>
            <div className="relative group w-full max-w-3xl text-center bg-black bg-opacity-50 backdrop-blur-sm p-8 rounded-xl border shadow-2xl transition-transform duration-300 transform hover:scale-105"
                 style={{borderColor: 'var(--color-primary)'}}>
                
                {user && (
                    <div className="absolute top-4 right-4 z-10">
                        <FavoriteIcon isFavorited={isFavorited} onToggle={toggleFavorite} />
                    </div>
                )}

                <h2 className="text-4xl font-bold font-heading mb-2" style={{color: 'var(--color-accent)'}}>{event.title}</h2>
                <p className="text-xl mb-4" style={{color: 'var(--color-secondary)'}}>{event.date}</p>
                <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>{event.summary}</p>

                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                    <div className="flex gap-6">
                        <button onClick={() => setDetailsOpen(true)} className="flex flex-col items-center text-gray-200 hover:text-[var(--color-accent)] transition-colors">
                            <BookOpenIcon className="w-10 h-10" />
                            <span className="mt-2 text-sm">Read Details</span>
                        </button>
                        <button onClick={() => setMapOpen(true)} className="flex flex-col items-center text-gray-200 hover:text-[var(--color-accent)] transition-colors">
                            <MapIcon className="w-10 h-10" />
                            <span className="mt-2 text-sm">View on Map</span>
                        </button>
                    </div>
                </div>
            </div>

            <EventDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setDetailsOpen(false)}
                event={event}
                character={character}
                language={language}
                civilizationName={civilizationName}
                isKidsMode={isKidsMode}
            />
            <MapModal
                isOpen={isMapOpen}
                onClose={() => setMapOpen(false)}
                event={event}
                civilizationName={civilizationName}
                language={language}
                isKidsMode={isKidsMode}
            />
        </>
    );
};
