import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
// FIX: Added .ts extension to the import path.
import type { TimelineEvent, Character } from '../types.ts';
// FIX: Added .ts extension to the import path.
import { generateVideo } from '../services/geminiService.ts';
import { useI18n } from '../contexts/I18nContext.tsx';

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
    const { t } = useI18n();
    const [loadingMessage, setLoadingMessage] = useState(t('modals.conjuringVisions'));

    useEffect(() => {
        let isCancelled = false;
        let timeoutId: ReturnType<typeof setTimeout>;

        const messages = [
            t('modals.gatheringPigments'),
            t('modals.consultingCinematographers'),
            t('modals.weavingTime'),
            t('modals.patience'),
            t('modals.renderingLandscapes'),
            t('modals.animatingFigures'),
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
                setLoadingMessage(t('modals.conjuringVisions'));
                timeoutId = setTimeout(updateMessage, 5000);

                try {
                    // FIX: Pass civilizationName to generateVideo for better context.
                    const url = await generateVideo(event, character, civilizationName, language, isKidsMode);
                    if (!isCancelled) {
                        setVideoUrl(url);
                    }
                } catch (err) {
                    if (!isCancelled) {
                        setError(t('modals.videoError'));
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
    }, [isOpen, event, character, civilizationName, language, isKidsMode, t]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <h2 className="text-2xl font-bold font-heading mb-4" style={{color: 'var(--color-accent)'}}>{t('modals.visualizing', { eventName: event.title })}</h2>
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
