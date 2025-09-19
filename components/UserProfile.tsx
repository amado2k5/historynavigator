
import React, { useState } from 'react';
import type { User } from '../types.ts';
import { UserIcon, GoogleIcon, AppleIcon, XIcon, FacebookIcon } from './Icons.tsx';

interface UserProfileProps {
    user: User;
    onLogout: () => void;
}

const avatarMap: Record<string, React.FC<{className?: string}>> = {
    google: GoogleIcon,
    apple: AppleIcon,
    x: XIcon,
    facebook: FacebookIcon,
};


export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const AvatarComponent = avatarMap[user.avatar] || UserIcon;

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-background-light)] flex items-center justify-center border-2 border-[var(--color-primary)]">
                   <AvatarComponent className="w-5 h-5 text-[var(--color-secondary)]" />
                </div>
                <span className="hidden md:block text-sm font-medium">{user.name}</span>
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-[var(--color-background-light)] rounded-md shadow-lg z-20 border border-[var(--color-primary)]">
                     <div className="py-1">
                         <button 
                            onClick={onLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)]"
                        >
                            Sign Out
                         </button>
                     </div>
                 </div>
            )}
        </div>
    );
};
