
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { generateAudioScript, generateImage, fetchVoiceDescription } from '../services/geminiService.ts';
import { speak, cancelSpeech } from '../services/voiceService.ts';
import type { TimelineEvent, Character, VoiceDescription, Share } from '../types.ts';
import { PlayIcon, PauseIcon } from './Icons.tsx';
import { ShareButton } from './ShareButton.tsx';

interface AudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: TimelineEvent;
    character: Character | null;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const AudioModal: React.FC<AudioModalProps> = ({ isOpen, onClose, event, character, civilizationName, language, isKidsMode, logShare, track }) => {
    const [script, setScript] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isNarrating, setIsNarrating] = useState(false);
    const [voiceDescription, setVoiceDescription] = useState<VoiceDescription | null>(null);

    const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: event.id,
            view: '2D',
            modal: 'audio',
            id: event.id,
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
            const loadAudioExperience = async () => {
                setIsLoading(true);
                setIsImageLoading(true);
                setError(null);
                setScript('');
                setImageUrl(null);
                setVoiceDescription(null);
                try {
                    // Generate script first
                    const audioScript = await generateAudioScript(event, character, civilizationName, language, isKidsMode);
                    setScript(audioScript);
                    setIsLoading(false);

                    // Now generate image and voice description in parallel
                    const imagePrompt = isKidsMode
                        ? `A vibrant and friendly cartoon illustration of the historical event: "${event.title}" from the ${civilizationName} civilization, as a backdrop for an audio story. Style: children's storybook.`
                        : `A photorealistic and atmospheric scene visualizing the historical event: "${event.title}" from the ${civilizationName} civilization, to accompany an audio narration. Style: detailed, cinematic.`;
                    const imageUrlPromise = generateImage(imagePrompt, '16:9');

                    const voiceContext = character
                        ? `${character.name} narrating a story about "${event.title}".`
                        : `A historical narrator telling a story about the event "${event.title}" in ${civilizationName}.`;
                    const voiceDescPromise = fetchVoiceDescription(voiceContext, language, isKidsMode);

                    const [url, voiceDesc] = await Promise.all([imageUrlPromise, voiceDescPromise]);

                    setImageUrl(url);
                    setVoiceDescription(voiceDesc);

                } catch (e) {
                    console.error("Failed to fetch audio experience:", e);
                    setError("Could not create the audio experience. Please try again.");
                    setIsLoading(false);
                } finally {
                    setIsImageLoading(false);
                }
            };
            loadAudioExperience();
        }

        return cleanup;
    }, [isOpen, event, character, civilizationName, language, isKidsMode]);

    const handleToggleNarration = () => {
        if (!script || !voiceDescription) return;

        if (isNarrating) {
            track('narration_stopped', { source: 'audioModal', character: character?.name || 'narrator' });
            cancelSpeech();
            setIsNarrating(false);
        } else {
            track('narration_started', { source: 'audioModal', character: character?.name || 'narrator' });
            speak(script, voiceDescription, {
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
            <div className="flex justify-between items-start mb-2">
                <div className='flex-grow'>
                    <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>Audio Experience: {event.title}</h2>
                    <p className="text-md text-[var(--color-secondary)] mt-1">Listen to a story about this event.</p>
                </div>
                <div className="flex items-center flex-shrink-0 ml-4">
                    {script && <ShareButton
                        shareUrl={generateShareUrl()}
                        shareTitle={`Audio Experience: ${event.title}`}
                        shareText={`Listen to an audio story about "${event.title}" from the history of ${civilizationName}!`}
                        onShareClick={() => track('share_content', { type: 'audio', id: event.id })}
                        onLogShare={({ url, title, text }) => logShare({ url, title, text })}
                    />}
                    <button
                        onClick={handleToggleNarration}
                        disabled={isLoading || !script || !voiceDescription}
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
            {!isLoading && script && (
                <div className="prose prose-invert max-w-none text-[var(--color-secondary)] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto p-2">
                    <p>{script}</p>
                </div>
            )}
        </Modal>
    );
};