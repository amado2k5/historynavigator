import { GoogleGenAI, Type } from "@google/genai";
import type { TimelineEvent, Character, Civilization, MapData, MusicParameters, SceneHotspot, VoiceDescription } from '../types.ts';

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
    const civilizations = [
        "The Age of Discovery", "The Age of Enlightenment", "The American Civil War", "The American Revolution",
        "Ancient China", "Ancient Egypt", "Ancient Greece", "Ancient Rome", "The Ashanti Empire", "The Assyrian Empire",
        "The Aztec Empire", "The British Empire", "The Byzantine Empire", "Canada", "The Carthaginian Empire", "The Celts", "Colonial America",
        "The Cold War", "The Delhi Sultanate", "The Dutch Empire", "Edo Period Japan", "Feudal Japan",
        "The French Colonial Empire", "The French Revolution", "The Ghana Empire", "The Goths and Vandals",
        "The Great Depression", "The Great Plague (The Black Death)", "Great Zimbabwe", "The Gupta Empire",
        "The Habsburg Monarchy", "The Hittite Empire", "The Holy Roman Empire", "The Inca Empire",
        "The Industrial Revolution", "The Indus Valley Civilization", "The Islamic Golden Age", "The Khmer Empire",
        "The Kievan Rus'", "The Kingdom of Kongo", "The Kingdom of Kush", "The Mali Empire", "The Mauryan Empire",
        "The Maya Civilization", "Mesopotamia", "The Minoan Civilization", "Modern Argentina", "Modern Australia",
        "Modern Brazil", "Modern China", "Modern Egypt", "Modern Ethiopia", "Modern France", "Modern Germany",
        "Modern India", "Modern Iran", "Modern Israel", "Modern Italy", "Modern Japan", "Modern Mexico",
        "Modern Nigeria", "Modern Palestine", "Modern Russia", "Modern South Africa", "Modern South Korea",
        "Modern Spain", "Modern Turkey", "Modern United Kingdom", "Modern Vietnam", "The Mongol Empire", "Morocco",
        "The Mughal Empire", "Mycenaean Greece", "The Napoleonic Wars", "The Olmec Civilization", "The Ottoman Empire",
        "The Persian Empire (Achaemenid)", "The Phoenicians", "The Polish-Lithuanian Commonwealth",
        "The Portuguese Empire", "The Protestant Reformation", "Qing Dynasty China", "The Renaissance",
        "The Roaring Twenties", "The Russian Empire", "Saudi Arabia", "The Scientific Revolution", "The Scythians",
        "The Songhai Empire", "The Song Dynasty", "The Spanish Empire", "The Srivijaya Empire", "The Tang Dynasty",
        "United States of America", "The Victorian Era", "The Viking Age", "World War I", "World War II",
        "The Zulu Kingdom"
    ];

    return Promise.resolve(civilizations.sort().map(name => ({ name })));
};


export const fetchCivilizationData = async (civilizationName: string, language: string, isKidsMode: boolean): Promise<Civilization> => {
    const prefix = getPromptPrefix(language, isKidsMode);

    // Step 1: Research the topic using Google Search grounding
    const researchPrompt = `${prefix} You are a historical research assistant. Your task is to gather comprehensive information about the topic: "${civilizationName}". The topic could be a person, an event, a place, a country, or a civilization. Find a general summary, a timeline of 8-12 major life or historical events with dates, key associated people/characters, major conflicts or wars, and significant cultural or societal topics related to it. Synthesize the information from your search results into a detailed text-only report.`;
    
    const researchResponse = await apiCallWithRetry(() => ai.models.generateContent({
       model: textModel,
       contents: researchPrompt,
       config: {
         tools: [{googleSearch: {}}],
       },
    }));

    const researchText = researchResponse.text;
    const sources = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;

    // Step 2: Structure the researched text into the required JSON format
    const structuringPrompt = `${prefix}Based on the following text, generate a comprehensive overview of "${civilizationName}". If the topic is a historical period, person, country, or event, treat it as a "civilization" for this context. Provide the data in the specified JSON format. The timeline should have between 8 and 12 major events. The summaries should be concise, 1-2 sentences. Ensure the 'name' field in the JSON is exactly "${civilizationName}".

    Here is the research text to use:
    ---
    ${researchText}
    ---
    `;

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
                        id: { type: Type.STRING, description: "A unique slug-like ID for the event, e.g., 'birth-of-da-vinci' or 'fall-of-rome'" },
                        date: { type: Type.STRING, description: "The date of the event, e.g., '1452 CE' or '753 BCE'" },
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                    },
                    required: ["id", "date", "title", "summary"]
                }
            },
            keyCharacters: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    },
                    required: ["name", "summary"]
                }
            },
            majorWars: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    },
                    required: ["name", "summary"]
                }
            },
            culturalTopics: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    },
                    required: ["name", "summary"]
                }
            }
        },
        required: ["name", "summary", "timeline", "keyCharacters", "majorWars", "culturalTopics"]
    };

    const civilizationData = await generateAndParseJson(structuringPrompt, schema);

    civilizationData.sources = sources;
    // Ensure the name is consistent, as the model might slightly alter it.
    civilizationData.name = civilizationName;

    return civilizationData;
};


export const fetchEventDetails = async (event: TimelineEvent, character: Character | null, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const perspective = character ? ` from the perspective of ${character.name}` : '';
    const prompt = `${prefix}Provide a detailed, narrative description of the historical event: "${event.title}" (${event.date}) within the context of ${civilizationName}${perspective}. The description should be a few paragraphs long and bring the event to life.`;

    const response = await apiCallWithRetry(() => ai.models.generateContent({
        model: textModel,
        contents: prompt,
    }));

    return response.text;
};

export const fetchCharacterDetails = async (characterName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Provide a detailed biography of ${characterName} from the context of ${civilizationName}. Focus on their historical significance and key life events. The response should be a few paragraphs long.`;
    const response = await apiCallWithRetry(() => ai.models.generateContent({ model: textModel, contents: prompt }));
    return response.text;
};

export const fetchWarDetails = async (warName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Describe the major events, key figures, and outcome of the ${warName}, a significant conflict within the context of ${civilizationName}. The response should be a few paragraphs long.`;
    const response = await apiCallWithRetry(() => ai.models.generateContent({ model: textModel, contents: prompt }));
    return response.text;
};

export const fetchTopicDetails = async (topicName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Explain the cultural topic of "${topicName}" within the context of ${civilizationName}. Discuss its importance and impact on their society. The response should be a few paragraphs long.`;
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
    
    const prompt = `${prefix}Generate a short, looping, silent video visualizing the historical event: "${event.title}" (${event.date}) for the context of ${civilizationName}${perspective}. Event summary: ${event.summary}.${kidModeStyle}`;

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
    const prompt = `${prefix}For the historical event "${event.title}" (${event.date}) in the context of ${civilizationName}, describe the geographical setting and identify 3-5 key points of interest relevant to the event. Provide the data in the specified JSON format. Descriptions should be concise.`;

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

export const fetchMusicDescription = async (event: TimelineEvent, civilizationName: string, isKidsMode: boolean): Promise<string> => {
    const kidModePrompt = isKidsMode
        ? "The music should be simple, cheerful, and light, like a classical piece for children (e.g., 'Peter and the Wolf'). Use major keys and a playful mood."
        : "The music should be instrumental, in a classical style that is evocative of the historical period. It should be emotionally resonant with the event, whether somber, majestic, tense, or celebratory.";

    const prompt = `
        Describe a short, looping piece of classical instrumental music for the historical event: "${event.title}" (${event.date}) from the context of ${civilizationName}.
        Event summary: ${event.summary}.
        ${kidModePrompt}
        The description should be a single paragraph. Specify the mood, tempo (e.g., slow, moderate, fast), a primary instrument (e.g., flute, violin, piano, harp), and a simple harmonic background (e.g., gentle string pads, sparse piano chords). Be creative and evocative. For example: "A slow, somber piece in a minor key, featuring a lonely cello melody over a bed of low, sustained string chords, reflecting the gravity of the event."
    `;
    const response = await apiCallWithRetry(() => ai.models.generateContent({ model: textModel, contents: prompt }));
    return response.text;
};

export const generateMusicParameters = async (musicDescription: string, isKidsMode: boolean): Promise<MusicParameters> => {
    const kidModePrompt = isKidsMode 
        ? "The music should be simple and cheerful. Use sine or triangle waves for a gentle sound. The harmony should be simple major chords."
        : "The music should be atmospheric and classical in style. Use oscillator types to mimic instruments (e.g., triangle for flute, sawtooth for strings, sine for a soft pad). Create a clear distinction between melody and harmony layers.";
    
    const prompt = `
        Based on the following classical music description, generate parameters for a procedural instrumental piece using the Web Audio API.
        Music Description: "${musicDescription}"
        Translate the description into synthesizer layers to create a short, looping piece of classical-style music.
        - Create a 'melody' layer using an oscillator. Give it a distinct frequency and oscillator type to represent the lead instrument. Use an LFO for vibrato if appropriate (e.g., for a 'violin' sound).
        - Create 2-3 'harmony' layers using oscillators to form simple chords or pads that support the melody. Their frequencies should be harmonically related (e.g., forming a major or minor triad).
        - Avoid using the 'noise' type unless specifically requested for a percussive effect.
        ${kidModePrompt}
        Provide the data in the specified JSON format.
        - Melodic frequencies should be between 200 and 1200 Hz.
        - Harmonic frequencies should be between 80 and 500 Hz.
        - LFO frequencies for vibrato should be between 4 and 8 Hz, with a small depth (2-10).
        - Gains should be very low, between 0.01 and 0.1, to keep the music subtle and ambient. The melody layer can have a slightly higher gain than the harmony layers.
        - Create 3 to 5 layers in total.
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
    const prompt = `${prefix}The user is searching for "${query}" within the context of the ${civilization.name}. Search through the provided timeline events, key characters, major wars, and cultural topics and return the most relevant results. Each result must include a 'type' field ('event', 'character', 'war', 'topic'). Return an empty array if no results are found. The context for the search is as follows: Timeline: ${JSON.stringify(civilization.timeline.map(e => ({id: e.id, title: e.title})))}, Characters: ${JSON.stringify(civilization.keyCharacters.map(c => c.name))}, Wars: ${JSON.stringify(civilization.majorWars.map(w => w.name))}, Topics: ${JSON.stringify(civilization.culturalTopics.map(t => t.name))}`;
    
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
        Based on the historical event "${event.title}" (${event.date}) in the context of ${civilizationName} (summary: ${event.summary}), imagine a visual scene.
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
    
    const prompt = `${prefix}You are ${hotspotName}, a character or object within a scene depicting the event "${event.title}" in the context of ${civilizationName}.
    A person is interacting with you. Respond with a single, short, first-person sentence. What might you say?
    ${kidModePrompt}
    Do not add quotation marks or any prefixes like your name. Just provide the sentence you would speak.`;
    
    const response = await apiCallWithRetry(() => ai.models.generateContent({
        model: textModel,
        contents: prompt,
    }));
    
    return response.text.trim();
};

export const fetchAIHistorianResponse = async (prompt: string, event: TimelineEvent, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const context = `The user is asking a question in the context of the event "${event.title}" (${event.date}) which is part of the history of ${civilizationName}.`;
    const fullPrompt = `${prefix} ${context} The user's question is: "${prompt}". Answer the question in a few paragraphs, as a helpful historian AI.`;
    
    const response = await apiCallWithRetry(() => ai.models.generateContent({
        model: textModel,
        contents: fullPrompt,
    }));
    
    return response.text;
};

export const fetchVoiceDescription = async (contextPrompt: string, language: string, isKidsMode: boolean): Promise<VoiceDescription> => {
    const kidModePrompt = isKidsMode
        ? "For kids mode, the voice should be friendly, clear, and engaging. Avoid very low pitches or very slow/fast rates."
        : "";

    const prompt = `
        Based on the following character or narrator description, define a suitable voice profile for text-to-speech.
        Description: "${contextPrompt}"
        The target language for speech is ${language}. The accentLanguage should be a BCP 47 language tag that best fits the description and the target language. For example, for English, you might choose 'en-US', 'en-GB', 'en-AU', etc., based on historical or geographical context. If no specific accent is relevant, default to a standard accent for the language (e.g., 'en-US' for English, 'fr-FR' for French).
        ${kidModePrompt}
        Provide the data in the specified JSON format.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            gender: { type: Type.STRING, enum: ['male', 'female', 'neutral'] },
            age: { type: Type.STRING, enum: ['child', 'young', 'middle-aged', 'elderly'] },
            pitch: { type: Type.STRING, enum: ['very low', 'low', 'medium', 'high', 'very high'] },
            rate: { type: Type.STRING, enum: ['very slow', 'slow', 'medium', 'fast', 'very fast'] },
            accentLanguage: { type: Type.STRING, description: "A BCP 47 language tag, e.g., en-US" }
        },
        required: ["gender", "age", "pitch", "rate", "accentLanguage"]
    };

    return await generateAndParseJson(prompt, schema);
};