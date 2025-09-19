import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div 
            className="w-16 h-16 border-4 border-t-4 rounded-full animate-spin"
            style={{
                borderColor: 'var(--color-primary)',
                borderTopColor: 'var(--color-accent)'
            }}
        ></div>
    );
};