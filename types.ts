export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    summary: string;
    location?: string;
}

export interface Character {
    name: string;
    summary: string;
}

export interface War {
    name: string;
    summary: string;
}

export interface Topic {
    name: string;
    summary: string;
}

export interface GroundingSource {
    web?: {
        uri: string;
        title: string;
    };
}

export interface Civilization {
    name:string;
    summary: string;
    timeline: TimelineEvent[];
    keyCharacters: Character[];
    majorWars: War[];
    culturalTopics: Topic[];
    sources?: GroundingSource[];
}

export interface MapData {
    mapDescription: string;
    pointsOfInterest: {
        name: string;
        description: string;
    }[];
}

// For AmbientMusicPlayer
export interface LFO {
    frequency: number;
    depth: number;
}

export type OscillatorLayer = {
    type: 'oscillator';
    oscillatorType: OscillatorType;
    frequency: number;
    gain: number;
    lfo?: LFO;
};

export type NoiseLayer = {
    type: 'noise';
    gain: number;
    filter?: {
        type: BiquadFilterType;
        frequency: number;
    };
};

export type MusicLayer = OscillatorLayer | NoiseLayer;

export interface MusicParameters {
    layers: MusicLayer[];
}

// For 3D View
export interface SceneHotspot {
    name: string;
    description: string;
    position: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface Hotspot {
    name: string;
    description: string;
    positionCoords: {
        x: number;
        y: number;
    };
}

// For Text-to-Speech
export interface VoiceDescription {
    gender: 'male' | 'female' | 'neutral';
    age: 'child' | 'young' | 'middle-aged' | 'elderly';
    pitch: 'very low' | 'low' | 'medium' | 'high' | 'very high';
    rate: 'very slow' | 'slow' | 'medium' | 'fast' | 'very fast';
    accentLanguage: string; // BCP 47 language tag like 'en-US'
}

// For Authentication and Favorites
export interface User {
    name: string;
    avatar: string; // URL or identifier for the avatar icon
    provider: string;
}

export interface Favorite {
    civilizationName: string;
    type: 'event' | 'character' | 'war' | 'topic';
    // For events, this is the event.id. For others, it's the item.name.
    id: string; 
    // This is the display name, e.g., event.title or item.name.
    name: string; 
}

// For Share History
export interface Share {
    url: string;
    title: string;
    text: string;
    timestamp: string;
}

// For Telemetry
export interface TelemetryContext {
    user: User | null;
    civilization: Civilization | null;
    currentEvent: TimelineEvent | null;
    viewMode: '2D' | '3D';
    language: string;
    isKidsMode: boolean;
}