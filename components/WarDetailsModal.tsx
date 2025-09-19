

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
// FIX: Added .ts extension to the import path.
import { fetchWarDetails } from '../services/geminiService.ts';

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

    useEffect(() => {
        if (isOpen) {
            const loadDetails = async () => {
                setIsLoading(true);
                setError(null);
                setDetails('');
                try {
                    const detailedText = await fetchWarDetails(warName, civilizationName, language, isKidsMode);
                    setDetails(detailedText);
                } catch (e) {
                    console.error("Failed to fetch war details:", e);
                    setError("Could not load the war details. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            };
            loadDetails();
        }
    }, [isOpen, warName, civilizationName, language, isKidsMode]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <h2 className="text-2xl font-bold font-heading mb-4" style={{color: 'var(--color-accent)'}}>{warName}</h2>
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
