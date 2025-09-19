
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { fetchCharacterDetails, generateImage, fetchVoiceDescription } from '../services/geminiService.ts';
import { speak, cancelSpeech } from '../services/voiceService.ts';
import type { VoiceDescription, TimelineEvent } from '../types.ts';
import { PlayIcon, PauseIcon } from './Icons.tsx';
import { ShareButton } from './ShareButton.tsx';

interface CharacterDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterName: string;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
    currentEvent: TimelineEvent;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const CharacterDetailsModal: React.FC<CharacterDetailsModalProps> = ({ isOpen, onClose, characterName, civilizationName, language, isKidsMode, currentEvent, track }) => {
    const [details, setDetails] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isNarrating, setIsNarrating] = useState(false);
    const [voiceDescription, setVoiceDescription] = useState<VoiceDescription | null>(null);

    const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: currentEvent.id,
            view: '2D',
            modal: 'character',
            id: characterName,
            lang: language,
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
                    const detailedTextPromise = fetchCharacterDetails(characterName, civilizationName, language, isKidsMode);
                    
                    const imagePrompt = isKidsMode
                        ? `A friendly, colorful cartoon portrait of ${characterName} from ${civilizationName}. Style: storybook illustration.`
                        : `A realistic, historically-inspired portrait of ${characterName} from the ${civilizationName} civilization, reflecting their era and role. Style: cinematic, detailed painting.`;
                    const imageUrlPromise = generateImage(imagePrompt, '4:3');

                    const voiceContext = `${characterName} from ${civilizationName}, telling their own story.`;
                    const voiceDescPromise = fetchVoiceDescription(voiceContext, language, isKidsMode);

                    const [detailedText, url, voiceDesc] = await Promise.all([detailedTextPromise, imageUrlPromise, voiceDescPromise]);

                    setDetails(detailedText);
                    setImageUrl(url);
                    setVoiceDescription(voiceDesc);

                } catch (e) {
                    console.error("Failed to fetch character details or image:", e);
                    setError("Could not load the character details. Please try again.");
                } finally {
                    setIsLoading(false);
                    setIsImageLoading(false);
                }
            };
            loadDetails();
        }

        return cleanup;
    }, [isOpen, characterName, civilizationName, language, isKidsMode]);

    const handleToggleNarration = () => {
        if (!details || !voiceDescription) return;

        if (isNarrating) {
            track('narration_stopped', { source: 'characterDetails', character: characterName });
            cancelSpeech();
            setIsNarrating(false);
        } else {
            track('narration_started', { source: 'characterDetails', character: characterName });
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
             <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold font-heading flex-grow" style={{color: 'var(--color-accent)'}}>{characterName}</h2>
                 <div className="flex items-center flex-shrink-0 ml-4">
                    <ShareButton
                        shareUrl={generateShareUrl()}
                        shareTitle={`History Navigator: ${characterName}`}
                        shareText={`Learn about ${characterName} from the history of ${civilizationName}!`}
                        onShareClick={() => track('share_content', { type: 'character', id: characterName })}
                    />
                    <button
                        onClick={handleToggleNarration}
                        disabled={isLoading || !details}
                        className="p-2 rounded-full hover:bg-[var(--color-background-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label={isNarrating ? 'Stop narration' : 'Play narration'}
                    >
                        {isNarrating
                            ? <PauseIcon className="w-6 h-6 text-[var(--color-accent)]" />
                            : <PlayIcon className="w-6 h-6 text-[var(--color-secondary)]" />
                        }
                    </button>
                </div>
            </div>
            
            <div className="w-full aspect-[4/3] bg-[var(--color-background-light)] rounded-md mb-4 flex items-center justify-center overflow-hidden">
                {isImageLoading && <LoadingSpinner />}
                {!isImageLoading && imageUrl && <img src={imageUrl} alt={`Portrait of ${characterName}`} className="w-full h-full object-cover" />}
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