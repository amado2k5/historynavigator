import React, { useState, useEffect, useRef } from 'react';
// FIX: Added .ts extension to the import path.
import type { TimelineEvent, MusicParameters, MusicLayer } from '../types.ts';
// FIX: Added .ts extension to the import path.
import { generateMusicParameters } from '../services/geminiService.ts';
// FIX: Added .tsx extension to the import path.
import { VolumeUpIcon, VolumeOffIcon } from './Icons.tsx';

interface AmbientMusicPlayerProps {
    event: TimelineEvent;
    civilizationName: string;
    isKidsMode: boolean;
}

type AudioSource = OscillatorNode | AudioBufferSourceNode;

export const AmbientMusicPlayer: React.FC<AmbientMusicPlayerProps> = ({ event, civilizationName, isKidsMode }) => {
    const [isMuted, setIsMuted] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const activeSourcesRef = useRef<AudioSource[]>([]);

    const FADE_TIME = 1.5; // seconds for fade in/out
    const MAX_GAIN = 0.1; // Max volume to keep it subtle

    // Function to stop all current sounds with a fade-out
    const stopCurrentSound = async () => {
        if (masterGainRef.current && audioContextRef.current) {
            masterGainRef.current.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + FADE_TIME);
            await new Promise(resolve => setTimeout(resolve, FADE_TIME * 1000));
            
            activeSourcesRef.current.forEach(source => {
                source.stop();
                source.disconnect();
            });
            activeSourcesRef.current = [];
        }
    };
    
    // Function to create and play a new soundscape
    const playNewSound = (params: MusicParameters) => {
        if (!audioContextRef.current || !masterGainRef.current) return;
        
        const ac = audioContextRef.current;
        const masterGain = masterGainRef.current;
        
        const newSources: AudioSource[] = [];

        // Helper to validate numbers and provide fallbacks
        const validate = (value: any, fallback: number): number => {
            return typeof value === 'number' && isFinite(value) ? value : fallback;
        };

        params.layers.forEach(layer => {
            if (layer.type === 'oscillator') {
                const osc = ac.createOscillator();
                const gainNode = ac.createGain();
                
                osc.type = layer.oscillatorType;
                osc.frequency.setValueAtTime(validate(layer.frequency, 440), ac.currentTime);
                gainNode.gain.setValueAtTime(validate(layer.gain, 0.1), ac.currentTime);
                
                if(layer.lfo) {
                    const lfo = ac.createOscillator();
                    const lfoGain = ac.createGain();
                    lfo.frequency.setValueAtTime(validate(layer.lfo.frequency, 5), ac.currentTime);
                    lfoGain.gain.setValueAtTime(validate(layer.lfo.depth, 20), ac.currentTime);
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);
                    lfo.start();
                    newSources.push(lfo);
                }

                osc.connect(gainNode);
                gainNode.connect(masterGain);
                osc.start();
                newSources.push(osc);
            } else if (layer.type === 'noise') {
                const bufferSize = 2 * ac.sampleRate;
                const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
                const output = buffer.getChannelData(0);
                // Simple brown noise generation
                let lastOut = 0.0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    output[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = output[i];
                    output[i] *= 3.5; // (roughly) compensate for gain
                }

                const noiseSource = ac.createBufferSource();
                noiseSource.buffer = buffer;
                noiseSource.loop = true;
                
                const gainNode = ac.createGain();
                gainNode.gain.setValueAtTime(validate(layer.gain, 0.05), ac.currentTime);

                let connectionNode: AudioNode = gainNode;

                if(layer.filter) {
                    const filter = ac.createBiquadFilter();
                    filter.type = layer.filter.type;
                    filter.frequency.setValueAtTime(validate(layer.filter.frequency, 1000), ac.currentTime);
                    gainNode.connect(filter);
                    connectionNode = filter;
                }

                noiseSource.connect(gainNode);
                connectionNode.connect(masterGain);
                noiseSource.start();
                newSources.push(noiseSource);
            }
        });
        
        activeSourcesRef.current = newSources;

        if (!isMuted) {
            masterGain.gain.exponentialRampToValueAtTime(MAX_GAIN, ac.currentTime + FADE_TIME);
        }
    };
    
    // Main effect to generate and play music on event change
    useEffect(() => {
        const initializeAndPlay = async () => {
            if (!audioContextRef.current) {
                 audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                 masterGainRef.current = audioContextRef.current.createGain();
                 masterGainRef.current.connect(audioContextRef.current.destination);
                 masterGainRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
            }
            
            setIsLoading(true);
            setError(null);

            await stopCurrentSound();
            
            try {
                const params = await generateMusicParameters(event, civilizationName, isKidsMode);
                playNewSound(params);
            } catch(err) {
                console.error("Failed to generate music parameters:", err);
                setError("Could not generate soundscape.");
            } finally {
                setIsLoading(false);
            }
        };

        initializeAndPlay();
        
        // Cleanup on unmount
        return () => {
            stopCurrentSound();
        };
    }, [event, civilizationName, isKidsMode]);
    
    // Effect for handling mute/unmute
    useEffect(() => {
        if (masterGainRef.current && audioContextRef.current) {
            if (isMuted) {
                masterGainRef.current.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.5);
            } else {
                 masterGainRef.current.gain.exponentialRampToValueAtTime(MAX_GAIN, audioContextRef.current.currentTime + 1);
            }
        }
    }, [isMuted]);

    const handleMuteToggle = () => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setIsMuted(!isMuted);
    };

    return (
        <div className="fixed bottom-16 right-4 z-40">
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
        </div>
    );
};