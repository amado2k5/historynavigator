
import React, { useState, useEffect, useRef } from 'react';
import type { TimelineEvent } from '../types.ts';
import { findAmbientMusicOnWeb } from '../services/geminiService.ts';
import { VolumeUpIcon, VolumeOffIcon } from './Icons.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface AmbientMusicPlayerProps {
    event: TimelineEvent;
    civilizationName: string;
    isKidsMode: boolean;
    track: (eventName: string, properties?: Record<string, any>) => void;
}

export const AmbientMusicPlayer: React.FC<AmbientMusicPlayerProps> = ({ event, civilizationName, isKidsMode, track }) => {
    const [isMuted, setIsMuted] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeIntervalRef = useRef<number | null>(null);
    const { t } = useI18n();

    const MAX_VOLUME = 0.4; // Keep it subtle

    const clearFadeInterval = () => {
        if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
        }
    };

    const fadeAudio = (direction: 'in' | 'out', duration: number, callback?: () => void) => {
        clearFadeInterval();
        const audio = audioRef.current;
        if (!audio) return;

        const targetVolume = direction === 'in' ? MAX_VOLUME : 0;
        const startVolume = audio.volume;
        // Avoid division by zero if already at target
        if (startVolume === targetVolume) {
            if (callback) callback();
            return;
        }

        const stepTime = 50;
        const steps = Math.max(1, duration / stepTime);
        const volumeStep = (targetVolume - startVolume) / steps;

        fadeIntervalRef.current = window.setInterval(() => {
            const newVolume = audio.volume + volumeStep;
            if ((direction === 'in' && newVolume >= targetVolume) || (direction === 'out' && newVolume <= targetVolume)) {
                audio.volume = targetVolume;
                if (direction === 'out' && audio) {
                    audio.pause();
                }
                clearFadeInterval();
                if (callback) callback();
            } else if (audio) {
                audio.volume = newVolume;
            }
        }, stepTime);
    };
    
    useEffect(() => {
        let isCancelled = false;

        const changeTrack = async () => {
            setIsLoading(true);
            setError(null);
            
            const audio = audioRef.current;
            if (audio && !audio.paused) {
                await new Promise<void>(resolve => fadeAudio('out', 1000, resolve));
            }

            if (isCancelled) return;

            try {
                const musicUrl = await findAmbientMusicOnWeb(event, civilizationName, isKidsMode);
                if (isCancelled) return;

                if (musicUrl && audio) {
                    audio.src = musicUrl;
                    audio.load();
                    // Play returns a promise which can be used to detect if autoplay was blocked
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            if (!isMuted && !isCancelled) {
                                fadeAudio('in', 1500);
                            }
                        }).catch(error => {
                            console.warn("Autoplay was prevented. Muting audio until user interaction.", error);
                             if (!isCancelled) {
                                setIsMuted(true);
                                audio.muted = true;
                            }
                        });
                    }
                } else {
                    console.warn("No music was found for this event.");
                }
            } catch (err) {
                console.error("Failed to find or play ambient music:", err);
                if (!isCancelled) setError(t('modals.audioError'));
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
            audioRef.current.volume = 0;
            audioRef.current.muted = isMuted;
        }

        changeTrack();
        
        return () => {
            isCancelled = true;
            clearFadeInterval();
            if (audioRef.current) {
                fadeAudio('out', 500, () => {
                    if (audioRef.current) {
                        audioRef.current.src = "";
                    }
                });
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, civilizationName, isKidsMode]);
    
    const handleMuteToggle = () => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const newMutedState = !isMuted;
        
        // On first unmute, try to play if paused. This is a user interaction.
        if (audio.paused && newMutedState === false) {
             audio.play().catch(e => console.error("Could not play audio on unmute:", e));
        }

        audio.muted = newMutedState;
        track(newMutedState ? 'music_muted' : 'music_unmuted');
        setIsMuted(newMutedState);
    };

    const loadingMessage = t('ambientPlayer.findingMusic');

    return (
        <div className="fixed bottom-16 right-4 z-40 group">
            <button
                onClick={handleMuteToggle}
                className="w-12 h-12 bg-gray-800 bg-opacity-70 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[var(--color-accent)] hover:text-black transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                style={{
                  backgroundColor: 'var(--color-background-light)',
                  color: 'var(--color-foreground)'
                }}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-t-2 border-gray-400 border-t-yellow-300 rounded-full animate-spin"></div>
                ) : isMuted ? (
                    <VolumeOffIcon className="w-6 h-6" />
                ) : (
                    <VolumeUpIcon className="w-6 h-6" />
                )}
            </button>
             {isLoading && (
                <div className="absolute bottom-1/2 right-full mr-3 w-max translate-y-1/2 bg-[var(--color-background-light)] px-3 py-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-sm text-[var(--color-secondary)]">{loadingMessage}</p>
                </div>
            )}
        </div>
    );
};