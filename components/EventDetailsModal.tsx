

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { fetchEventDetails, generateImage, fetchVoiceDescription } from '../services/geminiService.ts';
import { speak, cancelSpeech } from '../services/voiceService.ts';
import type { TimelineEvent, Character, VoiceDescription, Share } from '../types.ts';
import { PlayIcon, PauseIcon } from './Icons.tsx';
import { ShareButton } from './ShareButton.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: TimelineEvent;
    character: Character | null;
    language: string;
    civilizationName: string;
    isKidsMode: boolean;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event, character, language, civilizationName, isKidsMode, logShare, track }) => {
    const [details, setDetails] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isNarrating, setIsNarrating] = useState(false);
    const [voiceDescription, setVoiceDescription] = useState<VoiceDescription | null>(null);
    const { t, language: langCode } = useI18n();

    const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: event.id,
            view: '2D',
            modal: 'eventDetails',
            id: event.id,
            lang: langCode,
            kids: String(isKidsMode),
        });
        return `${window.location.origin}${window.location.pathname}#/share?${params.toString()}`;
    };

    useEffect(() => {
        const cleanup = () => {
            cancelSpeech();
            setIsNarrating(false);
        };

        if (isOpen) {
            const loadDetails = async () => {
                setIsLoading(true);
                setIsImageLoading(true);
                setError(null);
                setDetails('');
                setImageUrl(null);
                setVoiceDescription(null);
                try {
                    const detailedTextPromise = fetchEventDetails(event, character, civilizationName, language, isKidsMode);

                    const imagePrompt = isKidsMode
                        ? `A vibrant and friendly cartoon illustration of the historical event: "${event.title}" from the ${civilizationName} civilization. Style: children's storybook.`
                        : `A photorealistic and cinematic scene visualizing the historical event: "${event.title}" from the ${civilizationName} civilization. Style: detailed, atmospheric.`;
                    const imageUrlPromise = generateImage(imagePrompt, '16:9');

                    const voiceContext = character 
                        ? `${character.name} narrating the event "${event.title}" in ${civilizationName}.`
                        : `A historical narrator describing the event "${event.title}" in ${civilizationName}.`;
                    const voiceDescPromise = fetchVoiceDescription(voiceContext, language, isKidsMode);

                    const [detailedText, url, voiceDesc] = await Promise.all([detailedTextPromise, imageUrlPromise, voiceDescPromise]);

                    setDetails(detailedText);
                    setImageUrl(url);
                    setVoiceDescription(voiceDesc);

                } catch (e) {
                    console.error("Failed to fetch event details or image:", e);
                    setError(t('modals.error'));
                } finally {
                    setIsLoading(false);
                    setIsImageLoading(false);
                }
            };
            loadDetails();
        }

        return cleanup;
    }, [isOpen, event, character, civilizationName, language, isKidsMode, t]);

    const handleToggleNarration = () => {
        if (!details || !voiceDescription) return;

        if (isNarrating) {
            track('narration_stopped', { source: 'eventDetails', character: character?.name || 'narrator' });
            cancelSpeech();
            setIsNarrating(false);
        } else {
            track('narration_started', { source: 'eventDetails', character: character?.name || 'narrator' });
            speak(details, voiceDescription, {
                onend: () => setIsNarrating(false),
                onerror: (e) => {
                    console.error("Speech synthesis error", e);
                    setIsNarrating(false);
                }
            });
            setIsNarrating(true);
        }
    };

    const perspective = character ? t('modals.perspective', { characterName: character.name }) : t('modals.historicalOverview');

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="flex justify-between items-start mb-2">
                <div className='flex-grow'>
                    <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>{event.title}</h2>
                    <p className="text-md text-[var(--color-secondary)] mt-1">{perspective}</p>
                </div>
                <div className="flex items-center flex-shrink-0 ml-4">
                    <ShareButton 
                        shareUrl={generateShareUrl()}
                        shareTitle={`TimelineThis: ${event.title}`}
                        shareText={`Check out this event from the history of ${civilizationName}: ${event.title}`}
                        onShareClick={() => track('share_content', { type: 'eventDetails', id: event.id })}
                        onLogShare={({ url, title, text }) => logShare({ url, title, text })}
                    />
                    <button
                        onClick={handleToggleNarration}
                        disabled={isLoading || !details}
                        className="p-2 rounded-full hover:bg-[var(--color-background-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label={isNarrating ? t('modals.stopNarration') : t('modals.playNarration')}
                    >
                        {isNarrating
                            ? <PauseIcon className="w-6 h-6 text-[var(--color-accent)]" />
                            : <PlayIcon className="w-6 h-6 text-[var(--color-secondary)]" />
                        }
                    </button>
                </div>
            </div>

             <div className="w-full aspect-video bg-[var(--color-background-light)] rounded-md my-4 flex items-center justify-center overflow-hidden">
                {isImageLoading && <LoadingSpinner />}
                {!isImageLoading && imageUrl && <img src={imageUrl} alt={`Depiction of ${event.title}`} className="w-full h-full object-cover" />}
                {!isImageLoading && !imageUrl && !error && <div className="text-center text-[var(--color-secondary)]">{t('modals.imageError')}</div>}
            </div>

            {isLoading && (
                <div className="flex justify-center items-center h-48">
                    <LoadingSpinner />
                </div>
            )}
            {error && <p className="text-red-400 text-center py-10">{error}</p>}
            {!isLoading && details && (
                <div className="prose prose-invert max-w-none text-[var(--color-secondary)] leading-relaxed whitespace-pre-wrap">
                    <p>{details}</p>
                </div>
            )}
        </Modal>
    );
};
