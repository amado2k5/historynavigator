
import React from 'react';
// FIX: Added .ts extension to the import path.
import type { Civilization, Character, War, Topic } from '../types.ts';

interface RightSidebarProps {
    civilization: Civilization;
    onCharacterClick: (character: Character) => void;
    onWarClick: (war: War) => void;
    onTopicClick: (topic: Topic) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ civilization, onCharacterClick, onWarClick, onTopicClick }) => {
    
    const renderSection = <T extends { name: string }>(title: string, items: T[], onClick: (item: T) => void) => (
        <div className="mb-6">
            <h3 className="text-lg font-bold font-heading mb-3 border-b-2" style={{borderColor: 'var(--color-primary)'}}>{title}</h3>
            <ul className="space-y-2 text-sm">
                {items.map((item) => (
                    <li key={item.name}>
                        <button 
                            onClick={() => onClick(item)}
                            className="w-full text-left text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200"
                        >
                           {item.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <aside className="w-72 bg-black bg-opacity-20 backdrop-blur-sm p-4 z-30 shadow-left overflow-y-auto flex-shrink-0">
            <h2 className="text-xl font-bold font-heading mb-4" style={{ color: 'var(--color-accent)' }}>
                {civilization.name}
            </h2>
            <p className="text-sm text-[var(--color-secondary)] mb-6 leading-relaxed">
                {civilization.summary}
            </p>
            
            {renderSection('Key Characters', civilization.keyCharacters, onCharacterClick)}
            {renderSection('Major Wars', civilization.majorWars, onWarClick)}
            {renderSection('Cultural Topics', civilization.culturalTopics, onTopicClick)}
        </aside>
    );
};
