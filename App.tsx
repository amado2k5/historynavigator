
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { MainContent } from './components/MainContent.tsx';
import { Timeline } from './components/Timeline.tsx';
import { RightSidebar } from './components/RightSidebar.tsx';
import { AmbientMusicPlayer } from './components/AmbientMusicPlayer.tsx';
import { CharacterDetailsModal } from './components/CharacterDetailsModal.tsx';
import { WarDetailsModal } from './components/WarDetailsModal.tsx';
import { TopicDetailsModal } from './components/TopicDetailsModal.tsx';
import { fetchCivilizations, fetchCivilizationData } from './services/geminiService.ts';
import type { Civilization, TimelineEvent, Character, War, Topic } from './types.ts';

type ModalState = 
    | { type: 'character', name: string }
    | { type: 'war', name: string }
    | { type: 'topic', name: string }
    | null;

function App() {
    const [civilizations, setCivilizations] = useState<{ name: string }[]>([]);
    const [selectedCivilization, setSelectedCivilization] = useState<Civilization | null>(null);
    const [currentEvent, setCurrentEvent] = useState<TimelineEvent | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [language, setLanguage] = useState<string>('English');
    const [isKidsMode, setIsKidsMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalState>(null);

    useEffect(() => {
        const loadCivilizations = async () => {
            try {
                const civs = await fetchCivilizations();
                setCivilizations(civs);
            } catch (err) {
                console.error("Failed to fetch civilizations list:", err);
                setError("Could not load the list of civilizations.");
            }
        };
        loadCivilizations();
    }, []);

    const handleCivilizationChange = useCallback(async (name: string) => {
        if (!name || name === selectedCivilization?.name) return;
        
        setIsLoading(true);
        setError(null);
        setSelectedCivilization(null);
        setCurrentEvent(null);
        setSelectedCharacter(null);

        try {
            const data = await fetchCivilizationData(name, language, isKidsMode);
            setSelectedCivilization(data);
            if (data.timeline && data.timeline.length > 0) {
                setCurrentEvent(data.timeline[0]); // Select the first event by default
            }
        } catch (err) {
            console.error(`Failed to fetch data for ${name}:`, err);
            setError(`Could not load data for ${name}. Please try another civilization or refresh the page.`);
        } finally {
            setIsLoading(false);
        }
    }, [language, isKidsMode, selectedCivilization?.name]);
    
    // Refetch data when language or kids mode changes
    useEffect(() => {
        if (selectedCivilization) {
            const civName = selectedCivilization.name;
            // Use a separate function to avoid re-triggering the useCallback dependency loop issues with stateful parent function
            const refetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await fetchCivilizationData(civName, language, isKidsMode);
                    setSelectedCivilization(data);
                    // Preserve current event if it still exists in the new timeline, otherwise default to first
                    const eventExists = data.timeline.find(e => e.id === currentEvent?.id);
                    setCurrentEvent(eventExists || (data.timeline.length > 0 ? data.timeline[0] : null));
                } catch (err) {
                    console.error(`Failed to refetch data for ${civName}:`, err);
                    setError(`Could not reload data for ${civName}.`);
                } finally {
                    setIsLoading(false);
                }
            };
            refetchData();
        }
    }, [language, isKidsMode]);


    const handleEventSelect = (event: TimelineEvent) => {
        setCurrentEvent(event);
        setSelectedCharacter(null); // Reset character perspective when event changes
    };
    
    const handleCharacterClick = (character: Character) => {
        setSelectedCharacter(character);
        // Open character details modal
        setActiveModal({ type: 'character', name: character.name });
    };

    const handleWarClick = (war: War) => {
        setActiveModal({ type: 'war', name: war.name });
    };

    const handleTopicClick = (topic: Topic) => {
        setActiveModal({ type: 'topic', name: topic.name });
    };

    const handleSearchResultClick = (item: any) => {
        if (!selectedCivilization) return;
        const { type, id, name, title } = item;
        const itemName = name || title;
        if (type === 'event' && id) {
            const event = selectedCivilization.timeline.find(e => e.id === id);
            if (event) setCurrentEvent(event);
        } else if (type === 'character' && itemName) {
            setActiveModal({ type: 'character', name: itemName });
        } else if (type === 'war' && itemName) {
            setActiveModal({ type: 'war', name: itemName });
        } else if (type === 'topic' && itemName) {
            setActiveModal({ type: 'topic', name: itemName });
        }
    };


    return (
        <div className="flex flex-col h-screen bg-[var(--color-background)] text-[var(--color-foreground)] font-body">
            <Header
                civilizations={civilizations}
                selectedCivilization={selectedCivilization}
                onCivilizationChange={handleCivilizationChange}
                language={language}
                onLanguageChange={setLanguage}
                isKidsMode={isKidsMode}
                onKidsModeToggle={() => setIsKidsMode(!isKidsMode)}
                onSearchResultClick={handleSearchResultClick}
                isLoading={isLoading}
            />
            <div className="flex flex-grow overflow-hidden">
                <div className="flex flex-col flex-grow">
                    <MainContent
                        civilization={selectedCivilization}
                        currentEvent={currentEvent}
                        character={selectedCharacter}
                        language={language}
                        isKidsMode={isKidsMode}
                        isLoading={isLoading}
                    />
                    {selectedCivilization && selectedCivilization.timeline?.length > 0 && (
                        <Timeline
                            events={selectedCivilization.timeline}
                            currentEvent={currentEvent}
                            onEventSelect={handleEventSelect}
                        />
                    )}
                </div>
                {selectedCivilization && !isLoading && (
                    <RightSidebar
                        civilization={selectedCivilization}
                        onCharacterClick={handleCharacterClick}
                        onWarClick={handleWarClick}
                        onTopicClick={handleTopicClick}
                    />
                )}
            </div>

            {error && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-800 text-white p-4 rounded-lg shadow-lg z-50">
                    <p>{error}</p>
                </div>
            )}
            
            {currentEvent && selectedCivilization && (
                <AmbientMusicPlayer 
                    event={currentEvent} 
                    civilizationName={selectedCivilization.name}
                    isKidsMode={isKidsMode}
                />
            )}

            {activeModal?.type === 'character' && selectedCivilization && (
                 <CharacterDetailsModal 
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    characterName={activeModal.name}
                    civilizationName={selectedCivilization.name}
                    language={language}
                    isKidsMode={isKidsMode}
                 />
            )}
            {activeModal?.type === 'war' && selectedCivilization && (
                 <WarDetailsModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    warName={activeModal.name}
                    civilizationName={selectedCivilization.name}
                    language={language}
                    isKidsMode={isKidsMode}
                 />
            )}
            {activeModal?.type === 'topic' && selectedCivilization && (
                 <TopicDetailsModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    topicName={activeModal.name}
                    civilizationName={selectedCivilization.name}
                    language={language}
                    isKidsMode={isKidsMode}
                 />
            )}

        </div>
    );
}

export default App;
