import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
// FIX: Added .ts extension to the import path.
import type { TimelineEvent, Character } from '../types.ts';
// FIX: Added .ts extension to the import path.
import { generateVideo } from '../services/geminiService.ts';

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: TimelineEvent;
    character: Character | null;
    language: string;
    isKidsMode: boolean;
    // FIX: Added civilizationName to props for video generation context.
    civilizationName: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, event, character, language, isKidsMode, civilizationName }) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("Conjuring visions of the past...");

    useEffect(() => {
        let isCancelled = false;
        let timeoutId: ReturnType<typeof setTimeout>;

        const messages = [
            "Gathering historical pigments...",
            "Consulting the celestial cinematographers...",
            "Weaving threads of time into film...",
            "This can take a minute or two, thank you for your patience!",
            "Rendering ancient landscapes...",
            "Animating historical figures...",
        ];
        
        const updateMessage = () => {
            if (isLoading && !isCancelled) {
                setLoadingMessage(messages[Math.floor(Math.random() * messages.length)]);
                timeoutId = setTimeout(updateMessage, 5000);
            }
        };

        if (isOpen) {
            const createVideo = async () => {
                setIsLoading(true);
                setError(null);
                setVideoUrl(null);
                setLoadingMessage("Conjuring visions of the past...");
                timeoutId = setTimeout(updateMessage, 5000);

                try {
                    // FIX: Pass civilizationName to generateVideo for better context.
                    const url = await generateVideo(event, character, civilizationName, language, isKidsMode);
                    if (!isCancelled) {
                        setVideoUrl(url);
                    }
                } catch (err) {
                    if (!isCancelled) {
                        setError('Failed to generate video. The archives may be sealed at the moment.');
                        console.error(err);
                    }
                } finally {
                    if (!isCancelled) {
                        setIsLoading(false);
                    }
                }
            };
            createVideo();
        }

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    // FIX: Added civilizationName to the dependency array.
    }, [isOpen, event, character, civilizationName, language, isKidsMode]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <h2 className="text-2xl font-bold font-heading mb-4" style={{color: 'var(--color-accent)'}}>Visualizing: {event.title}</h2>
            <div className="aspect-video w-full flex items-center justify-center bg-black rounded-lg">
                {isLoading && (
                    <div className="text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-lg text-[var(--color-secondary)]">{loadingMessage}</p>
                    </div>
                )}
                {error && <p className="text-red-400 p-8 text-center">{error}</p>}
                {!isLoading && videoUrl && (
                    <video src={videoUrl} controls autoPlay className="w-full h-full rounded-lg" />
                )}
            </div>
        </Modal>
    );
};
