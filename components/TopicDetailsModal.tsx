
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
// FIX: Added generateImage import.
import { fetchTopicDetails, generateImage } from '../services/geminiService.ts';
import { ShareButton } from './ShareButton.tsx';
import type { TimelineEvent } from '../types.ts';

interface TopicDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    topicName: string;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
    currentEvent: TimelineEvent;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const TopicDetailsModal: React.FC<TopicDetailsModalProps> = ({ isOpen, onClose, topicName, civilizationName, language, isKidsMode, currentEvent, track }) => {
    const [details, setDetails] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);

    const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: currentEvent.id,
            view: '2D',
            modal: 'topic',
            id: topicName,
            lang: language,
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
                    const detailedTextPromise = fetchTopicDetails(topicName, civilizationName, language, isKidsMode);

                    const imagePrompt = isKidsMode
                        ? `A colorful and simple cartoon illustration about ${topicName} in ${civilizationName}. Style: educational, for kids.`
                        : `An evocative and symbolic image representing the cultural topic of ${topicName} within the ${civilizationName} civilization. Style: artistic, metaphorical.`;
                    const imageUrlPromise = generateImage(imagePrompt, '4:3');

                    const [detailedText, url] = await Promise.all([detailedTextPromise, imageUrlPromise]);
                    
                    setDetails(detailedText);
                    setImageUrl(url);
                } catch (e) {
                    console.error("Failed to fetch topic details or image:", e);
                    setError("Could not load the topic details. Please try again.");
                } finally {
                    setIsLoading(false);
                    setIsImageLoading(false);
                }
            };
            loadDetails();
        }
    }, [isOpen, topicName, civilizationName, language, isKidsMode]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>{topicName}</h2>
                 <ShareButton
                    shareUrl={generateShareUrl()}
                    shareTitle={`History Navigator: ${topicName}`}
                    shareText={`Learn about ${topicName} from the history of ${civilizationName}!`}
                    onShareClick={() => track('share_content', { type: 'topic', id: topicName })}
                />
            </div>

            <div className="w-full aspect-[4/3] bg-[var(--color-background-light)] rounded-md mb-4 flex items-center justify-center overflow-hidden">
                {isImageLoading && <LoadingSpinner />}
                {!isImageLoading && imageUrl && <img src={imageUrl} alt={`Representation of ${topicName}`} className="w-full h-full object-cover" />}
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