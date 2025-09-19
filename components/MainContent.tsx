
// FIX: Imported useState and useEffect to resolve 'Cannot find name' errors.
import React, { useState, useEffect } from 'react';
import type { TimelineEvent, Character, Civilization, User, Favorite, Share } from '../types.ts';
import { EventBubble } from './EventBubble.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { Login } from './Login.tsx';
import { generateImage } from '../services/geminiService.ts';

interface MainContentProps {
    civilization: Civilization | null;
    currentEvent: TimelineEvent | null;
    character: Character | null;
    language: string;
    isKidsMode: boolean;
    isLoading: boolean;
    user: User | null;
    onLogin: (provider: string) => void;
    isFavorited: (type: Favorite['type'], id: string) => boolean;
    toggleFavorite: (favorite: Omit<Favorite, 'civilizationName'>) => void;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const MainContent: React.FC<MainContentProps> = ({ 
    civilization, currentEvent, character, language, isKidsMode, isLoading, user, onLogin, isFavorited, toggleFavorite, logShare, track
}) => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const generateBg = async () => {
            if (!currentEvent || !civilization) {
                setBackgroundImage(null);
                return;
            }

            setIsImageLoading(true);
            
            try {
                const prompt = isKidsMode
                    ? `A vibrant, colorful, and friendly cartoon or storybook illustration of the historical event: "${currentEvent.title}" (${currentEvent.date}) from the ${civilization.name} civilization. Summary: ${currentEvent.summary}. The style should be fun and engaging for children.`
                    : `A photorealistic, atmospheric, and highly detailed background image visualizing the historical event: "${currentEvent.title}" (${currentEvent.date}) from the ${civilization.name} civilization. Summary: ${currentEvent.summary}. The image should be cinematic and evocative of the time period. Avoid text and overlays.`;

                const imageUrl = await generateImage(prompt, '16:9');
                
                if (!isCancelled) {
                    setBackgroundImage(imageUrl);
                }
            } catch (err) {
                console.error("Failed to generate background image:", err);
                if (!isCancelled) {
                    setBackgroundImage(null); // Clear image on error
                }
            } finally {
                if (!isCancelled) {
                    setIsImageLoading(false);
                }
            }
        };

        generateBg();
        
        return () => {
            isCancelled = true;
        }

    }, [currentEvent, civilization, isKidsMode]);

    const renderContent = () => {
        if (isLoading) return null; // Full-screen loader is handled by the parent

        if (!user) {
             return <Login onLogin={onLogin} />;
        }

        if (!civilization) {
            return (
                 <div className="text-center">
                    <h2 className="text-4xl font-bold font-heading mb-2" style={{color: 'var(--color-accent)'}}>Welcome, {user.name}</h2>
                    <p className="text-xl" style={{color: 'var(--color-secondary)'}}>Please select a civilization to begin your journey.</p>
                </div>
            )
        }
        
        if (!currentEvent) {
             return (
                 <div className="text-center">
                    <h2 className="text-4xl font-bold font-heading mb-2" style={{color: 'var(--color-accent)'}}>Explore {civilization.name}</h2>
                    <p className="text-xl" style={{color: 'var(--color-secondary)'}}>Select an event from the timeline below to learn more.</p>
                </div>
            )
        }

        return (
             <EventBubble
                event={currentEvent}
                character={character}
                language={language}
                civilizationName={civilization.name}
                isKidsMode={isKidsMode}
                user={user}
                isFavorited={isFavorited('event', currentEvent.id)}
                toggleFavorite={() => toggleFavorite({type: 'event', id: currentEvent.id, name: currentEvent.title})}
                logShare={logShare}
                track={track}
            />
        );
    }


    return (
        <main className="flex-grow flex items-center justify-center p-4 relative overflow-hidden transition-all duration-500">
            {(isLoading || isImageLoading) && (
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
                    <LoadingSpinner />
                    {isLoading && <p className="mt-4 text-[var(--color-secondary)]">Loading civilization data...</p>}
                    {isImageLoading && !isLoading && <p className="mt-4 text-[var(--color-secondary)]">Generating historical vista...</p>}
                </div>
            )}

            {backgroundImage && (
                <div
                    key={backgroundImage} // Force re-render for transition
                    className="absolute inset-0 bg-cover bg-center z-0 animate-fade-in"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />
            )}
            
            <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />

            <div className="relative z-20 w-full h-full flex items-center justify-center">
                {renderContent()}
            </div>
        </main>
    );
};