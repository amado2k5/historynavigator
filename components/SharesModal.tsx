
import React, { useState } from 'react';
import { Modal } from './Modal.tsx';
import type { Share } from '../types.ts';
import { ShareIcon } from './Icons.tsx';

interface SharesModalProps {
    isOpen: boolean;
    onClose: () => void;
    shares: Share[];
}

export const SharesModal: React.FC<SharesModalProps> = ({ isOpen, onClose, shares }) => {
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="flex items-center gap-4 mb-4">
                <ShareIcon className="w-8 h-8 text-[var(--color-secondary)]" />
                <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>My Share History</h2>
            </div>
            {shares.length === 0 ? (
                <p className="text-center text-[var(--color-secondary)] py-8">You haven't shared anything yet. Use the share icon on any content to generate a link.</p>
            ) : (
                <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {shares.map((share, index) => (
                        <li key={index} className="p-3 bg-[var(--color-background-light)] rounded-lg flex items-center justify-between gap-4">
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold text-[var(--color-foreground)] truncate" title={share.title}>{share.title}</p>
                                <p className="text-xs text-[var(--color-secondary)] mt-1">
                                    Shared on {new Date(share.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => handleCopy(share.url)}
                                className="flex-shrink-0 bg-[var(--color-primary)] text-white text-sm font-bold py-2 px-4 rounded-md hover:opacity-90"
                            >
                                {copiedUrl === share.url ? 'Copied!' : 'Copy Link'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
};
