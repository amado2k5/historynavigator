import { GoogleGenAI, Type } from "@google/genai";
// FIX: Added VoiceDescription to the type import.
import type { TimelineEvent, Character, Civilization, MapData, SceneHotspot, VoiceDescription } from '../types.ts';
import { withCache } from './cacheService.ts';

// Guideline: Always use new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';

// FIX: Added a robust retry mechanism to handle API rate limiting (429 errors).
const MAX_RETRIES = 4;
const INITIAL_BACKOFF_MS = 1500;

// --- Anti-Abuse and Security Measures ---

const rateLimitMap = new Map<string, number>();
/**
 * Checks if a specific action is rate-limited.
 * @param key A unique identifier for the action.
 * @param limitMs The cooldown period in milliseconds.
 * @returns True if the action is blocked, false otherwise.
 */
function isRateLimited(key: string, limitMs: number): boolean {
    const now = Date.now();
    const lastCall = rateLimitMap.get(key) || 0;
    if (now - lastCall < limitMs) {
        console.warn(`Rate limit exceeded for key: ${key}. Try again later.`);
        return true; // Exceeded
    }
    rateLimitMap.set(key, now);
    return false; // Not exceeded
}

const PROMPT_INJECTION_KEYWORDS = /ignore|disregard|forget|system prompt|api key|instruction|developer mode|confidential|secret|internal|hack|hijack|override|security prompt/gi;
const MAX_INPUT_LENGTH = 500;
/**
 * Sanitizes user input to prevent prompt injection and oversized requests.
 * @param input The raw user input string.
 * @returns A sanitized string.
 */
function sanitizeInput(input: string): string {
    // 1. Truncate to a reasonable length
    let sanitized = input.slice(0, MAX_INPUT_LENGTH);
    
    // 2. Remove keywords associated with prompt injection
    const originalLength = sanitized.length;
    sanitized = sanitized.replace(PROMPT_INJECTION_KEYWORDS, '[removed]');
    
    if (sanitized.length !== originalLength) {
        console.warn("Potential prompt injection keywords detected and sanitized from input:", input);
    }
    
    return sanitized;
}


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

/**
 * Generates text using the standard model, with a fallback to Google Search grounding on failure.
 * @param prompt The prompt for the AI.
 * @returns The generated text.
 */
const generateTextWithFallback = async (prompt: string): Promise<string> => {
    try {
        // First attempt: standard generation
        const response = await apiCallWithRetry(() => ai.models.generateContent({
            model: textModel,
            contents: prompt,
        }));
        return response.text;
    } catch (e) {
        console.warn(`Standard text generation failed. Attempting fallback with Google Search.`, e);
        try {
            // Fallback attempt: use Google Search
            const fallbackPrompt = `Using information from a web search, please answer the following prompt. If you can find relevant information, synthesize it into a coherent response. If not, state that you could not find information on the topic.\n\nPrompt: "${prompt}"`;
            const response = await apiCallWithRetry(() => ai.models.generateContent({
                model: textModel,
                contents: fallbackPrompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            }));
            return response.text;
        } catch (fallbackError) {
            console.error(`Fallback text generation with web search also failed.`, fallbackError);
            throw fallbackError; // Re-throw the final error
        }
    }
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

const fixedCivilizationList = [
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
const fixedCivilizationsLowercase = fixedCivilizationList.map(name => name.toLowerCase());

export const fetchCivilizations = async (): Promise<{ name: string }[]> => {
    return Promise.resolve(fixedCivilizationList.sort().map(name => ({ name })));
};

export const fetchTopicCategory = async (topicName: string): Promise<string> => {
    const sanitizedName = sanitizeInput(topicName);
    return withCache(['topicCategory', sanitizedName], async () => {
        if (isRateLimited('fetchCategory', 1000)) { // 1 sec cooldown
            return sanitizedName; // fallback to the name itself
        }
        const prompt = `Classify the topic "${sanitizedName}" into a concise, title-cased category. Examples: "Civilization", "Public Figure", "Location", "Historical Event", "Technology", "Organization", "Art", "Concept". If a specific category is not obvious or it's a product/brand, respond with just the topic name itself, title-cased. Your response should be the category name ONLY. Do not add any explanation.`;
        
        try {
            const response = await ai.models.generateContent({
                model: textModel,
                contents: prompt,
            });
            let category = response.text.trim().replace(/["'.]/g, '');
            // Title case it for consistency
            category = category.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
            return category;
        } catch (e) {
            console.warn(`Could not fetch category for "${sanitizedName}", falling back to topic name.`);
            return sanitizedName; // Fallback
        }
    });
};


export const fetchCivilizationData = async (civilizationName: string, language: string, isKidsMode: boolean): Promise<Civilization> => {
    const sanitizedName = sanitizeInput(civilizationName);
    
    return withCache(['civilizationData', sanitizedName, language, isKidsMode], async () => {
        // Apply rate limiting for dynamic, user-generated searches that are not in the fixed list
        const isDynamicSearch = !fixedCivilizationsLowercase.includes(sanitizedName.toLowerCase());
        if (isDynamicSearch) {
            if (isRateLimited('dynamicSearch', 5000)) { // 5-second cooldown for dynamic searches
                throw new Error('You are searching too quickly. Please wait a moment before trying again.');
            }
        }

        const prefix = getPromptPrefix(language, isKidsMode);

        // Step 1: Research the topic using Google Search grounding
        const researchPrompt = `${prefix} You are a historical research assistant. Your task is to gather comprehensive information about the topic: "${sanitizedName}". The topic could be a person, an event, a place, a country, or a civilization. Find a general summary, a timeline of 8-12 major life or historical events with dates, key associated people/characters, major conflicts or wars, and significant cultural or societal topics related to it. Synthesize the information from your search results into a detailed text-only report.`;
        
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
        const structuringPrompt = `${prefix}Based on the following text, generate a comprehensive overview of "${sanitizedName}". If the topic is a historical period, person, country, or event, treat it as a "civilization" for this context. Provide the data in the specified JSON format. The timeline should have between 8 and 12 major events. The summaries should be concise, 1-2 sentences. Ensure the 'name' field in the JSON is exactly "${sanitizedName}".

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
        civilizationData.name = sanitizedName;

        return civilizationData;
    });
};


export const fetchEventDetails = async (event: TimelineEvent, character: Character | null, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    return withCache(['eventDetails', event.id, character?.name, civilizationName, language, isKidsMode], () => {
        const prefix = getPromptPrefix(language, isKidsMode);
        const perspective = character ? ` from the perspective of ${character.name}` : '';
        const prompt = `${prefix}Provide a detailed, narrative description of the historical event: "${event.title}" (${event.date}) within the context of ${civilizationName}${perspective}. The description should be a few paragraphs long and bring the event to life.`;
        return generateTextWithFallback(prompt);
    });
};

export const fetchCharacterDetails = async (characterName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    return withCache(['characterDetails', characterName, civilizationName, language, isKidsMode], () => {
        const prefix = getPromptPrefix(language, isKidsMode);
        const prompt = `${prefix}Provide a detailed biography of ${characterName} from the context of ${civilizationName}. Focus on their historical significance and key life events. The response should be a few paragraphs long.`;
        return generateTextWithFallback(prompt);
    });
};

export const fetchWarDetails = async (warName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    return withCache(['warDetails', warName, civilizationName, language, isKidsMode], () => {
        const prefix = getPromptPrefix(language, isKidsMode);
        const prompt = `${prefix}Describe the major events, key figures, and outcome of the ${warName}, a significant conflict within the context of ${civilizationName}. The response should be a few paragraphs long.`;
        return generateTextWithFallback(prompt);
    });
};

export const fetchTopicDetails = async (topicName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    return withCache(['topicDetails', topicName, civilizationName, language, isKidsMode], () => {
        const prefix = getPromptPrefix(language, isKidsMode);
        const prompt = `${prefix}Explain the cultural topic of "${topicName}" within the context of ${civilizationName}. Discuss its importance and impact on their society. The response should be a few paragraphs long.`;
        return generateTextWithFallback(prompt);
    });
};

export const findAmbientMusicOnWeb = async (event: TimelineEvent, civilizationName: string, isKidsMode: boolean): Promise<string | null> => {
    return withCache(['ambientMusic', event.id, civilizationName, isKidsMode], async () => {
        const kidStyle = isKidsMode ? "happy, playful, and simple instrumental" : "atmospheric, cinematic, and emotional";
        const prompt = `Find a direct URL to a publicly accessible, royalty-free audio file (.mp3, .wav, .ogg) for ambient background music. 
        The music should be suitable for the historical event: "${event.title}" (${event.date}) from ${civilizationName}.
        The overall mood should be related to this summary: "${event.summary}".
        The style should be ${kidStyle}.
        Prioritize instrumental music.
        Prioritize sources like Pixabay, Free Music Archive, or Wikimedia Commons that allow direct linking.
        Respond with ONLY the raw URL and nothing else. If no suitable URL is found, respond with "null".
        Example response: https://cdn.pixabay.com/audio/some-file.mp3
        `;

        try {
            const response = await apiCallWithRetry(() => ai.models.generateContent({
                model: textModel,
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            }));

            const responseText = response.text.trim();
            if (responseText.toLowerCase() === 'null' || !responseText.startsWith('http')) {
                console.warn(`Could not find an ambient music URL for "${event.title}". Response: ${responseText}`);
                return null;
            }

            // Basic validation for an audio URL
            const urlRegex = /(https?:\/\/[^\s"'`)]+\.(?:mp3|wav|ogg|m4a))/i;
            const match = responseText.match(urlRegex);

            if (match && match[0]) {
                console.log(`Found ambient music URL: ${match[0]}`);
                return match[0];
            } else {
                 console.warn(`Response did not contain a valid audio URL: ${responseText}`);
                 return null;
            }
        } catch (error) {
            console.error(`Error finding ambient music for "${event.title}":`, error);
            return null; // Return null on error to fail gracefully
        }
    });
};

// FIX: Added generateAudioScript function for audio modal narration.
export const generateAudioScript = async (event: TimelineEvent, character: Character | null, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    return withCache(['audioScript', event.id, character?.name, civilizationName, language, isKidsMode], () => {
        const prefix = getPromptPrefix(language, isKidsMode);
        const perspective = character ? ` from the first-person perspective of ${character.name}` : ` from the perspective of a historical narrator`;
        const prompt = `${prefix}Create a short, engaging audio narration script (2-3 paragraphs) for the event: "${event.title}" (${event.date}) within the context of ${civilizationName}. The script should be written ${perspective}. It should be vivid and descriptive, suitable for being read aloud.`;
        return generateTextWithFallback(prompt);
    });
};

// FIX: Added fetchVoiceDescription function for audio modal narration.
export const fetchVoiceDescription = async (context: string, language: string, isKidsMode: boolean): Promise<VoiceDescription> => {
    return withCache(['voiceDescription', context, language, isKidsMode], () => {
        const kidModePrompt = isKidsMode ? `The voice should be friendly, warm, and expressive, suitable for a child. A medium pitch and rate is preferred.` : `The voice should match the historical context. It could be serious, scholarly, or dramatic as appropriate.`;
        const prompt = `Based on the context "${context}", describe the ideal voice for a narration.
        ${kidModePrompt}
        - The language code for ${language} must be used for the accent. For example, for English, use "en-US"; for Spanish, use "es-ES".
        - Choose a suitable gender, pitch, and rate.
        Provide the data in the specified JSON format.
        `;
        const schema = {
            type: Type.OBJECT,
            properties: {
                pitch: { type: Type.STRING, enum: ['very low', 'low', 'medium', 'high', 'very high'] },
                rate: { type: Type.STRING, enum: ['very slow', 'slow', 'medium', 'fast', 'very fast'] },
                accentLanguage: { type: Type.STRING, description: "An IETF language tag, e.g., 'en-US', 'fr-FR'" },
                gender: { type: Type.STRING, enum: ['male', 'female', 'neutral'] },
            },
            required: ['pitch', 'rate', 'accentLanguage', 'gender']
        };
        return generateAndParseJson(prompt, schema);
    });
};

export const findImageOnWeb = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> => {
    // Note: aspectRatio is no longer directly used but kept for signature compatibility to minimize changes in calling components.
    return withCache(['webImage', prompt], async () => {
        console.log(`Searching for image on the web for prompt: "${prompt}"`);
        
        const MAX_FALLBACK_ATTEMPTS = 2;
        for (let i = 0; i < MAX_FALLBACK_ATTEMPTS; i++) {
            try {
                const attemptSuffix = i > 0 ? ` Please provide a different image source than before.` : '';
                const webSearchPrompt = `Find a URL for a professional, high-quality, non-AI-generated, photorealistic stock photo that visually represents: "${prompt}". The image must be from a source that allows direct hotlinking (e.g., Wikipedia, Wikimedia Commons, Pexels, Unsplash) and have a public domain or Creative Commons license. The image must be directly usable as a 'src' in an <img> tag without causing CORS or 403 Forbidden errors. Do not return results from sites that use watermarks (like Shutterstock previews, Getty, etc.) or require logins. Respond with ONLY the raw, direct image URL and nothing else.${attemptSuffix}`;
                
                const response = await apiCallWithRetry(() => ai.models.generateContent({
                    model: textModel,
                    contents: webSearchPrompt,
                    config: {
                        tools: [{ googleSearch: {} }],
                    },
                }));

                const responseText = response.text.trim();
                const urlRegex = /(https?:\/\/[^\s"'`)]+\.(?:jpg|jpeg|png|gif|webp))/i;
                const match = responseText.match(urlRegex);
                
                if (match && match[0]) {
                    const imageUrl = match[0];
                    console.log(`Web image found (Attempt ${i + 1}): ${imageUrl}`);
                    return imageUrl;
                } else {
                    console.warn(`Web search attempt ${i + 1} did not return a valid image URL. Response: "${responseText}"`);
                }
            } catch (searchError) {
                console.error(`Web image search attempt ${i + 1} failed with an error.`, searchError);
                if (i === MAX_FALLBACK_ATTEMPTS - 1) {
                    throw searchError;
                }
            }
        }
        throw new Error("All web search attempts failed to produce a valid image URL.");
    });
};


// FIX: Added generateVideo function to resolve missing export error.
export const generateVideo = async (event: TimelineEvent, character: Character | null, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    return withCache(['video', event.id, character?.name, civilizationName, language, isKidsMode], async () => {
        const prefix = getPromptPrefix(language, isKidsMode);
        const perspective = character ? ` from the perspective of ${character.name}` : '';
        const kidModeStyle = isKidsMode
            ? `The video should be a simple, friendly, and colorful animated cartoon suitable for children.`
            : `The video should be a cinematic, photorealistic depiction of the event.`;

        const prompt = `${prefix}Create a short video (around 15 seconds) about the historical event: "${event.title}" (${event.date}) within the context of ${civilizationName}${perspective}. Event summary: ${event.summary}. ${kidModeStyle}`;

        let operation = await apiCallWithRetry(() => ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1
            }
        }));

        while (!operation.done) {
            await sleep(10000); // Polling every 10 seconds
            operation = await apiCallWithRetry(() => ai.operations.getVideosOperation({ operation: operation }));
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was provided.");
        }

        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video file: ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    });
};

export const generateMapData = async (event: TimelineEvent, civilizationName: string, language: string, isKidsMode: boolean): Promise<MapData> => {
    return withCache(['mapData', event.id, civilizationName, language, isKidsMode], () => {
        const prefix = getPromptPrefix(language, isKidsMode);
        const prompt = `${prefix}For the historical event "${event.title}" (${event.date}) in ${civilizationName}, determine its central geographic coordinates (latitude and longitude). Also identify 3-5 key points of interest with their coordinates. Provide the data in the specified JSON format. Descriptions must be concise.`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                mapDescription: { 
                    type: Type.STRING,
                    description: "A brief, one-sentence description of the overall geographical area."
                },
                centerCoordinates: {
                    type: Type.OBJECT,
                    properties: {
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER }
                    }
                },
                pointsOfInterest: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING, description: "A one or two-sentence description of the location's significance." },
                            coordinates: {
                                type: Type.OBJECT,
                                properties: {
                                    lat: { type: Type.NUMBER },
                                    lng: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
            },
            required: ["mapDescription", "centerCoordinates", "pointsOfInterest"]
        };
        return generateAndParseJson(prompt, schema);
    });
};

export const globalSearch = async (query: string, civilization: Civilization, language: string, isKidsMode: boolean): Promise<any[]> => {
    return withCache(['globalSearch', query, civilization.name, language, isKidsMode], () => {
        const sanitizedQuery = sanitizeInput(query);
        const prefix = getPromptPrefix(language, isKidsMode);
        const prompt = `${prefix}The user is searching for "${sanitizedQuery}" within the context of the ${civilization.name}. Search through the provided timeline events, key characters, major wars, and cultural topics and return the most relevant results. Each result must include a 'type' field ('event', 'character', 'war', 'topic'). Return an empty array if no results are found. The context for the search is as follows: Timeline: ${JSON.stringify(civilization.timeline.map(e => ({id: e.id, title: e.title})))}, Characters: ${JSON.stringify(civilization.keyCharacters.map(c => c.name))}, Wars: ${JSON.stringify(civilization.majorWars.map(w => w.name))}, Topics: ${JSON.stringify(civilization.culturalTopics.map(t => t.name))}`;
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
        return generateAndParseJson(prompt, schema);
    });
};

export const fetchSceneHotspots = async (event: TimelineEvent, civilizationName: string, isKidsMode: boolean): Promise<SceneHotspot[]> => {
    return withCache(['sceneHotspots', event.id, civilizationName, isKidsMode], () => {
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
        return generateAndParseJson(prompt, schema);
    });
};

export const fetchAIHistorianResponse = async (prompt: string, event: TimelineEvent, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const sanitizedPrompt = sanitizeInput(prompt);
    return withCache(['aiHistorian', sanitizedPrompt, event.id, civilizationName, language, isKidsMode], () => {
        if (isRateLimited('aiHistorian', 3000)) {
            throw new Error('You are asking questions too quickly. Please wait.');
        }
        const prefix = getPromptPrefix(language, isKidsMode);
        const context = `The user is asking a question in the context of the event "${event.title}" (${event.date}) which is part of the history of ${civilizationName}.`;
        const fullPrompt = `${prefix} ${context} The user's question is: "${sanitizedPrompt}". Answer the question in a few paragraphs, as a helpful historian AI.`;
        return generateTextWithFallback(fullPrompt);
    });
};
