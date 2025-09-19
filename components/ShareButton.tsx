
import React, { useState } from 'react';
import { ShareIcon } from './Icons.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface ShareButtonProps {
    shareUrl: string;
    shareTitle: string;
    shareText: string;
    onShareClick?: () => void;
    onLogShare: (shareDetails: { url: string, title: string, text: string }) => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ shareUrl, shareTitle, shareText, onShareClick, onLogShare }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useI18n();

    const handleShare = async () => {
        if (onShareClick) {
            onShareClick();
        }
        
        onLogShare({ url: shareUrl, title: shareTitle, text: shareText });

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback to copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }
    };

    return (
        <div className="relative group">
            <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-[var(--color-background-light)] text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors"
                aria-label={t('tooltips.share')}
            >
                <ShareIcon className="w-6 h-6" />
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-[var(--color-background)] text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {copied ? t('tooltips.linkCopied') : t('tooltips.share')}
            </div>
        </div>
    );
};
