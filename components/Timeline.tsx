import React from 'react';
// FIX: Added .ts extension to the import path.
import type { TimelineEvent } from '../types.ts';

interface TimelineProps {
    events: TimelineEvent[];
    currentEvent: TimelineEvent | null;
    onEventSelect: (event: TimelineEvent) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ events, currentEvent, onEventSelect }) => {
    return (
        <div className="w-full bg-black bg-opacity-40 backdrop-blur-sm p-4 z-30 shadow-top">
            <div className="relative w-full h-16 flex items-center">
                <div className="absolute top-1/2 left-0 w-full h-0.5" style={{backgroundColor: 'var(--color-primary)'}}></div>
                <div className="w-full flex justify-between items-center">
                    {events.map((event, index) => {
                        const isCurrent = currentEvent?.id === event.id;
                        return (
                            <div key={event.id} className="relative flex flex-col items-center group">
                                <button
                                    onClick={() => onEventSelect(event)}
                                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${isCurrent ? 'w-6 h-6' : ''}`}
                                    style={{
                                        backgroundColor: isCurrent ? 'var(--color-accent)' : 'var(--color-background)',
                                        borderColor: isCurrent ? 'var(--color-accent)' : 'var(--color-primary)'
                                    }}
                                    aria-label={`Select event: ${event.title}`}
                                />
                                <div className={`absolute bottom-full mb-3 w-48 text-center p-2 rounded-md bg-[var(--color-background-light)] border border-[var(--color-primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isCurrent ? '!opacity-100' : ''}`}>
                                    <p className="font-bold text-sm" style={{color: 'var(--color-accent)'}}>{event.date}</p>
                                    <p className="text-xs" style={{color: 'var(--color-foreground)'}}>{event.title}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};