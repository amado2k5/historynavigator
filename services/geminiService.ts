import { GoogleGenAI, Type } from "@google/genai";
import type { TimelineEvent, Character, Civilization, MapData, MusicParameters, SceneHotspot } from '../types.ts';

// Guideline: Always use new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';

// FIX: Added a robust retry mechanism to handle API rate limiting (429 errors).
const MAX_RETRIES = 4;
const INITIAL_BACKOFF_MS = 1500;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A wrapper for API calls that implements exponential backoff for rate-limiting errors.
 * @param apiFn The async function to call.
 * @returns The result of the apiFn.
 */
const apiCallWithRetry = async <T>(apiFn: () => Promise<T>): Promise<T> => {
    let lastError: Error | null = null;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await apiFn();
        } catch (e: any) {
            lastError = e;
            // Check if the error message indicates a rate limit error (429)
            const errorMessage = e.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                if (i === MAX_RETRIES - 1) {
                    console.error(`API call failed after ${MAX_RETRIES} retries.`, e);
                    break; // Exit loop to throw the last error
                }
                const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, i);
                const jitter = Math.random() * 1000;
                const waitTime = Math.round(backoffTime + jitter);
                console.warn(`Rate limit exceeded. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${MAX_RETRIES})`);
                await sleep(waitTime);
            } else {
                // Not a rate limit error, rethrow immediately
                throw e;
            }
        }
    }
    throw lastError || new Error("API call failed after multiple retries.");
};


// A helper function to manage common prompt prefixes for kids mode and language
const getPromptPrefix = (language: string, isKidsMode: boolean): string => {
    let prefix = `Respond in ${language}. `;
    if (isKidsMode) {
        prefix += `The response should be simple, engaging, and suitable for a 5-year-old child. Use short sentences and a friendly, storytelling tone. `;
    }
    return prefix;
};

// A helper to parse JSON from the model, with retries.
const generateAndParseJson = async (prompt: string, schema: any) => {
    try {
        const response = await apiCallWithRetry(() => ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        }));
        
        // Guideline: Use response.text to get the output.
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to generate or parse JSON from Gemini:", e);
        // Fallback or retry logic could be implemented here
        throw new Error("The AI model returned an invalid response. Please try again.");
    }
};


export const fetchCivilizations = async (): Promise<{ name: string }[]> => {
    // This is a fixed list for the demo. In a real app, this might also come from an API.
    return Promise.resolve([
        { name: 'Ancient Rome' },
        { name: 'Ancient Egypt' },
        { name: 'The Aztec Empire' },
        { name: 'The Mongol Empire' },
        { name: 'Feudal Japan' },
        { name: 'The Viking Age' },
    ]);
};


export const fetchCivilizationData = async (civilizationName: string, language: string, isKidsMode: boolean): Promise<Civilization> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Generate a comprehensive overview of the ${civilizationName} civilization. Provide the data in the specified JSON format. The timeline should have between 8 and 12 major events. The summaries should be concise, 1-2 sentences.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            summary: { type: Type.STRING },
            timeline: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING, description: "A unique slug-like ID for the event, e.g., 'founding-of-rome'" },
                        date: { type: Type.STRING, description: "The date of the event, e.g., '753 BCE'" },
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                    }
                }
            },
            keyCharacters: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    }
                }
            },
            majorWars: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    }
                }
            },
            culturalTopics: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    }
                }
            }
        }
    };

    return await generateAndParseJson(prompt, schema);
};


export const fetchEventDetails = async (event: TimelineEvent, character: Character | null, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const perspective = character ? ` from the perspective of ${character.name}` : '';
    const prompt = `${prefix}Provide a detailed, narrative description of the historical event: "${event.title}" (${event.date}) within the ${civilizationName} civilization${perspective}. The description should be a few paragraphs long and bring the event to life.`;

    const response = await apiCallWithRetry(() => ai.models.generateContent({
        model: textModel,
        contents: prompt,
    }));

    return response.text;
};

export const fetchCharacterDetails = async (characterName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Provide a detailed biography of ${characterName} from the ${civilizationName} civilization. Focus on their historical significance and key life events. The response should be a few paragraphs long.`;
    const response = await apiCallWithRetry(() => ai.models.generateContent({ model: textModel, contents: prompt }));
    return response.text;
};

export const fetchWarDetails = async (warName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Describe the major events, key figures, and outcome of the ${warName}, a significant conflict for the ${civilizationName} civilization. The response should be a few paragraphs long.`;
    const response = await apiCallWithRetry(() => ai.models.generateContent({ model: textModel, contents: prompt }));
    return response.text;
};

export const fetchTopicDetails = async (topicName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Explain the cultural topic of "${topicName}" within the ${civilizationName} civilization. Discuss its importance and impact on their society. The response should be a few paragraphs long.`;
    const response = await apiCallWithRetry(() => ai.models.generateContent({ model: textModel, contents: prompt }));
    return response.text;
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> => {
    // Guideline: Use imagen-4.0-generate-001 for image generation
    const response = await apiCallWithRetry(() => ai.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    }));

    // Guideline: Access the image data this way
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// FIX: Added missing generateVideo function to resolve import error in VideoModal.tsx.
export const generateVideo = async (event: TimelineEvent, character: Character | null, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const perspective = character ? ` from the perspective of ${character.name}` : '';
    const kidModeStyle = isKidsMode ? ` The style should be a colorful and friendly animation, like a storybook illustration brought to life.` : ` The style should be cinematic, photorealistic, and historically evocative.`;
    
    const prompt = `${prefix}Generate a short, looping, silent video visualizing the historical event: "${event.title}" (${event.date}) for the ${civilizationName} civilization${perspective}. Event summary: ${event.summary}.${kidModeStyle}`;

    const videoModel = 'veo-2.0-generate-001';

    let operation = await apiCallWithRetry(() => ai.models.generateVideos({
        model: videoModel,
        prompt: prompt,
        config: {
            numberOfVideos: 1
        }
    }));

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await apiCallWithRetry(() => ai.operations.getVideosOperation({ operation: operation }));
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation failed: no download link provided.");
    }

    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateMapData = async (event: TimelineEvent, civilizationName: string, language: string, isKidsMode: boolean): Promise<MapData> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}For the historical event "${event.title}" (${event.date}) in the ${civilizationName} civilization, describe the geographical setting and identify 3-5 key points of interest relevant to the event. Provide the data in the specified JSON format. Descriptions should be concise.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            mapDescription: { 
                type: Type.STRING,
                description: "A brief, one-sentence description of the overall geographical area."
            },
            pointsOfInterest: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING, description: "A one or two-sentence description of the location's significance to the event." }
                    }
                }
            }
        }
    };
    return await generateAndParseJson(prompt, schema);
};

export const fetchSoundscapeDescription = async (event: TimelineEvent, civilizationName: string, isKidsMode: boolean): Promise<string> => {
    const kidModePrompt = isKidsMode
        ? "The soundscape should be magical, friendly, and simple, with happy sounds and a gentle, cheerful musical mood. Avoid anything scary or intense."
        : "The soundscape should be realistic, immersive, and historically evocative. Capture the authentic atmosphere.";

    const prompt = `
        Describe a detailed soundscape for the historical event: "${event.title}" (${event.date}) from the ${civilizationName} civilization.
        Event summary: ${event.summary}.
        ${kidModePrompt}
        The description should be a single paragraph. Include the types of ambient noises (e.g., wind, marketplace chatter), specific sounds (e.g., blacksmith hammer, distant chanting), and the overall musical mood (e.g., tense, somber, celebratory, mysterious). Be creative and evocative.
    `;
    const response = await apiCallWithRetry(() => ai.models.generateContent({ model: textModel, contents: prompt }));
    return response.text;
};

export const generateMusicParameters = async (soundscapeDescription: string, isKidsMode: boolean): Promise<MusicParameters> => {
    const kidModePrompt = isKidsMode 
        ? "The sound should be simple, cheerful, and magical, suitable for children. Use major keys and simple oscillator waves like sine or triangle."
        : "The sound should be atmospheric, ambient, and reflect the mood of the event. Use a mix of oscillators and filtered noise to create a rich texture.";
    
    const prompt = `
        Based on the following soundscape description, generate parameters for a procedural ambient soundscape using the Web Audio API.
        Soundscape Description: "${soundscapeDescription}"
        Translate the description into synthesizer layers. For example, 'wind' could be filtered white or brown noise, 'chanting' could be a low-frequency sine wave with an LFO, and a 'blacksmith hammer' could be a sharp, percussive noise burst. The musical elements should match the described mood.
        ${kidModePrompt}
        Provide the data in the specified JSON format.
        - Frequencies should be between 50 and 800 Hz.
        - LFO frequencies should be between 0.1 and 8 Hz.
        - LFO depths should be between 5 and 50.
        - Gains should be very low, between 0.01 and 0.15, to keep the music ambient.
        - Create 3 to 5 layers to build a rich soundscape.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            layers: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['oscillator', 'noise'] },
                        oscillatorType: { type: Type.STRING, enum: ['sine', 'square', 'sawtooth', 'triangle'], description: "Required if type is 'oscillator'" },
                        frequency: { type: Type.NUMBER, description: "Required if type is 'oscillator'" },
                        gain: { type: Type.NUMBER },
                        lfo: {
                            type: Type.OBJECT,
                            properties: {
                                frequency: { type: Type.NUMBER },
                                depth: { type: Type.NUMBER },
                            }
                        },
                        filter: {
                           type: Type.OBJECT,
                           properties: {
                               type: { type: Type.STRING, enum: ['lowpass', 'highpass', 'bandpass'] },
                               frequency: { type: Type.NUMBER },
                           }
                        }
                    }
                }
            }
        }
    };
    return await generateAndParseJson(prompt, schema);
};

export const globalSearch = async (query: string, civilization: Civilization, language: string, isKidsMode: boolean): Promise<any[]> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}The user is searching for "${query}" within the context of the ${civilization.name} civilization. Search through the provided timeline events, key characters, major wars, and cultural topics and return the most relevant results. Each result must include a 'type' field ('event', 'character', 'war', 'topic'). Return an empty array if no results are found. The context for the search is as follows: Timeline: ${JSON.stringify(civilization.timeline.map(e => ({id: e.id, title: e.title})))}, Characters: ${JSON.stringify(civilization.keyCharacters.map(c => c.name))}, Wars: ${JSON.stringify(civilization.majorWars.map(w => w.name))}, Topics: ${JSON.stringify(civilization.culturalTopics.map(t => t.name))}`;
    
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['event', 'character', 'war', 'topic'] },
                id: { type: Type.STRING, description: "The ID of the event, if applicable" },
                name: { type: Type.STRING, description: "The name of the character, war, or topic" },
                title: { type: Type.STRING, description: "The title of the event" },
                summary: { type: Type.STRING, description: "A brief summary of the item." },
            }
        }
    };

    return await generateAndParseJson(prompt, schema);
};

export const fetchSceneHotspots = async (event: TimelineEvent, civilizationName: string, isKidsMode: boolean): Promise<SceneHotspot[]> => {
    const kidModePrompt = isKidsMode ? "The points of interest should be simple and fun, like 'a friendly soldier' or 'a busy market stall'." : "The points of interest should be historically relevant characters or significant objects/locations in the scene.";

    const prompt = `
        Based on the historical event "${event.title}" (${event.date}) in the ${civilizationName} civilization (summary: ${event.summary}), imagine a visual scene.
        Identify 3 to 4 distinct, interactive points of interest or characters within this scene.
        ${kidModePrompt}
        For each point, provide a name, a brief one-sentence description, and an approximate position.
        Valid positions are: 'top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'.
        Provide the data in the specified JSON format.
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                position: { type: Type.STRING, enum: ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] },
            }
        }
    };
    return await generateAndParseJson(prompt, schema);
};

export const fetchHotspotDialogue = async (hotspotName: string, event: TimelineEvent, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const kidModePrompt = isKidsMode ? "Your tone should be very simple, friendly, and engaging for a 5-year-old child." : "Your tone should be authentic to your character and the historical period.";
    
    const prompt = `${prefix}You are ${hotspotName}, a character or object within a scene depicting the event "${event.title}" in the ${civilizationName} civilization.
    A person is interacting with you. Respond with a single, short, first-person sentence. What might you say?
    ${kidModePrompt}
    Do not add quotation marks or any prefixes like your name. Just provide the sentence you would speak.`;
    
    const response = await apiCallWithRetry(() => ai.models.generateContent({
        model: textModel,
        contents: prompt,
    }));
    
    return response.text.trim();
};