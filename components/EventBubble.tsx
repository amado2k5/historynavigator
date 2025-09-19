import React, { useState } from 'react';
import type { TimelineEvent, User, Share } from '../types.ts';
import { BookOpenIcon, MapIcon, LightbulbIcon } from './Icons.tsx';
import { FavoriteIcon } from './FavoriteIcon.tsx';
import { ShareButton } from './ShareButton.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';
import { generateMapData } from '../services/geminiService.ts';

interface EventBubbleProps {
    event: TimelineEvent;
    language: string;
    civilizationName: string;
    isKidsMode: boolean;
    user: User | null;
    isFavorited: boolean;
    toggleFavorite: () => void;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
    onOpenModal: (type: 'eventDetails' | 'aiPrompt') => void;
}

export const EventBubble: React.FC<EventBubbleProps> = ({ event, language, civilizationName, isKidsMode, user, isFavorited, toggleFavorite, logShare, track, onOpenModal }) => {
    const { t, language: langCode } = useI18n();
    const [isMapLoading, setIsMapLoading] = useState(false);

    const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: event.id,
            view: '2D',
            modal: 'none',
            id: event.id,
            lang: langCode,
            kids: String(isKidsMode),
        });
        return `${window.location.origin}${window.location.pathname}#/share?${params.toString()}`;
    };
    
    const handleMapClick = async () => {
        setIsMapLoading(true);
        track('view_on_map_clicked', { eventId: event.id });
        try {
            const mapData = await generateMapData(event, civilizationName, language, isKidsMode);
            if (mapData && mapData.centerCoordinates) {
                const { lat, lng } = mapData.centerCoordinates;
                const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            } else {
                console.error("No map coordinates found for this event.");
            }
        } catch (error) {
            console.error("Failed to generate map link:", error);
        } finally {
            setIsMapLoading(false);
        }
    };

    return (
        <>
            <div className="relative group w-full max-w-3xl text-center bg-black bg-opacity-50 backdrop-blur-sm p-6 md:p-8 rounded-xl border shadow-2xl transition-transform duration-300 transform hover:scale-105"
                 style={{borderColor: 'var(--color-primary)'}}>
                
                {user && (
                    <div className="absolute top-4 right-4 z-10 flex items-center">
                         <ShareButton
                            shareUrl={generateShareUrl()}
                            shareTitle={`TimelineThis: ${event.title}`}
                            shareText={`Explore the event "${event.title}" from the history of ${civilizationName}!`}
                            onShareClick={() => track('share_content', { type: 'eventBubble', id: event.id })}
                            onLogShare={({ url, title, text }) => logShare({ url, title, text })}
                        />
                        <FavoriteIcon isFavorited={isFavorited} onToggle={toggleFavorite} />
                    </div>
                )}

                <h2 className="text-3xl md:text-4xl font-bold font-heading mb-2" style={{color: 'var(--color-accent)'}}>{event.title}</h2>
                <p className="text-lg md:text-xl mb-4" style={{color: 'var(--color-secondary)'}}>{event.date}</p>
                <p className="text-base md:text-lg" style={{ color: 'var(--color-secondary)' }}>{event.summary}</p>

                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                    <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
                        <button onClick={() => onOpenModal('eventDetails')} className="flex flex-col items-center text-gray-200 hover:text-[var(--color-accent)] transition-colors p-2">
                            <BookOpenIcon className="w-10 h-10" />
                            <span className="mt-2 text-sm">{t('eventBubble.readDetails')}</span>
                        </button>
                        <button onClick={handleMapClick} disabled={isMapLoading} className="flex flex-col items-center text-gray-200 hover:text-[var(--color-accent)] transition-colors p-2 disabled:opacity-60 disabled:cursor-wait">
                            <MapIcon className="w-10 h-10" />
                            <span className="mt-2 text-sm">{isMapLoading ? t('eventBubble.loadingMap') : t('eventBubble.viewOnMap')}</span>
                        </button>
                        <button onClick={() => onOpenModal('aiPrompt')} className="flex flex-col items-center text-gray-200 hover:text-[var(--color-accent)] transition-colors p-2">
                            <LightbulbIcon className="w-10 h-10" />
                            <span className="mt-2 text-sm">{t('eventBubble.askAI')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};