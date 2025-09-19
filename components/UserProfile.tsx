import React from 'react';
import type { User } from '../types.ts';
import { UserIcon, GoogleIcon, AppleIcon, XIcon, FacebookIcon, StarIcon, ShareIcon } from './Icons.tsx';

interface UserProfileProps {
    user: User;
    onLogout: () => void;
    onProfileClick: () => void;
    onFavoritesClick: () => void;
    onSharesClick: () => void;
}

export const avatarMap: Record<string, React.FC<{className?: string}>> = {
    google: GoogleIcon,
    apple: AppleIcon,
    x: XIcon,
    facebook: FacebookIcon,
};


export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onProfileClick, onFavoritesClick, onSharesClick }) => {
    const AvatarComponent = avatarMap[user.avatar] || UserIcon;

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[var(--color-background-light)] flex items-center justify-center border-2 border-[var(--color-primary)]">
                   <AvatarComponent className="w-5 h-5 text-[var(--color-secondary)]" />
                </div>
                <span className="hidden md:block text-sm font-medium">{user.name}</span>
            </button>
            <div className="absolute right-0 top-full w-48 z-20 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300">
                 <div className="bg-[var(--color-background-light)] rounded-md shadow-lg border border-[var(--color-primary)] animate-fade-in">
                    <ul className="py-1">
                        <li>
                            <button onClick={onProfileClick} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)]">
                                <UserIcon className="w-5 h-5" />
                                Profile
                            </button>
                        </li>
                        <li>
                            <button onClick={onFavoritesClick} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)]">
                               <StarIcon className="w-5 h-5" />
                               Favorites
                            </button>
                        </li>
                         <li>
                            <button onClick={onSharesClick} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)]">
                               <ShareIcon className="w-5 h-5" />
                               Shares
                            </button>
                        </li>
                        <div className="border-t my-1" style={{borderColor: 'var(--color-primary)'}}></div>
                        <li>
                            <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)]">
                               Sign Out
                            </button>
                        </li>
                    </ul>
                 </div>
            </div>
        </div>
    );
};