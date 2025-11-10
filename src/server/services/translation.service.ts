
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SUPPORTED_LANGUAGES } from '../utils/language';

// Lazy initialization for AI providers
let openaiInstance: OpenAI | null = null;
let geminiInstance: GoogleGenerativeAI | null = null;
let initialized = false;

function initializeAIProviders() {
  if (initialized) return;

  openaiInstance = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION,
        project: process.env.OPENAI_PROJECT,
      })
    : null;

  geminiInstance = process.env.GOOGLE_API_KEY
    ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
    : null;

  initialized = true;
}

const getOpenAI = () => {
  if (!initialized) initializeAIProviders();
  return openaiInstance;
};

const getGemini = () => {
  if (!initialized) initializeAIProviders();
  return geminiInstance;
};

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: 'openai' | 'gemini';
}

/**
 * Translate text using AI (OpenAI with Gemini fallback)
 */
export async function translateText(
  request: TranslationRequest
): Promise<TranslationResponse> {
  const { text, targetLanguage, sourceLanguage = 'auto', context } = request;

  if (!text || !targetLanguage) {
    throw new Error('Text and target language are required');
  }

  // Try OpenAI first (primary)
  const openai = getOpenAI();
  if (openai) {
    try {
      return await translateWithOpenAI(request);
    } catch (error: any) {
      
      // Fallback to Gemini
      const gemini = getGemini();
      if (gemini) {
        try {
          return await translateWithGemini(request);
        } catch (geminiError: any) {
          throw new Error(`Both translation providers failed. OpenAI: ${error.message}, Gemini: ${geminiError.message}`);
        }
      }
      
      // No fallback available, rethrow original error
      throw error;
    }
  }

  // OpenAI not configured, try Gemini
  const gemini = getGemini();
  if (gemini) {
    return await translateWithGemini(request);
  }

  // No AI provider configured
  throw new Error('No AI provider configured for translation. Please set OPENAI_API_KEY or GOOGLE_API_KEY in the project .env file.');
}

/**
 * Translate using OpenAI
 */
async function translateWithOpenAI(request: TranslationRequest): Promise<TranslationResponse> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI client not available');
  }

  const { text, targetLanguage, sourceLanguage = 'auto', context } = request;

  const systemPrompt = `You are a professional translator. Translate the given text accurately while preserving the original meaning, tone, and context.

Guidelines:
- Maintain the original formatting (markdown, lists, etc.)
- Preserve technical terms when appropriate
- Keep the same level of formality
- Ensure cultural appropriateness for the target language
- If the text is educational content, maintain pedagogical clarity`;

  const userPrompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}:

${context ? `Context: ${context}\n\n` : ''}Text to translate:
${text}

Provide only the translated text, maintaining all original formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const translatedText = completion.choices[0]?.message?.content;
    
    if (!translatedText) {
      throw new Error('No translation from OpenAI');
    }

    return {
      translatedText: translatedText.trim(),
      sourceLanguage,
      targetLanguage,
      provider: 'openai'
    };
  } catch (error: any) {
    throw new Error(`OpenAI translation failed: ${error.message}`);
  }
}

/**
 * Translate using Google Gemini (fallback)
 */
async function translateWithGemini(request: TranslationRequest): Promise<TranslationResponse> {
  const gemini = getGemini();
  if (!gemini) {
    throw new Error('Gemini client not available');
  }

  const { text, targetLanguage, sourceLanguage = 'auto', context } = request;

  const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}.

${context ? `Context: ${context}\n\n` : ''}Text to translate:
${text}

Guidelines:
- Maintain the original formatting (markdown, lists, etc.)
- Preserve technical terms when appropriate
- Keep the same level of formality
- Ensure cultural appropriateness for the target language
- If the text is educational content, maintain pedagogical clarity

Provide only the translated text, maintaining all original formatting.`;

  try {
    const model = gemini.getGenerativeModel({ 
      model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const translatedText = response.text();

    if (!translatedText) {
      throw new Error('No translation from Gemini');
    }

    return {
      translatedText: translatedText.trim(),
      sourceLanguage,
      targetLanguage,
      provider: 'gemini'
    };
  } catch (error: any) {
    throw new Error(`Gemini translation failed: ${error.message}`);
  }
}

/**
 * Get supported languages
 */
export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}
