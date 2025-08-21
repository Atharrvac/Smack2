
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_CHAT_MODEL_NAME } from '../constants';
import { Language } from '../types';

const API_KEY = process.env.API_KEY;

// Log warning but don't throw error - allow app to run without Gemini
if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled.");
}

// Only initialize if API key is available
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (!API_KEY || !ai) {
    console.warn("Gemini API not available for translation");
    return text; // Return original text if no API key
  }
  
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
  if (!API_KEY || !ai) {
    console.warn("Gemini API not available for search");
    return {text: "AI assistant is currently unavailable. Please configure the Gemini API key to enable AI features.", sources: []};
  }
  
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
  if (!API_KEY || !ai) {
    console.warn("Gemini API not available for structured response");
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
