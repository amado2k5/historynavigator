import React, { useState, useEffect, useRef } from 'react';
import type { TimelineEvent, Civilization, Hotspot, SceneHotspot } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { generateImage, fetchSceneHotspots, fetchHotspotDialogue } from '../services/geminiService.ts';
import { ChatBubbleIcon } from './Icons.tsx';

interface ThreeDViewProps {
    civilization: Civilization | null;
    currentEvent: TimelineEvent | null;
    language: string;
    isKidsMode: boolean;
}

const positionStringToCoords = (posStr: SceneHotspot['position']): { x: number; y: number } => {
    const positions: Record<SceneHotspot['position'], { x: number; y: number }> = {
        'top-left': { x: 20, y: 25 },
        'top-center': { x: 50, y: 25 },
        'top-right': { x: 80, y: 25 },
        'middle-left': { x: 20, y: 50 },
        'center': { x: 50, y: 50 },
        'middle-right': { x: 80, y: 50 },
        'bottom-left': { x: 20, y: 75 },
        'bottom-center': { x: 50, y: 75 },
        'bottom-right': { x: 80, y: 75 },
    };
    return positions[posStr] || positions['center'];
};

export const ThreeDView: React.FC<ThreeDViewProps> = ({ civilization, currentEvent, language, isKidsMode }) => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [hotspots, setHotspots] = useState<Hotspot[]>([]);
    const [activeDialogue, setActiveDialogue] = useState<{ hotspotName: string, text: string } | null>(null);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isLoadingHotspots, setIsLoadingHotspots] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Main data fetching effect
    useEffect(() => {
        let isCancelled = false;

        const generateScene = async () => {
            if (!currentEvent || !civilization) return;

            setIsLoadingImage(true);
            setIsLoadingHotspots(true);
            setError(null);
            setBackgroundImage(null);
            setHotspots([]);
            setActiveDialogue(null);
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            try {
                // Generate background image
                const imagePrompt = isKidsMode
                    ? `A vibrant, colorful, and friendly cartoon or storybook illustration of the historical event: "${currentEvent.title}" from the ${civilization.name} civilization. Style: wide panoramic view, fun and engaging for children.`
                    : `A photorealistic, atmospheric, and highly detailed background image visualizing the historical event: "${currentEvent.title}" from the ${civilization.name} civilization. Style: epic cinematic wide panoramic shot. Avoid text and overlays.`;
                
                const imageUrl = await generateImage(imagePrompt, '16:9');
                if (isCancelled) return;
                setBackgroundImage(imageUrl);
                setIsLoadingImage(false);

                // Fetch hotspots based on the event
                const rawHotspots = await fetchSceneHotspots(currentEvent, civilization.name, isKidsMode);
                if (isCancelled) return;
                
                const processedHotspots = rawHotspots.map(h => ({
                    name: h.name,
                    description: h.description,
                    positionCoords: positionStringToCoords(h.position)
                }));
                setHotspots(processedHotspots);

            } catch (err) {
                console.error("Failed to generate 3D scene:", err);
                if (!isCancelled) setError("Could not create the immersive scene. Please try another event.");
            } finally {
                if (!isCancelled) {
                    setIsLoadingImage(false);
                    setIsLoadingHotspots(false);
                }
            }
        };

        generateScene();

        return () => {
            isCancelled = true;
            window.speechSynthesis.cancel();
        };
    }, [currentEvent, civilization, isKidsMode]);
    
    // Mouse move handler for panoramic effect
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, currentTarget } = e;
        const { width } = currentTarget.getBoundingClientRect();
        const xPercent = (clientX / width - 0.5) * 2; // Range from -1 to 1
        setRotation({ x: 0, y: -xPercent * 10 }); // Rotate up to 10 degrees left/right
    };

    // Hotspot click handler for dialogue
    const handleHotspotClick = async (hotspot: Hotspot) => {
        setActiveDialogue({ hotspotName: hotspot.name, text: '...' });
        window.speechSynthesis.cancel(); // Stop any previous speech

        try {
            const dialogue = await fetchHotspotDialogue(hotspot.name, currentEvent!, civilization!.name, language, isKidsMode);
            setActiveDialogue({ hotspotName: hotspot.name, text: dialogue });

            const utterance = new SpeechSynthesisUtterance(dialogue);
            utterance.onend = () => {
                 // Clear bubble after a short delay
                setTimeout(() => setActiveDialogue(null), 2000);
            };
            utterance.onerror = (e) => {
                console.error("Speech synthesis error", e);
                setActiveDialogue(null);
            };
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);

        } catch (err) {
            console.error(`Failed to get dialogue for ${hotspot.name}:`, err);
            setActiveDialogue({ hotspotName: hotspot.name, text: 'I have nothing to say.' });
             setTimeout(() => setActiveDialogue(null), 2000);
        }
    };


    return (
        <main 
            className="flex-grow flex items-center justify-center relative overflow-hidden bg-black"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setRotation({ x: 0, y: 0 })}
        >
            {(isLoadingImage || isLoadingHotspots) && (
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-20">
                    <LoadingSpinner />
                    <p className="mt-4 text-[var(--color-secondary)]">
                        {isLoadingImage ? "Generating historical vista..." : "Populating scene with characters..."}
                    </p>
                </div>
            )}
            
            {error && (
                <div className="relative z-10 text-center p-4 bg-black bg-opacity-50 rounded-lg">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {backgroundImage && (
                <div
                    className="absolute inset-[-5%] w-[110%] h-[110%] transition-transform duration-300 ease-out bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url(${backgroundImage})`,
                        transform: `scale(1.1) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    }}
                >
                    {hotspots.map((hotspot) => (
                        <div
                            key={hotspot.name}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                            style={{
                                left: `${hotspot.positionCoords.x}%`,
                                top: `${hotspot.positionCoords.y}%`,
                            }}
                        >
                            <button
                                onClick={() => handleHotspotClick(hotspot)}
                                className="w-10 h-10 bg-black bg-opacity-40 backdrop-blur-sm rounded-full flex items-center justify-center text-white border-2 border-white border-opacity-50 animate-pulse-hotspot"
                                aria-label={`Interact with ${hotspot.name}`}
                            >
                                <ChatBubbleIcon className="w-6 h-6"/>
                            </button>
                            <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-center bg-black bg-opacity-60 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2">
                                <p className="font-bold text-white">{hotspot.name}</p>
                                <p className="text-gray-300">{hotspot.description}</p>
                            </div>
                            {activeDialogue?.hotspotName === hotspot.name && (
                                <div className="absolute top-full mt-2 w-max max-w-xs p-3 bg-[var(--color-accent)] text-black font-semibold rounded-lg shadow-lg animate-fade-in -translate-x-1/2 left-1/2">
                                    {activeDialogue.text}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};
