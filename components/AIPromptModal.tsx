
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { LightbulbIcon } from './Icons.tsx';
import { fetchAIHistorianResponse, generateImage } from '../services/geminiService.ts';
import type { TimelineEvent, Share } from '../types.ts';
import { ShareButton } from './ShareButton.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface AIPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: TimelineEvent;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
    initialPrompt?: string;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, onClose, event, civilizationName, language, isKidsMode, initialPrompt = '', logShare, track }) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const { t, language: langCode } = useI18n();

    const handleSubmit = async (e: React.FormEvent | null) => {
        e?.preventDefault();
        if (!prompt) return;

        track('ask_ai_historian', { prompt });
        setIsLoading(true);
        setIsImageLoading(true);
        setError(null);
        setResponse('');
        setImageUrl(null);

        try {
            const textPromise = fetchAIHistorianResponse(prompt, event, civilizationName, language, isKidsMode);

            const imageStyle = isKidsMode ? "Style: friendly, colorful cartoon." : "Style: professional, high-resolution, photorealistic.";
            const imagePrompt = `An image visualizing the concept of: "${prompt}". Context: ${civilizationName}, during the time of ${event.title}. ${imageStyle}`;
            const imagePromise = generateImage(imagePrompt, '4:3');

            const [textResponse, generatedImageUrl] = await Promise.all([textPromise, imagePromise]);

            setResponse(textResponse);
            setIsLoading(false); // Text is ready

            setImageUrl(generatedImageUrl);
            setIsImageLoading(false); // Image is ready

        } catch (err) {
            setError(t('modals.aiError'));
            console.error(err);
            setIsLoading(false);
            setIsImageLoading(false);
        }
    };

    const generateShareUrl = () => {
        if (!prompt) return '';
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: event.id,
            view: '2D',
            modal: 'aiPrompt',
            id: event.id,
            prompt: prompt,
            lang: langCode,
            kids: String(isKidsMode),
        });
        return `${window.location.origin}${window.location.pathname}#/share?${params.toString()}`;
    };
    
    // Auto-submit if an initial prompt is provided from a shared link
    useEffect(() => {
        if (isOpen && initialPrompt) {
            handleSubmit(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialPrompt]);
    
    // Reset state when modal closes
    const handleClose = () => {
        setPrompt('');
        setResponse('');
        setImageUrl(null);
        setError(null);
        setIsLoading(false);
        setIsImageLoading(false);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[var(--color-primary)]">
                        <LightbulbIcon className="h-6 w-6 text-[var(--color-accent)]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>{t('modals.aiPromptTitle')}</h2>
                        <p className="text-[var(--color-secondary)]">{t('modals.aiPromptSubtext', { eventName: event.title })}</p>
                    </div>
                </div>
                {response && (
                    <ShareButton
                        shareUrl={generateShareUrl()}
                        shareTitle={`AI Historian: A question about ${event.title}`}
                        shareText={`I asked the AI Historian about "${prompt}" in the context of ${event.title}. See the answer for yourself!`}
                        onShareClick={() => track('share_content', { type: 'aiPrompt', prompt })}
                        onLogShare={({ url, title, text }) => logShare({ url, title, text })}
                    />
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <textarea
                    className="w-full h-24 p-2 bg-[var(--color-background-light)] border border-[var(--color-primary)] rounded-md focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('modals.aiPromptPlaceholder')}
                    aria-label="Your question for the AI Historian"
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt}
                    className="mt-4 w-full bg-[var(--color-accent)] text-black font-bold py-2 px-4 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? t('modals.thinking') : t('modals.ask')}
                </button>
            </form>

            <div className="mt-6">
                {(isLoading || isImageLoading) && (
                    <div className="flex justify-center items-center py-8 flex-col gap-4">
                        <LoadingSpinner />
                        <span className="text-[var(--color-secondary)]">
                            {isLoading ? t('modals.consultingArchives') : t('modals.paintingDiscovery')}
                        </span>
                    </div>
                )}
                {error && <p className="text-red-400 text-center">{error}</p>}
                
                {!isLoading && response && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="w-full aspect-[4/3] bg-[var(--color-background-light)] rounded-md flex items-center justify-center overflow-hidden">
                            {!isImageLoading && imageUrl ? (
                                <img src={imageUrl} alt={`Artistic representation of: ${prompt}`} className="w-full h-full object-cover" />
                            ) : (
                                // Placeholder while image loads after text is ready
                                <div className="flex items-center justify-center flex-col gap-2">
                                    <LoadingSpinner />
                                    <span className="text-sm text-[var(--color-secondary)]">{t('mainContent.generatingVista')}</span>
                                </div>
                            )}
                        </div>
                        <div className="prose prose-invert max-w-none text-[var(--color-secondary)] leading-relaxed whitespace-pre-wrap p-4 bg-[var(--color-background-light)] rounded-md">
                            <p>{response}</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};