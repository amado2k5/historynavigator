
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { MainContent } from './components/MainContent.tsx';
import { Timeline } from './components/Timeline.tsx';
import { RightSidebar } from './components/RightSidebar.tsx';
import { AmbientMusicPlayer } from './components/AmbientMusicPlayer.tsx';
import { CharacterDetailsModal } from './components/CharacterDetailsModal.tsx';
import { WarDetailsModal } from './components/WarDetailsModal.tsx';
import { TopicDetailsModal } from './components/TopicDetailsModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { FavoritesModal } from './components/FavoritesModal.tsx';
import { SharesModal } from './components/SharesModal.tsx';
import { TourGuide } from './components/TourGuide.tsx';
import { fetchCivilizations, fetchCivilizationData } from './services/geminiService.ts';
import type { Civilization, TimelineEvent, Character, War, Topic, User, Favorite, Share, TelemetryContext } from './types.ts';
import { themes } from './themes.ts';
import { ViewModeToggle } from './components/ViewModeToggle.tsx';
import { ThreeDView } from './components/ThreeDView.tsx';
import { trackEvent } from './services/telemetryService.ts';

export type ModalState = 
    | { type: 'character', name: string }
    | { type: 'war', name: string }
    | { type: 'topic', name: string }
    | { type: 'eventDetails', name: string }
    | { type: 'map', name: string }
    | { type: 'aiPrompt', name: string, prompt?: string }
    | { type: 'profile' }
    | { type: 'favorites' }
    | { type: 'shares' }
    | null;

interface ShareTarget {
    civilizationName: string;
    eventId: string;
    viewMode: '2D' | '3D';
    modalType: ModalState['type'] | 'hotspot' | 'none';
    modalId: string;
    prompt?: string;
}

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
    const [shares, setShares] = useState<Share[]>([]);
    const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [demoSearchText, setDemoSearchText] = useState('');
    
    // Refs to track previous state for telemetry
    const prevLanguageRef = useRef(language);
    const prevIsKidsModeRef = useRef(isKidsMode);
    const demoTimeoutRef = useRef<number | null>(null);

    // FIX: Moved telemetry logic before its usage to resolve 'used before its declaration' errors.
    // --- Telemetry Logic ---
    const getTelemetryContext = useCallback((): TelemetryContext => {
        return {
            user,
            civilization: selectedCivilization,
            currentEvent,
            viewMode,
            language,
            isKidsMode,
        };
    }, [user, selectedCivilization, currentEvent, viewMode, language, isKidsMode]);

    const track = useCallback((eventName: string, properties: Record<string, any> = {}) => {
        trackEvent(eventName, getTelemetryContext(), properties);
    }, [getTelemetryContext]);


    const handleCivilizationChange = useCallback(async (name: string) => {
        if (name === selectedCivilization?.name && !isDemoMode) return;

        // If the name is cleared, reset the view.
        if (!name) {
            if (!isDemoMode) track('clear_search');
            setSelectedCivilization(null);
            setCurrentEvent(null);
            return;
        }
        
        // Telemetry: Detect if this is a dynamic search or a selection from the list
        if (!isDemoMode) {
            const isDynamicSearch = !civilizations.some(c => c.name === name);
            track(isDynamicSearch ? 'search_topic' : 'select_civilization', { name });
        }
        
        setIsLoading(true);
        setError(null);
        setSelectedCivilization(null);
        setCurrentEvent(null);
        setSelectedCharacter(null);
        setViewMode('2D');
        setActiveModal(null);

        try {
            const data = await fetchCivilizationData(name, language, isKidsMode);
            setSelectedCivilization(data);
            if (data.timeline && data.timeline.length > 0) {
                setCurrentEvent(data.timeline[0]);
            }
        } catch (err: any)
 {
            console.error(`Failed to fetch data for ${name}:`, err);
            setError(err.message || `Could not load data for ${name}. Please try another topic or refresh the page.`);
        } finally {
            setIsLoading(false);
        }
    }, [language, isKidsMode, selectedCivilization?.name, track, civilizations, isDemoMode]);

    // --- Demo Mode Logic ---
    const stopDemo = useCallback(() => {
        if (demoTimeoutRef.current) {
            clearTimeout(demoTimeoutRef.current);
            demoTimeoutRef.current = null;
        }
        track('stop_demo_tour');
        setIsDemoMode(false);
        setDemoSearchText('');
        // Reset state to the beginning, using handleCivilizationChange to clear it
        if (selectedCivilization) {
            handleCivilizationChange(''); 
        }
        setActiveModal(null);
        setViewMode('2D');
    }, [selectedCivilization, handleCivilizationChange, track]);

    const startDemo = () => {
        track('start_demo_tour');
        setIsDemoMode(true);
        // Set a 3-minute timeout to automatically stop the demo
        demoTimeoutRef.current = window.setTimeout(() => {
            console.log("Demo mode timed out after 3 minutes.");
            stopDemo();
        }, 180000); // 3 minutes in milliseconds
    };

    // --- Authentication, Favorites and Shares Logic ---

    useEffect(() => {
        // Persist user login
        try {
            const savedUser = localStorage.getItem('timelineCreatorUser');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('timelineCreatorUser');
        }
    }, []);

    useEffect(() => {
        // Load favorites and shares when user logs in
        if (user) {
            try {
                const savedFavorites = localStorage.getItem(`favorites_${user.name}_${user.provider}`);
                if (savedFavorites) {
                    setFavorites(JSON.parse(savedFavorites));
                } else {
                    setFavorites([]);
                }
                const savedShares = localStorage.getItem(`shares_${user.name}_${user.provider}`);
                 if (savedShares) {
                    setShares(JSON.parse(savedShares));
                } else {
                    setShares([]);
                }
            } catch (e) {
                console.error("Failed to parse data from localStorage", e);
            }
        } else {
            setFavorites([]); // Clear favorites on logout
            setShares([]); // Clear shares on logout
        }
    }, [user]);

    const handleLogin = (provider: string) => {
        const mockUser: User = { name: `${provider} User`, provider, avatar: provider.toLowerCase() };
        setUser(mockUser);
        localStorage.setItem('timelineCreatorUser', JSON.stringify(mockUser));
        track('login', { provider });
    };

    const handleLogout = () => {
        track('logout');
        setUser(null);
        localStorage.removeItem('timelineCreatorUser');
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
             track('unfavorite_item', { type: fullFavorite.type, id: fullFavorite.id, name: fullFavorite.name });
        } else {
            updatedFavorites = [...favorites, fullFavorite];
             track('favorite_item', { type: fullFavorite.type, id: fullFavorite.id, name: fullFavorite.name });
        }

        setFavorites(updatedFavorites);
        localStorage.setItem(key, JSON.stringify(updatedFavorites));
    };

    const isFavorited = (type: Favorite['type'], id: string): boolean => {
        if (!user || !selectedCivilization) return false;
        return favorites.some(f => f.type === type && f.id === id && f.civilizationName === selectedCivilization.name);
    };
    
    const logShare = (shareData: Omit<Share, 'timestamp'>) => {
        if (!user) return;
        track('share_content_logged', { title: shareData.title });
        const newShare: Share = { ...shareData, timestamp: new Date().toISOString() };
        // Prevent duplicates from rapid clicking
        const isDuplicate = shares.some(s => s.url === newShare.url);
        if (isDuplicate) return;

        const updatedShares = [newShare, ...shares].slice(0, 50); // Keep last 50 shares
        setShares(updatedShares);
        localStorage.setItem(`shares_${user.name}_${user.provider}`, JSON.stringify(updatedShares));
    };

    const navigateToFavorite = async (favorite: Favorite) => {
        track('navigate_to_favorite', { type: favorite.type, id: favorite.id, name: favorite.name, from: favorite.civilizationName });
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
        } catch (err: any) {
            console.error("Failed to navigate to favorite:", err);
            setError(err.message || "Could not navigate to the selected favorite.");
        } finally {
            setIsLoading(false);
        }
    };


    // --- URL Hash Parsing and State Restoration ---
    useEffect(() => {
        const parseAndSetShareTarget = () => {
            if (window.location.hash.startsWith('#/share?')) {
                const params = new URLSearchParams(window.location.hash.substring(8));
                const civilizationName = params.get('civilization');
                const eventId = params.get('event');
                const viewMode = params.get('view') as '2D' | '3D';
                const modalType = params.get('modal') as ShareTarget['modalType'];
                const modalId = params.get('id');
                const lang = params.get('lang');
                const kids = params.get('kids') === 'true';
                const prompt = params.get('prompt');

                if (civilizationName && eventId && viewMode && modalType && modalId) {
                    track('load_from_share_link', {
                        civilization: civilizationName,
                        event: eventId,
                        view: viewMode,
                        modal: modalType,
                        id: modalId,
                    });
                    setLanguage(lang || 'English');
                    setIsKidsMode(kids);
                    setShareTarget({ civilizationName, eventId, viewMode, modalType, modalId, prompt: prompt || undefined });
                    history.pushState("", document.title, window.location.pathname + window.location.search);
                }
            }
        };
        parseAndSetShareTarget();
    }, [track]);

    // --- Core App Logic ---

    // This useEffect triggers the civilization loading from a share link
    useEffect(() => {
        if (shareTarget && !selectedCivilization && !isLoading) {
            handleCivilizationChange(shareTarget.civilizationName);
        }
    }, [shareTarget, selectedCivilization, isLoading, handleCivilizationChange]);
    
    // This useEffect waits for the civilization to load, then restores the rest of the state
    useEffect(() => {
        if (shareTarget && selectedCivilization?.name === shareTarget.civilizationName) {
            const event = selectedCivilization.timeline.find(e => e.id === shareTarget.eventId);
            if (event) {
                setCurrentEvent(event);
                setViewMode(shareTarget.viewMode);

                if (shareTarget.modalType !== 'hotspot' && shareTarget.modalType !== 'none') {
                     setActiveModal({ type: shareTarget.modalType as ModalState['type'], name: shareTarget.modalId, prompt: shareTarget.prompt });
                }

                setShareTarget(null);
            }
        }
    }, [selectedCivilization, shareTarget]);


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
    
    // Effect to track settings changes
    useEffect(() => {
        if (language !== prevLanguageRef.current) {
            track('setting_changed', { setting: 'language', from: prevLanguageRef.current, to: language });
            prevLanguageRef.current = language;
        }
        if (isKidsMode !== prevIsKidsModeRef.current) {
            track('setting_changed', { setting: 'kidsMode', from: prevIsKidsModeRef.current, to: isKidsMode });
            prevIsKidsModeRef.current = isKidsMode;
        }
    }, [language, isKidsMode, track]);

    useEffect(() => {
        if (selectedCivilization && !shareTarget && !isDemoMode) { // Prevent refetch during share link loading and demo
            const civName = selectedCivilization.name;
            const refetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await fetchCivilizationData(civName, language, isKidsMode);
                    setSelectedCivilization(data);
                    const eventExists = data.timeline.find(e => e.id === currentEvent?.id);
                    setCurrentEvent(eventExists || (data.timeline.length > 0 ? data.timeline[0] : null));
                } catch (err: any) {
                    console.error(`Failed to refetch data for ${civName}:`, err);
                    setError(err.message || `Could not reload data for ${civName}.`);
                } finally {
                    setIsLoading(false);
                }
            };
            refetchData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, isKidsMode]);

    const handleEventSelect = (event: TimelineEvent) => {
        if (!isDemoMode) track('select_timeline_event', { id: event.id, title: event.title });
        setCurrentEvent(event);
        setSelectedCharacter(null);
    };
    
    const handleCharacterClick = (character: Character) => {
        if (!isDemoMode) track('open_modal', { type: 'character', name: character.name });
        setSelectedCharacter(character);
        setActiveModal({ type: 'character', name: character.name });
    };

    const handleWarClick = (war: War) => {
        if (!isDemoMode) track('open_modal', { type: 'war', name: war.name });
        setActiveModal({ type: 'war', name: war.name });
    };

    const handleTopicClick = (topic: Topic) => {
        if (!isDemoMode) track('open_modal', { type: 'topic', name: topic.name });
        setActiveModal({ type: 'topic', name: topic.name });
    };

    const handleViewModeToggle = () => {
        const newMode = viewMode === '2D' ? '3D' : '2D';
        if (!isDemoMode) track('view_mode_changed', { from: viewMode, to: newMode });
        setViewMode(newMode);
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
                isLoading={isLoading}
                user={user}
                onLogout={handleLogout}
                onProfileClick={() => setActiveModal({ type: 'profile' })}
                onFavoritesClick={() => setActiveModal({ type: 'favorites'})}
                onSharesClick={() => setActiveModal({ type: 'shares'})}
                track={track}
                isDemoMode={isDemoMode}
                demoSearchText={demoSearchText}
            />
             {selectedCivilization && currentEvent && user && (
                <ViewModeToggle 
                    viewMode={viewMode}
                    onToggle={handleViewModeToggle}
                />
            )}
            <div className="flex flex-grow overflow-hidden relative">
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
                            logShare={logShare}
                            track={track}
                        />
                    ) : (
                        <ThreeDView
                            civilization={selectedCivilization}
                            currentEvent={currentEvent}
                            language={language}
                            isKidsMode={isKidsMode}
                            initialHotspotId={shareTarget?.modalType === 'hotspot' ? shareTarget.modalId : undefined}
                            logShare={logShare}
                            track={track}
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

            {!isDemoMode && !isLoading && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
                     <button
                        onClick={startDemo}
                        className="px-6 py-3 bg-[var(--color-accent)] text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                        Take a tour
                    </button>
                </div>
             )}

            {isDemoMode && (
                <TourGuide
                    stopDemo={stopDemo}
                    isLoading={isLoading}
                    selectedCivilization={selectedCivilization}
                    currentEvent={currentEvent}
                    viewMode={viewMode}
                    setDemoSearchText={setDemoSearchText}
                    handleCivilizationChange={handleCivilizationChange}
                    handleEventSelect={handleEventSelect}
                    handleCharacterClick={handleCharacterClick}
                    handleWarClick={handleWarClick}
                    handleViewModeToggle={handleViewModeToggle}
                    setActiveModal={setActiveModal}
                />
            )}

            {error && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-800 text-white p-4 rounded-lg shadow-lg z-50 animate-fade-in">
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className="absolute top-1 right-2 text-white font-bold">X</button>
                </div>
            )}
            
            {currentEvent && selectedCivilization && (
                <AmbientMusicPlayer 
                    event={currentEvent} 
                    civilizationName={selectedCivilization.name}
                    isKidsMode={isKidsMode}
                    track={track}
                />
            )}

            {activeModal?.type === 'character' && selectedCivilization && currentEvent && (
                 <CharacterDetailsModal 
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    characterName={activeModal.name}
                    civilizationName={selectedCivilization.name}
                    language={language}
                    isKidsMode={isKidsMode}
                    currentEvent={currentEvent}
                    logShare={logShare}
                    track={track}
                 />
            )}
            {activeModal?.type === 'war' && selectedCivilization && currentEvent && (
                 <WarDetailsModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    warName={activeModal.name}
                    civilizationName={selectedCivilization.name}
                    language={language}
                    isKidsMode={isKidsMode}
                    currentEvent={currentEvent}
                    logShare={logShare}
                    track={track}
                 />
            )}
            {activeModal?.type === 'topic' && selectedCivilization && currentEvent && (
                 <TopicDetailsModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    topicName={activeModal.name}
                    civilizationName={selectedCivilization.name}
                    language={language}
                    isKidsMode={isKidsMode}
                    currentEvent={currentEvent}
                    logShare={logShare}
                    track={track}
                 />
            )}
            {activeModal?.type === 'profile' && user && (
                <ProfileModal 
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    user={user}
                    favoritesCount={favorites.length}
                    sharesCount={shares.length}
                />
            )}
            {activeModal?.type === 'favorites' && user && (
                <FavoritesModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    favorites={favorites}
                    onFavoriteClick={(fav) => {
                        navigateToFavorite(fav);
                        setActiveModal(null);
                    }}
                />
            )}
            {activeModal?.type === 'shares' && user && (
                <SharesModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    shares={shares}
                />
            )}

        </div>
    );
}

export default App;
