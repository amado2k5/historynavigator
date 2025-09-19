
import { GoogleGenAI, Type } from "@google/genai";
import type { TimelineEvent, Character, Civilization, MapData, MusicParameters } from '../types.ts';

// Guideline: Always use new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';
const videoModel = 'veo-2.0-generate-001';

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
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
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

    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
    });

    return response.text;
};

export const fetchCharacterDetails = async (characterName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Provide a detailed biography of ${characterName} from the ${civilizationName} civilization. Focus on their historical significance and key life events. The response should be a few paragraphs long.`;
    const response = await ai.models.generateContent({ model: textModel, contents: prompt });
    return response.text;
};

export const fetchWarDetails = async (warName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Describe the major events, key figures, and outcome of the ${warName}, a significant conflict for the ${civilizationName} civilization. The response should be a few paragraphs long.`;
    const response = await ai.models.generateContent({ model: textModel, contents: prompt });
    return response.text;
};

export const fetchTopicDetails = async (topicName: string, civilizationName: string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const prompt = `${prefix}Explain the cultural topic of "${topicName}" within the ${civilizationName} civilization. Discuss its importance and impact on their society. The response should be a few paragraphs long.`;
    const response = await ai.models.generateContent({ model: textModel, contents: prompt });
    return response.text;
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> => {
    // Guideline: Use imagen-4.0-generate-001 for image generation
    const response = await ai.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });

    // Guideline: Access the image data this way
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
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

export const generateVideo = async (event: TimelineEvent, character: Character | null, civilizationName:string, language: string, isKidsMode: boolean): Promise<string> => {
    const prefix = getPromptPrefix(language, isKidsMode);
    const perspective = character ? ` from the perspective of ${character.name}` : '';
    const style = isKidsMode 
        ? "A cute and simple animated storybook style video" 
        : "A cinematic, dramatic, photorealistic video";
    const prompt = `${prefix}${style} depicting the historical event: "${event.title}" (${event.date}) from the ${civilizationName}${perspective}. Summary: ${event.summary}. The video should be short, around 15 seconds, and have no text overlays.`;
    
    // Guideline: Use veo-2.0-generate-001 for video generation and poll the operation.
    let operation = await ai.models.generateVideos({
      model: videoModel,
      prompt: prompt,
      config: {
        numberOfVideos: 1
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      operation = await ai.operations.getVideosOperation({operation: operation});
    }
  
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was provided.");
    }
    
    // Guideline: Append API key to fetch the video bytes.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if(!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateMusicParameters = async (event: TimelineEvent, civilizationName: string, isKidsMode: boolean): Promise<MusicParameters> => {
    const kidModePrompt = isKidsMode 
        ? "The sound should be simple, cheerful, and magical, suitable for children. Use major keys and simple oscillator waves like sine or triangle."
        : "The sound should be atmospheric, ambient, and reflect the mood of the event. Use a mix of oscillators and filtered noise to create a rich texture. It can be mysterious, tense, or epic depending on the event.";
    
    const prompt = `
        Generate parameters for a procedural ambient soundscape using the Web Audio API to match the historical event: "${event.title}" (${event.date}) from the ${civilizationName} civilization.
        Event summary: ${event.summary}.
        ${kidModePrompt}
        Provide the data in the specified JSON format.
        - Frequencies should be between 50 and 800 Hz.
        - LFO frequencies should be between 0.1 and 8 Hz.
        - LFO depths should be between 5 and 50.
        - Gains should be very low, between 0.01 and 0.15, to keep the music ambient.
        - Create 2 to 4 layers.
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
