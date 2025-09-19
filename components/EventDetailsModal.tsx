

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
// FIX: Added .ts extension to the import path.
import { fetchEventDetails } from '../services/geminiService.ts';
// FIX: Added .ts extension to the import path.
import type { TimelineEvent, Character } from '../types.ts';

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

    useEffect(() => {
        if (isOpen) {
            const loadDetails = async () => {
                setIsLoading(true);
                setError(null);
                setDetails('');
                try {
                    const detailedText = await fetchEventDetails(event, character, civilizationName, language, isKidsMode);
                    setDetails(detailedText);
                } catch (e) {
                    console.error("Failed to fetch event details:", e);
                    setError("Could not load the event details. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            };
            loadDetails();
        }
    }, [isOpen, event, character, civilizationName, language, isKidsMode]);

    const perspective = character ? `${character.name}'s Perspective` : 'Historical Overview';

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <h2 className="text-2xl font-bold font-heading mb-1" style={{color: 'var(--color-accent)'}}>{event.title}</h2>
            <p className="text-md text-[var(--color-secondary)] mb-4">{perspective}</p>

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
