import React, { useState, useEffect, useCallback } from 'react';
import type { Civilization, TimelineEvent, Character, War } from '../types.ts';
import type { ModalState } from '../App.tsx';

interface TourGuideProps {
    stopDemo: () => void;
    isLoading: boolean;
    selectedCivilization: Civilization | null;
    currentEvent: TimelineEvent | null;
    viewMode: '2D' | '3D';
    setDemoSearchText: (text: string) => void;
    handleCivilizationChange: (name: string) => Promise<void>;
    handleEventSelect: (event: TimelineEvent) => void;
    handleCharacterClick: (character: Character) => void;
    handleWarClick: (war: War) => void;
    handleViewModeToggle: () => void;
    setActiveModal: (modal: ModalState) => void;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const TourGuide: React.FC<TourGuideProps> = ({
    stopDemo,
    isLoading,
    selectedCivilization,
    currentEvent,
    viewMode,
    setDemoSearchText,
    handleCivilizationChange,
    handleEventSelect,
    handleCharacterClick,
    handleWarClick,
    handleViewModeToggle,
    setActiveModal,
}) => {
    const [step, setStep] = useState(0);
    const [tourMessage, setTourMessage] = useState('Welcome! The tour is starting...');

    const simulateTyping = useCallback(async (text: string) => {
        for (let i = 0; i < text.length; i++) {
            setDemoSearchText(text.substring(0, i + 1));
            await wait(100);
        }
    }, [setDemoSearchText]);

    useEffect(() => {
        let isCancelled = false;

        const tourScript = async () => {
            if (isLoading || isCancelled) return;

            switch (step) {
                case 0:
                    setTourMessage("Let's start by exploring a classic civilization: Ancient Rome.");
                    await wait(2000);
                    setStep(1);
                    break;
                case 1:
                    await simulateTyping('Ancient Rome');
                    await wait(500);
                    handleCivilizationChange('Ancient Rome');
                    setStep(2);
                    break;
                case 2: // Wait for Rome to load
                    if (selectedCivilization?.name === 'Ancient Rome') {
                        setTourMessage("Here's the timeline. Let's select an event.");
                        await wait(2000);
                        setStep(3);
                    }
                    break;
                case 3:
                    if (selectedCivilization?.timeline && selectedCivilization.timeline.length > 2) {
                        handleEventSelect(selectedCivilization.timeline[2]);
                        setTourMessage("We can read more details about this event.");
                        await wait(3000);
                        setStep(4);
                    }
                    break;
                case 4:
                    if (currentEvent) {
                        setActiveModal({ type: 'eventDetails', name: currentEvent.id });
                        await wait(6000);
                        setActiveModal(null);
                        setTourMessage("The right sidebar has more topics to explore.");
                        await wait(2000);
                        setStep(5);
                    }
                    break;
                case 5:
                    if (selectedCivilization?.keyCharacters && selectedCivilization.keyCharacters.length > 0) {
                        setTourMessage("Let's learn about a key character.");
                        handleCharacterClick(selectedCivilization.keyCharacters[0]);
                        await wait(6000);
                        setActiveModal(null);
                        setStep(6);
                    }
                    break;
                case 6:
                     if (selectedCivilization?.majorWars && selectedCivilization.majorWars.length > 0) {
                        setTourMessage("And a major conflict...");
                        handleWarClick(selectedCivilization.majorWars[0]);
                        await wait(6000);
                        setActiveModal(null);
                        setStep(7);
                    }
                    break;
                case 7:
                    if (viewMode === '2D') {
                        setTourMessage("Now for the immersive 3D view!");
                        handleViewModeToggle();
                        await wait(5000); // Wait for scene to generate
                        setStep(8);
                    }
                    break;
                case 8:
                    if (viewMode === '3D') {
                        setTourMessage("You can click on hotspots to interact with the scene.");
                        await wait(6000);
                        handleViewModeToggle();
                        setTourMessage("Let's try a dynamic search for a modern topic.");
                        await wait(2000);
                        setStep(9);
                    }
                    break;
                case 9:
                    handleCivilizationChange(''); // Clear current selection
                    setDemoSearchText('');
                    await wait(1000);
                    setStep(10);
                    break;
                case 10:
                    await simulateTyping('Human Space Exploration');
                    await wait(500);
                    handleCivilizationChange('Human Space Exploration');
                    setStep(11);
                    break;
                 case 11: // Wait for search to load
                    if (selectedCivilization?.name === 'Human Space Exploration') {
                        setTourMessage("The tour will now restart. You can exit anytime.");
                        await wait(4000);
                        setStep(0); // Loop the tour
                    }
                    break;

                default:
                    setStep(0);
            }
        };

        tourScript();

        return () => { isCancelled = true; };
    }, [step, isLoading, selectedCivilization, currentEvent, viewMode]);

    return (
        <>
            {/* Overlay to prevent user clicks */}
            <div className="fixed inset-0 bg-transparent z-40"></div>
            
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 backdrop-blur-sm text-white p-3 rounded-lg shadow-lg z-50 animate-fade-in">
                <p>✨ {tourMessage}</p>
            </div>

            <button
                onClick={stopDemo}
                className="fixed bottom-4 right-4 z-50 px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
            >
                Exit Demo
            </button>
        </>
    );
};