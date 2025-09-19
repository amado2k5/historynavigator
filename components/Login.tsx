
import React from 'react';
import { GoogleIcon, AppleIcon, XIcon, FacebookIcon } from './Icons.tsx';

interface LoginProps {
    onLogin: (provider: string) => void;
}

const providers = [
    { name: 'Google', icon: GoogleIcon, color: 'hover:text-[#4285F4]' },
    { name: 'Apple', icon: AppleIcon, color: 'hover:text-white' },
    { name: 'X', icon: XIcon, color: 'hover:text-white' },
    { name: 'Facebook', icon: FacebookIcon, color: 'hover:text-[#1877F2]' },
];

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    return (
        <div className="text-center bg-black bg-opacity-50 backdrop-blur-sm p-8 rounded-xl border animate-fade-in" style={{borderColor: 'var(--color-primary)'}}>
            <h2 className="text-4xl font-bold font-heading mb-2" style={{color: 'var(--color-accent)'}}>Welcome to History Navigator</h2>
            <p className="text-xl text-[var(--color-secondary)] mb-8">Sign in to save your discoveries and personalize your journey.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {providers.map(provider => (
                    <button 
                        key={provider.name}
                        onClick={() => onLogin(provider.name)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 py-3 px-6 bg-[var(--color-background-light)] border border-[var(--color-primary)] rounded-lg transition-colors duration-300 hover:bg-[var(--color-primary)] ${provider.color}`}
                        aria-label={`Sign in with ${provider.name}`}
                    >
                        <provider.icon className="w-6 h-6" />
                        <span className="font-semibold text-lg hidden sm:block">{provider.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
