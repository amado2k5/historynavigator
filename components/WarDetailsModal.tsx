import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
// FIX: Added generateImage import.
import { fetchWarDetails, generateImage } from '../services/geminiService.ts';

interface WarDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    warName: string;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
}

export const WarDetailsModal: React.FC<WarDetailsModalProps> = ({ isOpen, onClose, warName, civilizationName, language, isKidsMode }) => {
    const [details, setDetails] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const loadDetails = async () => {
                setIsLoading(true);
                setIsImageLoading(true);
                setError(null);
                setDetails('');
                setImageUrl(null);
                try {
                    const detailedTextPromise = fetchWarDetails(warName, civilizationName, language, isKidsMode);
                    
                    const imagePrompt = isKidsMode
                        ? `A simple, non-graphic cartoon illustration representing the war: ${warName} from ${civilizationName}. Style: children's history book.`
                        : `A dramatic and atmospheric painting depicting a key scene from the ${warName} of the ${civilizationName} civilization. Style: epic, historical art.`;
                    const imageUrlPromise = generateImage(imagePrompt, '16:9');

                    const [detailedText, url] = await Promise.all([detailedTextPromise, imageUrlPromise]);

                    setDetails(detailedText);
                    setImageUrl(url);

                } catch (e) {
                    console.error("Failed to fetch war details or image:", e);
                    setError("Could not load the war details. Please try again.");
                } finally {
                    setIsLoading(false);
                    setIsImageLoading(false);
                }
            };
            loadDetails();
        }
    }, [isOpen, warName, civilizationName, language, isKidsMode]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <h2 className="text-2xl font-bold font-heading mb-4" style={{color: 'var(--color-accent)'}}>{warName}</h2>

            <div className="w-full aspect-video bg-[var(--color-background-light)] rounded-md mb-4 flex items-center justify-center overflow-hidden">
                {isImageLoading && <LoadingSpinner />}
                {!isImageLoading && imageUrl && <img src={imageUrl} alt={`Depiction of ${warName}`} className="w-full h-full object-cover" />}
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
