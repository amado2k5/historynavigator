import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import type { TimelineEvent, MapData, Share } from '../types.ts';
import { generateMapData } from '../services/geminiService.ts';
import { MapPinIcon } from './Icons.tsx';
import { ShareButton } from './ShareButton.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

// FIX: Add namespace declarations for the Google Maps API to resolve TypeScript errors.
// This provides type information for the `google` object loaded from an external script.
declare namespace google {
    namespace maps {
        interface LatLngLiteral {
            lat: number;
            lng: number;
        }

        interface MapOptions {
            center?: LatLngLiteral;
            zoom?: number;
            mapTypeId?: string;
            disableDefaultUI?: boolean;
            zoomControl?: boolean;
            streetViewControl?: boolean;
            mapTypeControl?: boolean;
            styles?: any[];
        }

        class Map {
            constructor(mapDiv: HTMLDivElement | null, opts?: MapOptions);
            panTo(latLng: LatLngLiteral): void;
        }

        enum Animation {
            DROP = 1,
        }

        interface MarkerOptions {
            position?: LatLngLiteral;
            map?: Map;
            title?: string;
            animation?: Animation;
        }

        class Marker {
            constructor(opts?: MarkerOptions);
            setMap(map: Map | null): void;
            getTitle(): string | null;
            addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
        }

        interface MapsEventListener {
            remove(): void;
        }

        class InfoWindow {
            constructor(opts?: any);
            setContent(content: string): void;
            open(map?: Map, anchor?: Marker): void;
        }
    }
}


// Extend the window interface to include google.maps
declare global {
    interface Window {
        google: typeof google;
    }
}

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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPoi, setSelectedPoi] = useState<MapData['pointsOfInterest'][0] | null>(null);
    const { t, language: langCode } = useI18n();

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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
        if (mapInstance.current && poi.coordinates) {
            mapInstance.current.panTo(poi.coordinates);
            const marker = markersRef.current.find(m => m.getTitle() === poi.name);
            if(marker && infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                    <div style="color: black; font-family: sans-serif;">
                        <h4 style="font-weight: bold; margin-bottom: 4px;">${poi.name}</h4>
                        <p>${poi.description}</p>
                    </div>
                `);
                infoWindowRef.current.open(mapInstance.current, marker);
            }
        }
    };
    
    // Cleanup function to remove markers from map
    const clearMarkers = () => {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
    };

    useEffect(() => {
        if (isOpen) {
            const fetchMapDetails = async () => {
                setIsLoading(true);
                setError(null);
                setSelectedPoi(null);
                setMapData(null);
                clearMarkers();

                try {
                    const data = await generateMapData(event, civilizationName, language, isKidsMode);
                    setMapData(data);
                } catch (err) {
                    setError(t('modals.error'));
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMapDetails();
        } else {
             // Cleanup on close
            clearMarkers();
            mapInstance.current = null;
        }
    }, [isOpen, event, civilizationName, language, isKidsMode, t]);

    // Google Maps initialization effect
    useEffect(() => {
        if (!isOpen || !mapData || isLoading) return;

        if (window.google && mapRef.current && !mapInstance.current) {
            const mapOptions: google.maps.MapOptions = {
                center: mapData.centerCoordinates,
                zoom: 12,
                mapTypeId: 'satellite', // Aerial view
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                styles: [ // Custom styles to better fit the dark theme
                    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                    {
                        featureType: 'administrative.locality',
                        elementType: 'labels.text.fill',
                        stylers: [{ color: '#d59563' }],
                    },
                    // ... other styles
                ]
            };

            mapInstance.current = new window.google.maps.Map(mapRef.current, mapOptions);
            infoWindowRef.current = new window.google.maps.InfoWindow();

            // Add markers for points of interest
            mapData.pointsOfInterest.forEach(poi => {
                if (poi.coordinates) {
                    const marker = new window.google.maps.Marker({
                        position: poi.coordinates,
                        map: mapInstance.current,
                        title: poi.name,
                        animation: window.google.maps.Animation.DROP
                    });
                    
                    marker.addListener('click', () => {
                        handlePoiSelect(poi);
                    });
                    markersRef.current.push(marker);
                }
            });
        }
    }, [isOpen, isLoading, mapData]);

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

            {isLoading && (
                <div className="flex justify-center items-center h-96 flex-col">
                    <LoadingSpinner />
                    <p className="mt-4 text-[var(--color-secondary)]">{t('modals.loadingRecords')}</p>
                </div>
            )}
            {error && <p className="text-red-400 text-center py-10">{error}</p>}
            {!isLoading && mapData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-bold text-lg font-heading mb-2">{t('modals.location')}</h3>
                        <p className="text-[var(--color-secondary)] mb-4">{mapData.mapDescription}</p>
                        <h3 className="font-bold text-lg font-heading mb-2">{t('modals.pointsOfInterest')}</h3>
                         <ul className="text-sm text-[var(--color-secondary)] space-y-2 max-h-[350px] overflow-y-auto">
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
                     <div className="md:col-span-2 bg-[var(--color-background-light)] rounded-lg min-h-[400px] flex items-center justify-center p-4 relative overflow-hidden">
                        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
                        {!window.google && <p className="text-center text-red-400">{t('modals.error')}</p>}
                    </div>
                </div>
            )}
        </Modal>
    );
};