
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
// FIX: Added .ts extension to the import path.
import type { TimelineEvent, MapData, Share } from '../types.ts';
// FIX: Added .ts extension to the import path.
import { generateMapData, generateImage } from '../services/geminiService.ts';
// FIX: Added .tsx extension to the import path.
import { MapPinIcon } from './Icons.tsx';
import { ShareButton } from './ShareButton.tsx';

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: TimelineEvent;
    civilizationName: string;
    language: string;
    isKidsMode: boolean;
    logShare: (shareData: Omit<Share, 'timestamp'>) => void;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, event, civilizationName, language, isKidsMode, logShare, track }) => {
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPoi, setSelectedPoi] = useState<MapData['pointsOfInterest'][0] | null>(null);

     const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: event.id,
            view: '2D',
            modal: 'map',
            id: event.id,
            lang: language,
            kids: String(isKidsMode),
        });
        return `${window.location.origin}${window.location.pathname}#/share?${params.toString()}`;
    };

    const handlePoiSelect = (poi: MapData['pointsOfInterest'][0]) => {
        track('select_poi', { name: poi.name });
        setSelectedPoi(poi);
    };

    useEffect(() => {
        if (isOpen) {
            const fetchMapDataAndImage = async () => {
                setIsLoading(true);
                setIsLoadingImage(true);
                setError(null);
                setSelectedPoi(null);
                setMapData(null);
                setMapImageUrl(null);

                try {
                    const data = await generateMapData(event, civilizationName, language, isKidsMode);
                    setMapData(data);
                    if (data && data.pointsOfInterest.length > 0) {
                        setSelectedPoi(data.pointsOfInterest[0]);
                    }
                    setIsLoading(false);

                    if (data) {
                        const poiList = data.pointsOfInterest.map(p => p.name).join(', ');
                        const prompt = isKidsMode 
                            ? `A fun, colorful cartoon treasure map illustrating the area for the historical event "${event.title}". The map should feel adventurous and show these key locations in a playful style: ${poiList}. The overall style should be a simple, hand-drawn illustration suitable for kids.`
                            : `A stylized, atmospheric, and ancient-looking aerial map depicting the key locations for the historical event "${event.title}". The map should show the geography described as "${data.mapDescription}" and include these points of interest: ${poiList}. The style should resemble an old, hand-drawn cartograph from the ${civilizationName} era. Avoid using modern text labels.`;
                        
                        const imageUrl = await generateImage(prompt, '1:1');
                        setMapImageUrl(imageUrl);
                    }
                } catch (err) {
                    setError('Failed to load map data or generate map image.');
                    console.error(err);
                    setIsLoading(false);
                } finally {
                    setIsLoadingImage(false);
                }
            };
            fetchMapDataAndImage();
        }
    }, [isOpen, event, civilizationName, language, isKidsMode]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>Map of {event.title}</h2>
                <ShareButton
                    shareUrl={generateShareUrl()}
                    shareTitle={`Map of ${event.title} - Timeline Creator`}
                    shareText={`Explore the map for the event "${event.title}" from the history of ${civilizationName}!`}
                    onShareClick={() => track('share_content', { type: 'map', id: event.id })}
                    onLogShare={({ url, title, text }) => logShare({ url, title, text })}
                />
            </div>

            {(isLoading || isLoadingImage) && (
                <div className="flex justify-center items-center h-96 flex-col">
                    <LoadingSpinner />
                    <p className="mt-4 text-[var(--color-secondary)]">
                        {isLoading ? 'Retrieving historical records...' : 'Drawing ancient maps...'}
                    </p>
                </div>
            )}
            {error && <p className="text-red-400 text-center py-10">{error}</p>}
            {!isLoading && !isLoadingImage && mapData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-bold text-lg font-heading mb-2">Location</h3>
                        <p className="text-[var(--color-secondary)] mb-4">{mapData.mapDescription}</p>
                        <h3 className="font-bold text-lg font-heading mb-2">Points of Interest</h3>
                         <ul className="text-sm text-[var(--color-secondary)] space-y-2">
                            {mapData.pointsOfInterest.map((poi, index) => (
                                <li key={index}>
                                     <button 
                                        onClick={() => handlePoiSelect(poi)}
                                        className={`w-full text-left p-2 rounded-md transition-colors flex items-center gap-2 ${selectedPoi?.name === poi.name ? 'bg-[var(--color-primary)]' : 'hover:bg-[var(--color-background-light)]'}`}
                                    >
                                        <MapPinIcon className={`w-5 h-5 flex-shrink-0 ${selectedPoi?.name === poi.name ? 'text-[var(--color-accent)]' : ''}`} />
                                        <span className={`font-semibold ${selectedPoi?.name === poi.name ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground)]'}`}>{poi.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div className="md:col-span-2 bg-gray-800 rounded-lg min-h-[400px] flex items-center justify-center p-4 relative overflow-hidden">
                        
                        {mapImageUrl ? (
                            <img src={mapImageUrl} alt={`Map for ${event.title}`} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                        ) : (
                             <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: 'url(https://www.transparenttextures.com/patterns/subtle-carbon.png)'}}></div>
                        )}
                        
                        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>

                        {selectedPoi ? (
                            <div className="relative z-10 bg-[var(--color-background)] bg-opacity-80 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-[var(--color-primary)] max-w-md animate-fade-in">
                                 <h4 className="text-xl font-bold font-heading mb-2 flex items-center gap-2" style={{color: 'var(--color-accent)'}}>
                                     <MapPinIcon className="w-6 h-6"/>
                                     {selectedPoi.name}
                                 </h4>
                                 <p className="text-[var(--color-secondary)] leading-relaxed">{selectedPoi.description}</p>
                            </div>
                        ) : (
                             <p className="text-gray-400 relative z-10">Select a point of interest to learn more.</p>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};