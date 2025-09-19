import React, { useState, useEffect, useCallback } from 'react';
import type { Civilization, TimelineEvent, Character, War, Favorite, Share } from '../types.ts';
import type { ModalState } from '../App.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

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
    const { t } = useI18n();
    const [step, setStep] = useState(0);
    const [tourMessage, setTourMessage] = useState(t('tour.welcome'));

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
                    setTourMessage(t('tour.welcome'));
                    await wait(5000);
                    setStep(1);
                    break;
                case 1:
                    setTourMessage(t('tour.start'));
                    await simulateTyping('Ancient Rome');
                    await wait(5000);
                    handleCivilizationChange('Ancient Rome');
                    setStep(2);
                    break;
                case 2: // Wait for Rome to load
                    if (selectedCivilization?.name === 'Ancient Rome') {
                        setTourMessage(t('tour.timeline'));
                        await wait(5000);
                        setStep(3);
                    }
                    break;
                case 3:
                    if (selectedCivilization?.timeline && selectedCivilization.timeline.length > 2) {
                        handleEventSelect(selectedCivilization.timeline[2]);
                        setTourMessage(t('tour.readDetails'));
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
                        setTourMessage(t('tour.canFavorite'));
                        await wait(5000);
                        setStep(5);
                    }
                    break;
                case 5:
                    if (currentEvent) {
                        toggleFavorite({ type: 'event', id: currentEvent.id, name: currentEvent.title });
                        setTourMessage(t('tour.viewFavorites'));
                        await wait(5000);
                        setStep(6);
                    }
                    break;
                case 6:
                    setActiveModal({ type: 'favorites' });
                    await wait(7000);
                    setActiveModal(null);
                    await wait(5000); // Wait after closing modal
                    setTourMessage(t('tour.sharing'));
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
                        setTourMessage(t('tour.shareHistory'));
                        await wait(5000);
                        setStep(8);
                    }
                    break;
                case 8:
                    setActiveModal({ type: 'shares' });
                    await wait(7000);
                    setActiveModal(null);
                    await wait(5000); // Wait after closing modal
                    setTourMessage(t('tour.sidebar'));
                    await wait(5000);
                    setStep(9);
                    break;
                case 9:
                    if (selectedCivilization?.keyCharacters && selectedCivilization.keyCharacters.length > 0) {
                        setTourMessage(t('tour.keyCharacter'));
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
                        setTourMessage(t('tour.majorConflict'));
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
                        setTourMessage(t('tour.threeDView'));
                        await wait(5000);
                        handleViewModeToggle();
                        await wait(8000); // Wait for scene to generate
                        setStep(12);
                    }
                    break;
                case 12:
                    if (viewMode === '3D') {
                        setTourMessage(t('tour.hotspots'));
                        await wait(8000);
                        handleViewModeToggle();
                        await wait(5000);
                        setTourMessage(t('tour.dynamicSearch'));
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
                        setTourMessage(t('tour.restarting'));
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
    }, [step, isLoading, selectedCivilization, currentEvent, viewMode, simulateTyping, handleCivilizationChange, handleEventSelect, setActiveModal, toggleFavorite, logShare, handleCharacterClick, handleWarClick, handleViewModeToggle, t]);

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
