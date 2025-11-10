
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLanguageDetails } from '../utils/language';

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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  courseId: string;
  courseTitle: string;
  moduleTitle?: string;
  lessonTitle?: string;
  lessonContent?: string;
  language?: string;
}

export interface ChatRequest {
  message: string;
  context: ChatContext;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  timestamp: Date;
  provider: 'openai' | 'gemini';
}

/**
 * Generate AI tutor response using OpenAI with Gemini fallback
 */
export async function generateChatResponse(
  request: ChatRequest
): Promise<ChatResponse> {
  const { message, context, conversationHistory = [] } = request;

  // Build context-aware system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Try OpenAI first (primary)
  const openai = getOpenAI();
  if (openai) {
    try {
      return await generateWithOpenAI(message, systemPrompt, conversationHistory);
    } catch (error: any) {
      
      // Always try Gemini fallback for any OpenAI error
      const gemini = getGemini();
      if (gemini) {
        try {
          return await generateWithGemini(message, systemPrompt, conversationHistory);
        } catch (geminiError: any) {
          throw new Error(`Both AI providers failed. OpenAI: ${error.message}, Gemini: ${geminiError.message}`);
        }
      }
      
      // No fallback available, rethrow original error
      throw error;
    }
  }

  // OpenAI not configured, try Gemini
  const gemini = getGemini();
  if (gemini) {
    return await generateWithGemini(message, systemPrompt, conversationHistory);
  }

  // No AI provider configured
  throw new Error('No AI provider configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY in the project .env file.');
}

/**
 * Build context-aware system prompt for the AI tutor
 */
function buildSystemPrompt(context: ChatContext): string {
  const {
    courseTitle,
    moduleTitle,
    lessonTitle,
    lessonContent,
    language = 'en',
  } = context;
  const languageDetails = getLanguageDetails(language);
  const languageDisplay = languageDetails.display;
  const languageCode = languageDetails.code;
  
  let prompt = `You are an expert AI tutor and teaching assistant. You help students learn by providing clear, educational, and encouraging responses.

**Current Learning Context:**
- Course: ${courseTitle}
${moduleTitle ? `- Module: ${moduleTitle}` : ''}
${lessonTitle ? `- Lesson: ${lessonTitle}` : ''}
- Primary Language: ${languageDisplay} (code: ${languageCode})

**Your Role:**
- Be helpful, patient, and encouraging
- Provide clear explanations with examples when helpful
- Ask follow-up questions to deepen understanding
- Suggest related concepts or next steps
- Keep responses concise but comprehensive
- Use appropriate language level for the student
- Be supportive and positive`;

  if (lessonContent) {
    prompt += `\n\n**Current Lesson Content (for reference):**
${lessonContent.substring(0, 1000)}${lessonContent.length > 1000 ? '...' : ''}`;
  }

  prompt += `\n\n**Guidelines:**
- Answer in ${languageDisplay}
- Be conversational and friendly
- Provide practical examples when relevant
- Encourage questions and deeper thinking
- If you don't know something, say so honestly
- Suggest additional resources when appropriate`;

  return prompt;
}

/**
 * Generate response using OpenAI
 */
async function generateWithOpenAI(
  message: string, 
  systemPrompt: string, 
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI client not available');
  }

  // Build messages array
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history (last 10 messages to stay within token limits)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }

  // Add current message
  messages.push({ role: 'user', content: message });

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return {
      message: content,
      timestamp: new Date(),
      provider: 'openai'
    };
  } catch (error: any) {
    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error('OpenAI API key is invalid or expired');
    } else if (error.status === 429) {
      throw new Error('OpenAI quota exceeded');
    } else {
      throw new Error(`OpenAI chat failed: ${error.message}`);
    }
  }
}

/**
 * Generate response using Google Gemini (fallback)
 */
async function generateWithGemini(
  message: string, 
  systemPrompt: string, 
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> {
  const gemini = getGemini();
  if (!gemini) {
    throw new Error('Gemini client not available');
  }

  // Build conversation context
  let conversationContext = systemPrompt + '\n\n**Conversation History:**\n';
  
  // Add recent conversation history (last 10 messages)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    conversationContext += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}\n`;
  }
  
  conversationContext += `\n**Current Student Message:** ${message}`;

  try {
    const model = gemini.getGenerativeModel({ 
      model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const result = await model.generateContent(conversationContext);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini');
    }

    return {
      message: text,
      timestamp: new Date(),
      provider: 'gemini'
    };
  } catch (error: any) {
    // Handle specific Gemini errors
    if (error.message?.includes('quota')) {
      throw new Error('Gemini quota exceeded');
    } else if (error.message?.includes('API key')) {
      throw new Error('Gemini API key is invalid');
    } else {
      throw new Error(`Gemini chat failed: ${error.message}`);
    }
  }
}
