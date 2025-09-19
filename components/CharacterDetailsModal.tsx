

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { fetchCharacterDetails, findImageOnWeb } from '../services/geminiService.ts';
import type { TimelineEvent, Share } from '../types.ts';
import { ShareButton } from './ShareButton.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface CharacterDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterName: string;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
    currentEvent: TimelineEvent;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const CharacterDetailsModal: React.FC<CharacterDetailsModalProps> = ({ isOpen, onClose, characterName, civilizationName, language, isKidsMode, currentEvent, logShare, track }) => {
    const [details, setDetails] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const { t, language: langCode } = useI18n();

    const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: currentEvent.id,
            view: '2D',
            modal: 'character',
            id: characterName,
            lang: langCode,
            kids: String(isKidsMode),
        });
        return `${window.location.origin}${window.location.pathname}#/share?${params.toString()}`;
    };

    useEffect(() => {
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
                        : `A realistic, historically-inspired portrait of ${characterName} from the ${civilizationName} civilization, reflecting their era and role. Style: cinematic, detailed, photorealistic stock photo.`;
                    const imageUrlPromise = findImageOnWeb(imagePrompt, '4:3');

                    const [detailedText, url] = await Promise.all([detailedTextPromise, imageUrlPromise]);

                    setDetails(detailedText);
                    setImageUrl(url);

                } catch (e) {
                    console.error("Failed to fetch character details or image:", e);
                    setError(t('modals.error'));
                } finally {
                    setIsLoading(false);
                    setIsImageLoading(false);
                }
            };
            loadDetails();
        }
    }, [isOpen, characterName, civilizationName, language, isKidsMode, t]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
             <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold font-heading flex-grow" style={{color: 'var(--color-accent)'}}>{characterName}</h2>
                 <div className="flex items-center flex-shrink-0 ml-4">
                    <ShareButton
                        shareUrl={generateShareUrl()}
                        shareTitle={`TimelineThis: ${characterName}`}
                        shareText={`Learn about ${characterName} from the history of ${civilizationName}!`}
                        onShareClick={() => track('share_content', { type: 'character', id: characterName })}
                        onLogShare={({ url, title, text }) => logShare({ url, title, text })}
                    />
                </div>
            </div>
            
            <div className="w-full aspect-[4/3] bg-[var(--color-background-light)] rounded-md mb-4 flex items-center justify-center overflow-hidden">
                {isImageLoading && <LoadingSpinner />}
                {!isImageLoading && imageUrl && <img src={imageUrl} alt={`Portrait of ${characterName}`} className="w-full h-full object-cover" />}
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
