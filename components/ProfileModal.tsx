

import React from 'react';
import { Modal } from './Modal.tsx';
import type { User } from '../types.ts';
import { UserIcon, StarIcon, ShareIcon } from './Icons.tsx';
import { avatarMap } from './UserProfile.tsx';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    favoritesCount: number;
    sharesCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, favoritesCount, sharesCount }) => {
    const AvatarComponent = avatarMap[user.avatar] || UserIcon;
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 rounded-full bg-[var(--color-background-light)] flex items-center justify-center border-4 border-[var(--color-primary)]">
                    <AvatarComponent className="w-12 h-12 text-[var(--color-secondary)]" />
                </div>
                 <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>{user.name}</h2>
                 <p className="text-sm text-[var(--color-secondary)] mb-6">Signed in with {user.provider}</p>
                 
                 <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[var(--color-background-light)] rounded-lg">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                            <StarIcon className="w-6 h-6 text-[var(--color-accent)]" filled />
                            <p className="text-2xl font-bold">{favoritesCount}</p>
                        </div>
                        <p className="text-sm text-[var(--color-secondary)]">Favorites</p>
                    </div>
                     <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                            <ShareIcon className="w-6 h-6 text-[var(--color-secondary)]" />
                            <p className="text-2xl font-bold">{sharesCount}</p>
                        </div>
                        <p className="text-sm text-[var(--color-secondary)]">Shares</p>
                    </div>
                 </div>
            </div>
        </Modal>
    );
};