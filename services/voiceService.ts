import type { VoiceDescription } from '../types.ts';

let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

// Load voices. This is async and can be tricky.
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
        if (voicesLoaded && voices.length > 0) {
            resolve(voices);
            return;
        }

        const fetchedVoices = window.speechSynthesis.getVoices();
        if (fetchedVoices.length > 0) {
            voices = fetchedVoices;
            voicesLoaded = true;
            resolve(voices);
            return;
        }

        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            voicesLoaded = true;
            resolve(voices);
        };
    });
};


// Mappings from descriptive terms to numeric values for Web Speech API
const pitchMap: Record<VoiceDescription['pitch'], number> = {
    'very low': 0.6,
    'low': 0.8,
    'medium': 1.0,
    'high': 1.2,
    'very high': 1.4,
};

const rateMap: Record<VoiceDescription['rate'], number> = {
    'very slow': 0.7,
    'slow': 0.9,
    'medium': 1.0,
    'fast': 1.2,
    'very fast': 1.5,
};

// Heuristic to guess gender from voice name
const getVoiceGender = (voice: SpeechSynthesisVoice): 'male' | 'female' | 'neutral' => {
    const name = voice.name.toLowerCase();
    const maleKeywords = ['male', 'david', 'mark', 'zira', 'guy', 'james', 'alex'];
    const femaleKeywords = ['female', 'susan', 'hazel', 'linda', 'woman', 'girl', 'kate', 'serena'];

    if (maleKeywords.some(kw => name.includes(kw))) return 'male';
    if (femaleKeywords.some(kw => name.includes(kw))) return 'female';
    return 'neutral';
}

const selectVoice = (availableVoices: SpeechSynthesisVoice[], description: VoiceDescription): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;
    
    // Score voices based on how well they match the description
    const scoredVoices = availableVoices.map(voice => {
        let score = 0;
        // 1. Perfect language and accent match (e.g., 'en-US' == 'en-US')
        if (voice.lang.toLowerCase() === description.accentLanguage.toLowerCase()) {
            score += 10;
        } 
        // 2. Base language match (e.g., 'en-GB' starts with 'en')
        else if (voice.lang.toLowerCase().startsWith(description.accentLanguage.toLowerCase().split('-')[0])) {
            score += 5;
        }

        // 3. Gender match (heuristic)
        const voiceGender = getVoiceGender(voice);
        if (description.gender !== 'neutral' && voiceGender === description.gender) {
            score += 3;
        }
        
        // 4. Prefer local voices
        if (voice.localService) {
            score += 1;
        }

        return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);

    return scoredVoices[0].score > 0 ? scoredVoices[0].voice : (availableVoices[0] || null);
};


export const speak = async (
    text: string, 
    description: VoiceDescription | null,
    callbacks?: { onend?: () => void, onerror?: (e: SpeechSynthesisErrorEvent) => void }
): Promise<SpeechSynthesisUtterance | null> => {
    
    if (!description) {
        console.warn("Speak called without a voice description.");
        return null;
    }

    const availableVoices = await loadVoices();
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    const selectedVoice = selectVoice(availableVoices, description);
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.pitch = pitchMap[description.pitch] ?? 1.0;
    utterance.rate = rateMap[description.rate] ?? 1.0;
    
    if (callbacks?.onend) utterance.onend = callbacks.onend;
    if (callbacks?.onerror) utterance.onerror = callbacks.onerror;

    window.speechSynthesis.speak(utterance);
    
    return utterance;
};

export const cancelSpeech = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
};