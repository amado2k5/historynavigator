import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-black bg-opacity-20 backdrop-blur-sm p-2 text-center text-xs z-30 shadow-top flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
                <a
                    href="mailto:ahamdy@gmail.com"
                    className="text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors"
                >
                    Contact US
                </a>
                <p className="text-[var(--color-secondary)]">copyright 2025 timelineThis.app</p>
                <p className="text-[var(--color-secondary)] opacity-75">
                    Disclaimer (This application was developed using Google AI Studio. This is for demo purposes only and should not be used for any production use purposes).
                </p>
            </div>
        </footer>
    );
};