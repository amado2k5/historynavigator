

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
import { useI18n } from '../contexts/I18nContext.tsx';

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
    const { t, language: langCode } = useI18n();

     const generateShareUrl = () => {
        const params = new URLSearchParams({
            civilization: civilizationName,
            event: event.id,
            view: '2D',
            modal: 'map',
            id: event.id,
            lang: langCode,
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
                    setError(t('modals.error'));
                    console.error(err);
                    setIsLoading(false);
                } finally {
                    setIsLoadingImage(false);
                }
            };
            fetchMapDataAndImage();
        }
    }, [isOpen, event, civilizationName, language, isKidsMode, t]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>{t('modals.mapTitle', { eventName: event.title })}</h2>
                <ShareButton
                    shareUrl={generateShareUrl()}
                    shareTitle={`${t('modals.mapTitle', { eventName: event.title })} - TimelineThis`}
                    shareText={`Explore the map for the event "${event.title}" from the history of ${civilizationName}!`}
                    onShareClick={() => track('share_content', { type: 'map', id: event.id })}
                    onLogShare={({ url, title, text }) => logShare({ url, title, text })}
                />
            </div>

            {(isLoading || isLoadingImage) && (
                <div className="flex justify-center items-center h-96 flex-col">
                    <LoadingSpinner />
                    <p className="mt-4 text-[var(--color-secondary)]">
                        {isLoading ? t('modals.loadingRecords') : t('modals.drawingMaps')}
                    </p>
                </div>
            )}
            {error && <p className="text-red-400 text-center py-10">{error}</p>}
            {!isLoading && !isLoadingImage && mapData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-bold text-lg font-heading mb-2">{t('modals.location')}</h3>
                        <p className="text-[var(--color-secondary)] mb-4">{mapData.mapDescription}</p>
                        <h3 className="font-bold text-lg font-heading mb-2">{t('modals.pointsOfInterest')}</h3>
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
                            <div className="relative z-10 p-6 max-w-md animate-fade-in text-center backdrop-blur-sm bg-black/30 rounded-lg">
                                <button 
                                    onClick={() => setSelectedPoi(null)} 
                                    className="absolute top-2 right-2 p-1 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-colors"
                                    aria-label={t('modals.close')}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                 <h4 className="text-2xl font-bold font-heading mb-2 text-white drop-shadow-lg" style={{color: 'var(--color-accent)'}}>
                                     {selectedPoi.name}
                                 </h4>
                                 <p className="text-white leading-relaxed drop-shadow-md">
                                     {selectedPoi.description}
                                 </p>
                            </div>
                        ) : (
                             <p className="text-white relative z-10 drop-shadow-lg">{t('modals.selectPOI')}</p>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};
