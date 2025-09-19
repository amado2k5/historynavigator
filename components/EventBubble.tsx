
import React, { useState } from 'react';
import type { TimelineEvent, Character, User } from '../types.ts';
import { BookOpenIcon, MapIcon, LightbulbIcon } from './Icons.tsx';
import { EventDetailsModal } from './EventDetailsModal.tsx';
import { MapModal } from './MapModal.tsx';
import { FavoriteIcon } from './FavoriteIcon.tsx';
import { AIPromptModal } from './AIPromptModal.tsx';
import { ShareButton } from './ShareButton.tsx';

interface EventBubbleProps {
    event: TimelineEvent;
    character: Character | null;
    language: string;
    civilizationName: string;
    isKidsMode: boolean;
    user: User | null;
    isFavorited: boolean;
    toggleFavorite: () => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const EventBubble: React.FC<EventBubbleProps> = ({ event, character, language, civilizationName, isKidsMode, user, isFavorited, toggleFavorite, track }) => {
    const [isDetailsOpen, setDetailsOpen] = useState(false);
    const [isMapOpen, setMapOpen] = useState(false);
    const [isAIOpen, setAIOpen] = useState(false);
    
    const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: event.id,
            view: '2D',
            modal: 'none',
            id: event.id,
            lang: language,
            kids: String(isKidsMode),
        });
        return `${window.location.origin}${window.location.pathname}#/share?${params.toString()}`;
    };

    return (
        <>
            <div className="relative group w-full max-w-3xl text-center bg-black bg-opacity-50 backdrop-blur-sm p-8 rounded-xl border shadow-2xl transition-transform duration-300 transform hover:scale-105"
                 style={{borderColor: 'var(--color-primary)'}}>
                
                {user && (
                    <div className="absolute top-4 right-4 z-10 flex items-center">
                         <ShareButton
                            shareUrl={generateShareUrl()}
                            shareTitle={`History Navigator: ${event.title}`}
                            shareText={`Explore the event "${event.title}" from the history of ${civilizationName}!`}
                            onShareClick={() => track('share_content', { type: 'eventBubble', id: event.id })}
                        />
                        <FavoriteIcon isFavorited={isFavorited} onToggle={toggleFavorite} />
                    </div>
                )}

                <h2 className="text-4xl font-bold font-heading mb-2" style={{color: 'var(--color-accent)'}}>{event.title}</h2>
                <p className="text-xl mb-4" style={{color: 'var(--color-secondary)'}}>{event.date}</p>
                <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>{event.summary}</p>

                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                    <div className="flex gap-6">
                        <button onClick={() => { track('open_modal', { type: 'eventDetails' }); setDetailsOpen(true); }} className="flex flex-col items-center text-gray-200 hover:text-[var(--color-accent)] transition-colors">
                            <BookOpenIcon className="w-10 h-10" />
                            <span className="mt-2 text-sm">Read Details</span>
                        </button>
                        <button onClick={() => { track('open_modal', { type: 'map' }); setMapOpen(true); }} className="flex flex-col items-center text-gray-200 hover:text-[var(--color-accent)] transition-colors">
                            <MapIcon className="w-10 h-10" />
                            <span className="mt-2 text-sm">View on Map</span>
                        </button>
                        <button onClick={() => { track('open_modal', { type: 'aiPrompt' }); setAIOpen(true); }} className="flex flex-col items-center text-gray-200 hover:text-[var(--color-accent)] transition-colors">
                            <LightbulbIcon className="w-10 h-10" />
                            <span className="mt-2 text-sm">Ask AI</span>
                        </button>
                    </div>
                </div>
            </div>

            {isDetailsOpen && <EventDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setDetailsOpen(false)}
                event={event}
                character={character}
                language={language}
                civilizationName={civilizationName}
                isKidsMode={isKidsMode}
                track={track}
            />}
            {isMapOpen && <MapModal
                isOpen={isMapOpen}
                onClose={() => setMapOpen(false)}
                event={event}
                civilizationName={civilizationName}
                language={language}
                isKidsMode={isKidsMode}
                track={track}
            />}
             {isAIOpen && <AIPromptModal
                isOpen={isAIOpen}
                onClose={() => setAIOpen(false)}
                event={event}
                civilizationName={civilizationName}
                language={language}
                isKidsMode={isKidsMode}
                track={track}
            />}
        </>
    );
};