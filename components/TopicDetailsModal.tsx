

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
// FIX: Added .ts extension to the import path.
import { fetchTopicDetails } from '../services/geminiService.ts';

interface TopicDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    topicName: string;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
}

export const TopicDetailsModal: React.FC<TopicDetailsModalProps> = ({ isOpen, onClose, topicName, civilizationName, language, isKidsMode }) => {
    const [details, setDetails] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const loadDetails = async () => {
                setIsLoading(true);
                setError(null);
                setDetails('');
                try {
                    const detailedText = await fetchTopicDetails(topicName, civilizationName, language, isKidsMode);
                    setDetails(detailedText);
                } catch (e) {
                    console.error("Failed to fetch topic details:", e);
                    setError("Could not load the topic details. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            };
            loadDetails();
        }
    }, [isOpen, topicName, civilizationName, language, isKidsMode]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <h2 className="text-2xl font-bold font-heading mb-4" style={{color: 'var(--color-accent)'}}>{topicName}</h2>

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
