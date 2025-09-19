import React, { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-6xl'
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div
                className={`rounded-lg shadow-xl m-4 relative border transition-transform transform scale-95 hover:scale-100 ${sizeClasses[size]} w-full flex flex-col max-h-[90vh]`}
                style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-foreground)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
