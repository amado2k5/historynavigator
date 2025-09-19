
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { fetchCharacterDetails, generateImage } from '../services/geminiService.ts';
import { PlayIcon, PauseIcon } from './Icons.tsx';

interface CharacterDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterName: string;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
}

export const CharacterDetailsModal: React.FC<CharacterDetailsModalProps> = ({ isOpen, onClose, characterName, civilizationName, language, isKidsMode }) => {
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
                    const detailedTextPromise = fetchCharacterDetails(characterName, civilizationName, language, isKidsMode);
                    
                    const imagePrompt = isKidsMode
                        ? `A friendly, colorful cartoon portrait of ${characterName} from ${civilizationName}. Style: storybook illustration.`
                        : `A realistic, historically-inspired portrait of ${characterName} from the ${civilizationName} civilization, reflecting their era and role. Style: cinematic, detailed painting.`;
                    const imageUrlPromise = generateImage(imagePrompt, '4:3');

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
        if (!utteranceRef.current) return;

        if (isNarrating) {
            window.speechSynthesis.cancel();
            setIsNarrating(false);
        } else {
            window.speechSynthesis.speak(utteranceRef.current);
            setIsNarrating(true);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
             <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>{characterName}</h2>
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
