
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_CHAT_MODEL_NAME } from '../constants';
import { Language } from '../types';

// Ensure API_KEY is available. In a real browser app, this needs a secure way to be set,
// often via a backend proxy or build-time environment variables.
// For this project, we assume process.env.API_KEY is made available.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set. Please set the environment variable.");
  //throw new Error("API_KEY for Gemini is not set."); // Or handle gracefully in UI
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Provide a fallback if needed for init

export const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (!API_KEY) return `Error: API Key not configured. Original: ${text}`;
  
  try {
    const model = GEMINI_CHAT_MODEL_NAME;
    const prompt = `Translate the following text to ${targetLanguage}: "${text}"`;
    
    const contents: Part[] = [{ text: prompt }];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: contents },
      config: {
        // Temperature could be 0 for more deterministic translation
        temperature: 0.3, 
      }
    });

    const translatedText = response.text;
    if (translatedText) {
      return translatedText.trim();
    } else {
      console.error("Gemini API returned no text for translation.", response);
      return "Translation not available.";
    }
  } catch (error) {
    console.error("Error translating text with Gemini:", error);
    // Check for specific Gemini errors if needed
    // if (error instanceof GoogleGenAIError) { ... }
    return `Error during translation. Original: ${text}`;
  }
};

export const getResponseWithGoogleSearch = async (promptText: string): Promise<{text: string, sources: any[]}> => {
  if (!API_KEY) return {text: "Error: API Key not configured.", sources: []};
  
  try {
    const model = GEMINI_CHAT_MODEL_NAME;
    const contents: Part[] = [{ text: promptText }];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: contents },
      config: {
        tools: [{googleSearch: {}}],
      }
    });
    
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.filter(chunk => chunk.web) || [];
    
    if (text) {
      return {text: text.trim(), sources: sources};
    } else {
      console.error("Gemini API returned no text with Google Search.", response);
      return {text: "No response available.", sources: []};
    }

  } catch (error) {
    console.error("Error with Gemini and Google Search:", error);
    return {text: `Error fetching response.`, sources: []};
  }
};

// Placeholder for future use, not actively used in this MVP's chat.
// This shows how to get a JSON response specifically.
export const getStructuredResponse = async <T,>(promptText: string, exampleJson: T): Promise<T | null> => {
  if (!API_KEY) {
    console.error("API Key not configured.");
    return null;
  }

  try {
    const model = GEMINI_CHAT_MODEL_NAME;
    const prompt = `${promptText}. Please provide the response in JSON format. Here is an example of the structure: ${JSON.stringify(exampleJson, null, 2)}`;
    
    const contents: Part[] = [{ text: prompt }];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    return JSON.parse(jsonStr) as T;

  } catch (error) {
    console.error("Error getting structured response from Gemini:", error);
    return null;
  }
};
