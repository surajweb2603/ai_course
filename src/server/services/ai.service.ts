
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization for AI providers
let openaiInstance: OpenAI | null = null;
let genAIInstance: GoogleGenerativeAI | null = null;
let initialized = false;

function initializeAIProviders() {
  if (initialized) return;
  
  // Initialize OpenAI client (primary)
  if (process.env.OPENAI_API_KEY) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
      project: process.env.OPENAI_PROJECT,
    });
  }
  
  // Initialize Google Gemini client (fallback)
  if (process.env.GOOGLE_API_KEY) {
    genAIInstance = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  
  initialized = true;
}

// Getters that ensure initialization
const getOpenAI = () => {
  if (!initialized) initializeAIProviders();
  return openaiInstance;
};

const getGemini = () => {
  if (!initialized) initializeAIProviders();
  return genAIInstance;
};

export interface GenerateOutlineInput {
  topic: string;
  language?: string;
  subtopics?: string[];
  userPlan?: string;
}

export interface GeneratedLesson {
  order: number;
  title: string;
  summary: string;
}

export interface GeneratedModule {
  order: number;
  title: string;
  lessons: GeneratedLesson[];
}

export interface GeneratedOutline {
  title: string;
  language: string;
  summary: string;
  modules: GeneratedModule[];
}

/**
 * Generate a structured course outline using AI (OpenAI with Gemini fallback)
 */
export async function generateCourseOutline(
  input: GenerateOutlineInput
): Promise<GeneratedOutline> {
  const { topic, language = 'en', subtopics = [], userPlan } = input;

  // Validate input
  if (!topic || topic.trim().length === 0) {
    throw new Error('Topic is required');
  }

  // Try OpenAI first (primary)
  const openai = getOpenAI();
  if (openai) {
    try {
      return await generateWithOpenAI(input);
    } catch (error: any) {
      
      // Only fallback to Gemini if OpenAI had a non-quota error
      const gemini = getGemini();
      if (gemini) {
        try {
          return await generateWithGemini(input);
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
    return await generateWithGemini(input);
  }

  // No AI provider configured
  throw new Error('No AI provider configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY in the project .env file.');
}

/**
 * Generate outline using OpenAI
 */
async function generateWithOpenAI(input: GenerateOutlineInput): Promise<GeneratedOutline> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI client not available');
  }

  const { topic, language = 'en', subtopics = [], userPlan } = input;

  // Process and truncate subtopics to prevent prompt from being too long
  const processedSubtopics = subtopics
    .slice(0, 5) // Limit to max 5 subtopics
    .map(s => s.trim().substring(0, 80)); // Truncate each to 80 chars
  
  // Build the user prompt
  const subtopicsText = processedSubtopics.length > 0 ? processedSubtopics.join(', ') : 'none';
  
  const userPrompt = `Topic: ${topic}
Language: ${language}
Optional subtopics: ${subtopicsText}

Produce JSON with:
- title (string): A clear, engaging course title
- language (BCP-47 code): The language code (e.g., 'en', 'es', 'fr')
- summary (string): A concise course summary (max 80 words)
- modules (array): 6-8 modules, each with:
  - order (number): Sequential order starting from 1
  - title (string): Module title
  - lessons (array): 3-5 lessons per module, each with:
    - order (number): Sequential order starting from 1
    - title (string): Lesson title
    - summary (string): Brief lesson summary (max 40 words)

Only return valid JSON. No markdown, no explanations.`;

  try {
    // Call OpenAI with initial temperature
    let completion = await callOpenAI(userPrompt, 0.5);
    let outline = parseOutlineResponse(completion);
    
    // Validate and enforce constraints
    outline = enforceOutlineConstraints(outline, userPlan);
    
    return outline;
  } catch (error: any) {
    // Retry once with lower temperature if parsing fails
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      try {
        const completion = await callOpenAI(userPrompt, 0.3);
        let outline = parseOutlineResponse(completion);
        outline = enforceOutlineConstraints(outline, userPlan);
        return outline;
      } catch (retryError: any) {
        throw new Error(`OpenAI failed: ${retryError.message}`);
      }
    }
    throw error;
  }
}


/**
 * Call OpenAI API with the given prompt and temperature
 */
async function callOpenAI(userPrompt: string, temperature: number): Promise<string> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  const systemPrompt = `You are an expert course designer. You create well-structured, comprehensive course outlines. 
You MUST respond with ONLY valid JSON, no markdown formatting, no code blocks, no explanations.
The JSON must be properly formatted and parseable.`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return content;
}

/**
 * Parse and validate the AI response
 */
function parseOutlineResponse(response: string): GeneratedOutline {
  try {
    // Remove any markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.title || typeof parsed.title !== 'string') {
      throw new Error('Invalid or missing title');
    }
    if (!parsed.language || typeof parsed.language !== 'string') {
      throw new Error('Invalid or missing language');
    }
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid or missing summary');
    }
    if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) {
      throw new Error('Invalid or missing modules array');
    }

    // Validate modules structure
    parsed.modules.forEach((module: any, idx: number) => {
      if (!module.title || typeof module.title !== 'string') {
        throw new Error(`Module ${idx + 1} has invalid title`);
      }
      if (typeof module.order !== 'number') {
        throw new Error(`Module ${idx + 1} has invalid order`);
      }
      if (!Array.isArray(module.lessons) || module.lessons.length === 0) {
        throw new Error(`Module ${idx + 1} has invalid lessons array`);
      }

      module.lessons.forEach((lesson: any, lessonIdx: number) => {
        if (!lesson.title || typeof lesson.title !== 'string') {
          throw new Error(`Module ${idx + 1}, Lesson ${lessonIdx + 1} has invalid title`);
        }
        if (typeof lesson.order !== 'number') {
          throw new Error(`Module ${idx + 1}, Lesson ${lessonIdx + 1} has invalid order`);
        }
        if (!lesson.summary || typeof lesson.summary !== 'string') {
          throw new Error(`Module ${idx + 1}, Lesson ${lessonIdx + 1} has invalid summary`);
        }
      });
    });

    return parsed as GeneratedOutline;
  } catch (error: any) {
    throw new Error(`Failed to parse outline response: ${error.message}`);
  }
}

/**
 * Generate outline using Google Gemini (fallback)
 */
async function generateWithGemini(input: GenerateOutlineInput): Promise<GeneratedOutline> {
  const gemini = getGemini();
  if (!gemini) {
    throw new Error('Gemini client not available');
  }

  const { topic, language = 'en', subtopics = [], userPlan } = input;

  // Process and truncate subtopics to prevent prompt from being too long
  const processedSubtopics = subtopics
    .slice(0, 5) // Limit to max 5 subtopics
    .map(s => s.trim().substring(0, 80)); // Truncate each to 80 chars
  
  // Build the prompt
  const subtopicsText = processedSubtopics.length > 0 ? processedSubtopics.join(', ') : 'none';
  
  const prompt = `Generate a comprehensive course outline in JSON format.

Topic: ${topic}
Language: ${language}
Optional subtopics: ${subtopicsText}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "title": "A clear, engaging course title",
  "language": "${language}",
  "summary": "A concise course summary (max 80 words)",
  "modules": [
    {
      "order": 1,
      "title": "Module title",
      "lessons": [
        {
          "order": 1,
          "title": "Lesson title",
          "summary": "Brief lesson summary (max 40 words)"
        }
      ]
    }
  ]
}

Requirements:
- Include 6-8 modules
- Each module should have 3-5 lessons
- Use sequential order numbers starting from 1
- All content must be in ${language}
- Return ONLY the JSON, no other text`;

  try {
    const model = gemini.getGenerativeModel({ 
      model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini');
    }

    let outline = parseOutlineResponse(text);
    outline = enforceOutlineConstraints(outline);
    
    return outline;
  } catch (error: any) {
    // Retry once if parsing fails
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      
      const model = gemini.getGenerativeModel({ 
        model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini on retry');
      }

      let outline = parseOutlineResponse(text);
      outline = enforceOutlineConstraints(outline, userPlan);
      
      return outline;
    }
    
    throw error;
  }
}

/**
 * Enforce size constraints on the outline
 */
function enforceOutlineConstraints(outline: GeneratedOutline, userPlan?: string): GeneratedOutline {
  // Limit summary to reasonable length
  if (outline.summary.length > 500) {
    outline.summary = outline.summary.substring(0, 497) + '...';
  }

  // Apply plan-based module limits
  if (userPlan === 'free') {
    // Free users: limit to 2 modules maximum
    if (outline.modules.length > 2) {
      outline.modules = outline.modules.slice(0, 2);
    }
  } else {
    // Paid users: limit to max 8 modules
    if (outline.modules.length > 8) {
      outline.modules = outline.modules.slice(0, 8);
    }

    // Ensure at least 6 modules (if possible)
    if (outline.modules.length < 6) {
      // Note: Could log warning here if needed
    }
  }

  // Process each module
  outline.modules = outline.modules.map((module, idx) => {
    // Ensure correct order
    module.order = idx + 1;

    // Limit to max 5 lessons per module
    if (module.lessons.length > 5) {
      module.lessons = module.lessons.slice(0, 5);
    }

    // Ensure at least 3 lessons (if possible)
    if (module.lessons.length < 3) {
      // Note: Could log warning here if needed
    }

    // Process each lesson
    module.lessons = module.lessons.map((lesson, lessonIdx) => {
      // Ensure correct order
      lesson.order = lessonIdx + 1;

      // Limit lesson summary length
      if (lesson.summary.length > 250) {
        lesson.summary = lesson.summary.substring(0, 247) + '...';
      }

      return lesson;
    });

    return module;
  });

  return outline;
}
