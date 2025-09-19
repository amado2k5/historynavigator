
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
import type { Civilization, TimelineEvent, Character, War, Topic, User, Favorite } from './types.ts';
import { themes } from './themes.ts';
import { ViewModeToggle } from './components/ViewModeToggle.tsx';
import { ThreeDView } from './components/ThreeDView.tsx';

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
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
    const [user, setUser] = useState<User | null>(null);
    const [favorites, setFavorites] = useState<Favorite[]>([]);

    // --- Authentication and Favorites Logic ---

    useEffect(() => {
        // Persist user login
        try {
            const savedUser = localStorage.getItem('historyNavigatorUser');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('historyNavigatorUser');
        }
    }, []);

    useEffect(() => {
        // Load favorites when user logs in
        if (user) {
            try {
                const savedFavorites = localStorage.getItem(`favorites_${user.name}_${user.provider}`);
                if (savedFavorites) {
                    setFavorites(JSON.parse(savedFavorites));
                } else {
                    setFavorites([]);
                }
            } catch (e) {
                console.error("Failed to parse favorites from localStorage", e);
            }
        } else {
            setFavorites([]); // Clear favorites on logout
        }
    }, [user]);

    const handleLogin = (provider: string) => {
        const mockUser: User = { name: `${provider} User`, provider, avatar: provider.toLowerCase() };
        setUser(mockUser);
        localStorage.setItem('historyNavigatorUser', JSON.stringify(mockUser));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('historyNavigatorUser');
        setSelectedCivilization(null); // Reset view
        setCurrentEvent(null);
    };

    const toggleFavorite = (favorite: Omit<Favorite, 'civilizationName'>) => {
        if (!user || !selectedCivilization) return;

        const fullFavorite: Favorite = { ...favorite, civilizationName: selectedCivilization.name };
        
        const key = `favorites_${user.name}_${user.provider}`;
        let updatedFavorites;

        const isFavorited = favorites.some(f => f.id === fullFavorite.id && f.type === fullFavorite.type && f.civilizationName === fullFavorite.civilizationName);

        if (isFavorited) {
            updatedFavorites = favorites.filter(f => !(f.id === fullFavorite.id && f.type === fullFavorite.type && f.civilizationName === fullFavorite.civilizationName));
        } else {
            updatedFavorites = [...favorites, fullFavorite];
        }

        setFavorites(updatedFavorites);
        localStorage.setItem(key, JSON.stringify(updatedFavorites));
    };

    const isFavorited = (type: Favorite['type'], id: string): boolean => {
        if (!user || !selectedCivilization) return false;
        return favorites.some(f => f.type === type && f.id === id && f.civilizationName === selectedCivilization.name);
    };

    const navigateToFavorite = async (favorite: Favorite) => {
        setIsLoading(true);
        setError(null);
        setActiveModal(null);
        setViewMode('2D');

        try {
            let civData = selectedCivilization;
            // Load civilization data if it's not the currently selected one
            if (civData?.name !== favorite.civilizationName) {
                civData = await fetchCivilizationData(favorite.civilizationName, language, isKidsMode);
                setSelectedCivilization(civData);
            }

            if (!civData) throw new Error("Civilization data could not be loaded.");

            // Handle the specific favorite type
            switch (favorite.type) {
                case 'event':
                    const event = civData.timeline.find(e => e.id === favorite.id);
                    if (event) setCurrentEvent(event);
                    break;
                case 'character':
                    setActiveModal({ type: 'character', name: favorite.id });
                    break;
                case 'war':
                    setActiveModal({ type: 'war', name: favorite.id });
                    break;
                case 'topic':
                    setActiveModal({ type: 'topic', name: favorite.id });
                    break;
            }
        } catch (err) {
            console.error("Failed to navigate to favorite:", err);
            setError("Could not navigate to the selected favorite.");
        } finally {
            setIsLoading(false);
        }
    };


    // --- Core App Logic ---

    useEffect(() => {
        const theme = selectedCivilization ? themes[selectedCivilization.name] ?? themes.default : themes.default;
        
        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    
    }, [selectedCivilization]);

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
        setViewMode('2D');

        try {
            const data = await fetchCivilizationData(name, language, isKidsMode);
            setSelectedCivilization(data);
            if (data.timeline && data.timeline.length > 0) {
                setCurrentEvent(data.timeline[0]);
            }
        } catch (err) {
            console.error(`Failed to fetch data for ${name}:`, err);
            setError(`Could not load data for ${name}. Please try another civilization or refresh the page.`);
        } finally {
            setIsLoading(false);
        }
    }, [language, isKidsMode, selectedCivilization?.name]);
    
    useEffect(() => {
        if (selectedCivilization) {
            const civName = selectedCivilization.name;
            const refetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await fetchCivilizationData(civName, language, isKidsMode);
                    setSelectedCivilization(data);
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
        setSelectedCharacter(null);
    };
    
    const handleCharacterClick = (character: Character) => {
        setSelectedCharacter(character);
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
        <div className="flex flex-col h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
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
                user={user}
                onLogout={handleLogout}
            />
             {selectedCivilization && currentEvent && user && (
                <ViewModeToggle 
                    viewMode={viewMode}
                    onToggle={() => setViewMode(prev => prev === '2D' ? '3D' : '2D')}
                />
            )}
            <div className="flex flex-grow overflow-hidden">
                <div className="flex flex-col flex-grow">
                     {viewMode === '2D' ? (
                        <MainContent
                            civilization={selectedCivilization}
                            currentEvent={currentEvent}
                            character={selectedCharacter}
                            language={language}
                            isKidsMode={isKidsMode}
                            isLoading={isLoading}
                            user={user}
                            onLogin={handleLogin}
                            isFavorited={isFavorited}
                            toggleFavorite={toggleFavorite}
                        />
                    ) : (
                        <ThreeDView
                            civilization={selectedCivilization}
                            currentEvent={currentEvent}
                            language={language}
                            isKidsMode={isKidsMode}
                        />
                    )}
                    {selectedCivilization && selectedCivilization.timeline?.length > 0 && viewMode === '2D' && (
                        <Timeline
                            events={selectedCivilization.timeline}
                            currentEvent={currentEvent}
                            onEventSelect={handleEventSelect}
                            user={user}
                            isFavorited={isFavorited}
                            toggleFavorite={toggleFavorite}
                        />
                    )}
                </div>
                {selectedCivilization && !isLoading && viewMode === '2D' && (
                    <RightSidebar
                        civilization={selectedCivilization}
                        onCharacterClick={handleCharacterClick}
                        onWarClick={handleWarClick}
                        onTopicClick={handleTopicClick}
                        user={user}
                        favorites={favorites}
                        isFavorited={isFavorited}
                        toggleFavorite={toggleFavorite}
                        onFavoriteClick={navigateToFavorite}
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
