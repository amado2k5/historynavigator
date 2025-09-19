
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { fetchEventDetails, generateImage } from '../services/geminiService.ts';
import type { TimelineEvent, Character } from '../types.ts';
import { PlayIcon, PauseIcon } from './Icons.tsx';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: TimelineEvent;
    character: Character | null;
    language: string;
    civilizationName: string;
    isKidsMode: boolean;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event, character, language, civilizationName, isKidsMode }) => {
    const [details, setDetails] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isNarrating, setIsNarrating] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const cleanup = () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            setIsNarrating(false);
        };

        if (isOpen) {
            const loadDetails = async () => {
                setIsLoading(true);
                setIsImageLoading(true);
                setError(null);
                setDetails('');
                setImageUrl(null);
                try {
                    const detailedTextPromise = fetchEventDetails(event, character, civilizationName, language, isKidsMode);

                    const imagePrompt = isKidsMode
                        ? `A vibrant and friendly cartoon illustration of the historical event: "${event.title}" from the ${civilizationName} civilization. Style: children's storybook.`
                        : `A photorealistic and cinematic scene visualizing the historical event: "${event.title}" from the ${civilizationName} civilization. Style: detailed, atmospheric.`;
                    const imageUrlPromise = generateImage(imagePrompt, '16:9');

                    const [detailedText, url] = await Promise.all([detailedTextPromise, imageUrlPromise]);

                    setDetails(detailedText);
                    setImageUrl(url);

                    // Setup narration
                    const utterance = new SpeechSynthesisUtterance(detailedText);
                    utterance.onend = () => setIsNarrating(false);
                    utterance.onerror = (e) => {
                        console.error("Speech synthesis error", e);
                        setIsNarrating(false);
                    };
                    utteranceRef.current = utterance;

                } catch (e) {
                    console.error("Failed to fetch event details or image:", e);
                    setError("Could not load the event details. Please try again.");
                } finally {
                    setIsLoading(false);
                    setIsImageLoading(false);
                }
            };
            loadDetails();
        }

        return cleanup;
    }, [isOpen, event, character, civilizationName, language, isKidsMode]);

    const handleToggleNarration = () => {
        if (!utteranceRef.current) return;

        if (isNarrating) {
            window.speechSynthesis.cancel();
            setIsNarrating(false);
        } else {
            window.speechSynthesis.speak(utteranceRef.current);
            setIsNarrating(true);
        }
    };

    const perspective = character ? `${character.name}'s Perspective` : 'Historical Overview';

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>{event.title}</h2>
                    <p className="text-md text-[var(--color-secondary)] mt-1">{perspective}</p>
                </div>
                <button
                    onClick={handleToggleNarration}
                    disabled={isLoading || !details}
                    className="p-2 rounded-full hover:bg-[var(--color-background-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 ml-4"
                    aria-label={isNarrating ? 'Stop narration' : 'Play narration'}
                >
                    {isNarrating
                        ? <PauseIcon className="w-6 h-6 text-[var(--color-accent)]" />
                        : <PlayIcon className="w-6 h-6 text-[var(--color-secondary)]" />
                    }
                </button>
            </div>

             <div className="w-full aspect-video bg-[var(--color-background-light)] rounded-md my-4 flex items-center justify-center overflow-hidden">
                {isImageLoading && <LoadingSpinner />}
                {!isImageLoading && imageUrl && <img src={imageUrl} alt={`Depiction of ${event.title}`} className="w-full h-full object-cover" />}
                {!isImageLoading && !imageUrl && !error && <div className="text-center text-[var(--color-secondary)]">Image could not be generated.</div>}
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
