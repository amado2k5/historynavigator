
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

export interface Civilization {
    name: string;
    summary: string;
    timeline: TimelineEvent[];
    keyCharacters: Character[];
    majorWars: War[];
    culturalTopics: Topic[];
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
