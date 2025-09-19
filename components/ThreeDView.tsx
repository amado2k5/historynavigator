

import React, { useState, useEffect } from 'react';
import type { TimelineEvent, Civilization, Hotspot, SceneHotspot, Share } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { generateImage, fetchSceneHotspots } from '../services/geminiService.ts';
import { ChatBubbleIcon } from './Icons.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface ThreeDViewProps {
    civilization: Civilization | null;
    currentEvent: TimelineEvent | null;
    language: string;
    isKidsMode: boolean;
    initialHotspotId?: string;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
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

export const ThreeDView: React.FC<ThreeDViewProps> = ({ civilization, currentEvent, language, isKidsMode, initialHotspotId, logShare, track }) => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [hotspots, setHotspots] = useState<Hotspot[]>([]);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isLoadingHotspots, setIsLoadingHotspots] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const { t } = useI18n();

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

            try {
                const imagePrompt = isKidsMode
                    ? `A vibrant, colorful, and friendly cartoon or storybook illustration of the historical event: "${currentEvent.title}" from the ${civilization.name} civilization. Style: wide panoramic view, fun and engaging for children.`
                    : `A photorealistic, atmospheric, and highly detailed image visualizing the historical event: "${currentEvent.title}" from the ${civilization.name} civilization. Style: epic cinematic wide panoramic shot. Avoid text and overlays.`;
                
                const imageUrlPromise = generateImage(imagePrompt, '16:9');
                const hotspotsPromise = fetchSceneHotspots(currentEvent, civilization.name, isKidsMode);

                const [imageUrl, rawHotspots] = await Promise.all([imageUrlPromise, hotspotsPromise]);

                if (isCancelled) return;
                setBackgroundImage(imageUrl);
                setIsLoadingImage(false);

                const processedHotspots = rawHotspots.map(h => ({
                    name: h.name,
                    description: h.description,
                    positionCoords: positionStringToCoords(h.position)
                }));
                setHotspots(processedHotspots);

            } catch (err) {
                console.error("Failed to generate 3D scene:", err);
                if (!isCancelled) setError(t('threeDView.sceneError'));
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
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentEvent, civilization, isKidsMode, t]);
    
    // Mouse move handler for panoramic effect
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, currentTarget } = e;
        const { width } = currentTarget.getBoundingClientRect();
        const xPercent = (clientX / width - 0.5) * 2; // Range from -1 to 1
        setRotation({ x: 0, y: -xPercent * 10 }); // Rotate up to 10 degrees left/right
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
                        {isLoadingImage ? t('threeDView.generatingVista') : t('threeDView.populatingScene')}
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
                            <div
                                className="w-10 h-10 bg-black bg-opacity-40 backdrop-blur-sm rounded-full flex items-center justify-center text-white border-2 border-white border-opacity-50 animate-pulse-hotspot"
                                aria-label={t('threeDView.interactWith', { hotspotName: hotspot.name })}
                            >
                                <ChatBubbleIcon className="w-6 h-6"/>
                            </div>
                            <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-center bg-black bg-opacity-60 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2">
                                <p className="font-bold text-white">{hotspot.name}</p>
                                <p className="text-gray-300">{hotspot.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};