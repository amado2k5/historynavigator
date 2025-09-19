import React, { useState, useEffect, useCallback } from 'react';
import type { Civilization, TimelineEvent, Character, War, Favorite, Share } from '../types.ts';
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
    toggleFavorite: (favorite: Omit<Favorite, 'civilizationName'>) => void;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
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
    toggleFavorite,
    logShare,
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
                    setTourMessage("Welcome! The tour is starting...");
                    await wait(5000);
                    setStep(1);
                    break;
                case 1:
                    setTourMessage("Let's start by exploring a classic civilization: Ancient Rome.");
                    await simulateTyping('Ancient Rome');
                    await wait(5000);
                    handleCivilizationChange('Ancient Rome');
                    setStep(2);
                    break;
                case 2: // Wait for Rome to load
                    if (selectedCivilization?.name === 'Ancient Rome') {
                        setTourMessage("Here's the timeline. Let's select an event.");
                        await wait(5000);
                        setStep(3);
                    }
                    break;
                case 3:
                    if (selectedCivilization?.timeline && selectedCivilization.timeline.length > 2) {
                        handleEventSelect(selectedCivilization.timeline[2]);
                        setTourMessage("We can read more details about this event.");
                        await wait(5000);
                        setStep(4);
                    }
                    break;
                case 4:
                    if (currentEvent) {
                        setActiveModal({ type: 'eventDetails', name: currentEvent.id });
                        await wait(8000);
                        setActiveModal(null);
                        await wait(5000); // Wait after closing modal
                        setTourMessage("You can save interesting items to your favorites.");
                        await wait(5000);
                        setStep(5);
                    }
                    break;
                case 5:
                    if (currentEvent) {
                        toggleFavorite({ type: 'event', id: currentEvent.id, name: currentEvent.title });
                        setTourMessage("Let's view your saved favorites.");
                        await wait(5000);
                        setStep(6);
                    }
                    break;
                case 6:
                    setActiveModal({ type: 'favorites' });
                    await wait(7000);
                    setActiveModal(null);
                    await wait(5000); // Wait after closing modal
                    setTourMessage("Sharing discoveries is easy with a unique link.");
                    await wait(5000);
                    setStep(7);
                    break;
                case 7:
                     if (currentEvent) {
                        logShare({ 
                            url: 'demo://share/123', 
                            title: `timelineThis.app: ${currentEvent.title}`, 
                            text: 'A demo share from the tour!' 
                        });
                        setTourMessage("Your share history is also saved to your profile.");
                        await wait(5000);
                        setStep(8);
                    }
                    break;
                case 8:
                    setActiveModal({ type: 'shares' });
                    await wait(7000);
                    setActiveModal(null);
                    await wait(5000); // Wait after closing modal
                    setTourMessage("The right sidebar has more topics to explore.");
                    await wait(5000);
                    setStep(9);
                    break;
                case 9:
                    if (selectedCivilization?.keyCharacters && selectedCivilization.keyCharacters.length > 0) {
                        setTourMessage("Let's learn about a key character.");
                        await wait(5000);
                        handleCharacterClick(selectedCivilization.keyCharacters[0]);
                        await wait(8000);
                        setActiveModal(null);
                        await wait(5000);
                        setStep(10);
                    }
                    break;
                case 10:
                     if (selectedCivilization?.majorWars && selectedCivilization.majorWars.length > 0) {
                        setTourMessage("And a major conflict...");
                        await wait(5000);
                        handleWarClick(selectedCivilization.majorWars[0]);
                        await wait(8000);
                        setActiveModal(null);
                        await wait(5000);
                        setStep(11);
                    }
                    break;
                case 11:
                    if (viewMode === '2D') {
                        setTourMessage("Now for the immersive 3D view!");
                        await wait(5000);
                        handleViewModeToggle();
                        await wait(8000); // Wait for scene to generate
                        setStep(12);
                    }
                    break;
                case 12:
                    if (viewMode === '3D') {
                        setTourMessage("You can click on hotspots to interact with the scene.");
                        await wait(8000);
                        handleViewModeToggle();
                        await wait(5000);
                        setTourMessage("Let's try a dynamic search for a modern topic.");
                        await wait(5000);
                        setStep(13);
                    }
                    break;
                case 13:
                    handleCivilizationChange(''); // Clear current selection
                    setDemoSearchText('');
                    await wait(5000);
                    setStep(14);
                    break;
                case 14:
                    await simulateTyping('Human Space Exploration');
                    await wait(5000);
                    handleCivilizationChange('Human Space Exploration');
                    setStep(15);
                    break;
                 case 15: // Wait for search to load
                    if (selectedCivilization?.name === 'Human Space Exploration') {
                        setTourMessage("The tour will now restart. You can exit anytime.");
                        await wait(5000);
                        setStep(0); // Loop the tour
                    }
                    break;

                default:
                    setStep(0);
            }
        };

        tourScript();

        return () => { isCancelled = true; };
    }, [step, isLoading, selectedCivilization, currentEvent, viewMode, simulateTyping, handleCivilizationChange, handleEventSelect, setActiveModal, toggleFavorite, logShare, handleCharacterClick, handleWarClick, handleViewModeToggle]);

    return (
        <>
            {/* Overlay to prevent user clicks */}
            <div className="fixed inset-0 bg-transparent z-40"></div>
            
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 backdrop-blur-sm text-white p-3 rounded-lg shadow-lg z-50 animate-fade-in">
                <p>✨ {tourMessage}</p>
            </div>
        </>
    );
};