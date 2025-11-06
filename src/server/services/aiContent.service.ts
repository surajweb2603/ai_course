import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchImages } from './imageSearch.service';
import { searchVideosWithFallback, YouTubeVideo } from './video.service';
import { translateText } from './translation.service';

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

const getOpenAI = () => {
  if (!initialized) initializeAIProviders();
  return openaiInstance;
};

const getGemini = () => {
  if (!initialized) initializeAIProviders();
  return genAIInstance;
};

// Types
export interface MediaItem {
  type: 'image' | 'video';
  url?: string | null;
  alt?: string;
  prompt?: string | null;
  title?: string;
}

export interface QuizQuestion {
  stem: string;
  options: string[];
  answerIndex: number;
  rationale: string;
}

export interface LessonContentDTO {
  theoryMd: string;
  exampleMd: string;
  exerciseMd: string;
  keyTakeaways: string[];
  media?: MediaItem[];
  quiz: {
    questions: QuizQuestion[];
  };
  estimatedMinutes?: number;
}

export interface GenerateLessonContentInput {
  courseTitle: string;
  language?: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonSummary?: string;
  audienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  lessonId?: string;
}

/**
 * Build the prompt for lesson content generation
 */
export function buildLessonContentPrompt(args: GenerateLessonContentInput): string {
  const {
    courseTitle,
    language = 'en',
    moduleTitle,
    lessonTitle,
    lessonSummary = '',
    audienceLevel = 'beginner',
  } = args;

  return `Create comprehensive lesson content for an online course that covers the topic from beginner to advanced levels.

Context
- Course: ${courseTitle}
- Module: ${moduleTitle}
- Lesson: ${lessonTitle}
${lessonSummary ? `- Summary: ${lessonSummary}` : ''}
- Audience level: ${audienceLevel}
- Language: ${language}

CONTENT REQUIREMENTS - Create comprehensive content that progresses from basic concepts to advanced applications:

MATHEMATICAL EXPRESSIONS - CRITICAL:
- ALWAYS use LaTeX syntax for ALL mathematical expressions
- Inline math: wrap with single dollar signs $expression$ (e.g., $x^n$, $f'(x) = n \cdot x^{n-1}$, $b^2 - 2ac$)
- Block math: wrap with double dollar signs $$expression$$ for centered equations
- Use proper LaTeX syntax:
  * Exponents: $x^n$ not x^n
  * Subscripts: $x_i$ not x_i
  * Fractions: $\frac{a}{b}$ not a/b
  * Derivatives: $f'(x)$ not f'(x)
  * Square roots: $\sqrt{x}$ not sqrt(x)
- Examples: "$x^n$, then $f'(x) = n \cdot x^{n-1}$" or "$(uv)' = u'v + uv'$" or "$b^2 - 2ac$"
- NEVER use plain ASCII notation like x^n, b^2, f'(x) - ALWAYS wrap in LaTeX delimiters

Required JSON fields
1. theoryMd - 800-1200 words. Provide a complete learning journey:
   - Start with fundamental concepts and definitions
   - Progress through intermediate applications and techniques
   - Conclude with advanced concepts, best practices, and real-world applications
   - Use clear Markdown headings (##, ###) to structure the progression
   - Include practical insights and industry knowledge
   - ALWAYS use LaTeX format for all mathematical expressions (see above)
2. exampleMd - 400-600 words. Provide multiple examples showing progression:
   - Begin with a simple, beginner-friendly example
   - Include an intermediate example with more complexity
   - End with an advanced example showing real-world application
   - Use code blocks when relevant, with detailed explanations
   - ALWAYS use LaTeX format for all mathematical expressions (see above)
3. exerciseMd - 300-500 words. Create a comprehensive exercise that:
   - Starts with basic practice tasks
   - Includes intermediate challenges
   - Concludes with advanced, real-world scenarios
   - Provides clear step-by-step guidance for each level
   - ALWAYS use LaTeX format for all mathematical expressions (see above)
4. keyTakeaways - 5-8 comprehensive bullet points covering the full spectrum from basic to advanced concepts.
5. media - REQUIRED array with 1-3 relevant images. For images use { type: "image", url: null, alt: "descriptive text", prompt: "detailed search query" }. Always include at least one image that helps explain the lesson content.

IMAGE SEARCH GUIDELINES (GENERALIZED)

When defining image queries for lessons, follow these structured rules:

**Topic-Specific Precision**
- Use clear, subject-focused search terms
- Example: "marketing funnel diagram", "customer journey map visual", "machine learning architecture diagram"

**Contextual Modifiers**
- Add qualifiers such as: "educational", "tutorial", "training", "example", "infographic"
- Example: "educational chemistry periodic table chart"

**Clarity and Relevance**
- Always mention the domain or concept explicitly
- Avoid vague terms like "concept", "idea", "process" without a subject

**Format Keywords**
- For visual aids: "diagram", "infographic", "chart", "workflow", "example"
- For code: specify language ("JavaScript example", "C++ function syntax")
- For business or design: "slide deck visual", "presentation graphic"

**Educational Intent**
- Use learning-oriented tone: "beginner tutorial", "learning guide", "step-by-step visual"

**Filter Out Noise**
- Exclude keywords like "meme", "poster", "wallpaper", "aesthetic"
6. quiz - 4-6 questions covering beginner to advanced concepts. Each question needs: stem, exactly 4 options, answerIndex (0-3), rationale <=30 words.
7. estimatedMinutes - realistic duration between 15 and 45 minutes to accommodate comprehensive content.

Return ONLY JSON exactly matching this shape (no markdown fences, no commentary):
{
  "theoryMd": "string",
  "exampleMd": "string",
  "exerciseMd": "string",
  "keyTakeaways": ["string"],
   "media": [
     { "type": "image", "url": null, "alt": "descriptive text", "prompt": "detailed search query for relevant image" },
     { "type": "image", "url": null, "alt": "another descriptive text", "prompt": "another detailed search query" }
   ],
  "quiz": { "questions": [{ "stem": "string", "options": ["string", "string", "string", "string"], "answerIndex": 0, "rationale": "string" }] },
  "estimatedMinutes": 10
}

Respond in ${language}. Create content that serves learners at all levels - from complete beginners to advanced practitioners. Structure the content to allow learners to progress through difficulty levels within the same lesson.

IMPORTANT: Always include 1-3 relevant images in the media array. Think about what visual aids would help students understand the lesson content at different levels. Examples:
- For programming lessons: code screenshots, architecture diagrams, flowcharts, advanced debugging techniques
- For math lessons: graphs, charts, visual representations, complex problem-solving diagrams
- For science lessons: diagrams, illustrations, real-world examples, advanced experimental setups
- For business lessons: charts, infographic, process diagrams, advanced strategy frameworks

Make the image prompts specific and descriptive to get the best search results. Focus on creating a complete learning experience that takes students from zero knowledge to advanced understanding.`;
}

/**
 * Retry function with exponential backoff for timeout scenarios
 */
async function generateWithRetry<T>(
  generateFn: () => Promise<T>, 
  provider: string,
  maxRetries: number = 2
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateFn();
    } catch (error: any) {
      const isTimeout = error.message.includes('timeout') || error.message.includes('TIMEOUT');
      
      if (isTimeout && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  throw new Error(`${provider} failed after ${maxRetries} attempts`);
}

/**
 * Generate lesson content using AI (OpenAI with Gemini fallback)
 */
export async function generateLessonContent(
  input: GenerateLessonContentInput
): Promise<LessonContentDTO> {
  // Try OpenAI first (primary)
  const openai = getOpenAI();
  if (openai) {
    try {
      return await generateWithRetry(() => generateWithOpenAI(input), 'OpenAI');
    } catch (error: any) {
      
      // Fallback to Gemini
      const gemini = getGemini();
      if (gemini) {
        try {
          return await generateWithRetry(() => generateWithGemini(input), 'Gemini');
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
    return await generateWithRetry(() => generateWithGemini(input), 'Gemini');
  }

  // No AI provider configured
  throw new Error('No AI provider configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY in the project .env file.');
}

/**
 * Generate content using OpenAI
 */
async function generateWithOpenAI(input: GenerateLessonContentInput): Promise<LessonContentDTO> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI client not available');
  }

  const prompt = buildLessonContentPrompt(input);
  const model = process.env.OPENAI_MODEL_CONTENT || 'gpt-4o-mini';
  const timeout = parseInt(process.env.OPENAI_CONTENT_TIMEOUT_MS || '120000', 10);

  const systemPrompt = `You are an expert educational content creator. Generate comprehensive lesson content that progresses from beginner to advanced concepts. 

CRITICAL: For ALL mathematical expressions, ALWAYS use LaTeX syntax:
- Inline math: $expression$ (e.g., $x^n$, $f'(x) = n \cdot x^{n-1}$, $b^2 - 2ac$)
- Block math: $$expression$$ for centered equations
- NEVER use plain ASCII like x^n or b^2 - always wrap in LaTeX delimiters

Output strict JSON only as per schema. No prose. No markdown code blocks. Only valid JSON. Focus on creating detailed, educational content efficiently.`;

  try {
    const completion = await Promise.race([
      openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI request timeout')), timeout)
      ),
    ]);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsedContent = parseLessonContent(content);
    
    // Automatically search for and enhance images
    let enhancedContent = await enhanceMediaWithImages(parsedContent, input.lessonTitle, input.courseTitle, input.language);
    // Automatically search for and enhance videos
    enhancedContent = await enhanceMediaWithVideos(enhancedContent, input.lessonTitle);
    return enhancedContent;
  } catch (error: any) {
    // Retry once with lower temperature if parsing fails
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI on retry');
      }

      const parsedContent = parseLessonContent(content);
      
      // Automatically search for and enhance images
      let enhancedContent = await enhanceMediaWithImages(parsedContent, input.lessonTitle, input.courseTitle, input.language);
      // Automatically search for and enhance videos
      enhancedContent = await enhanceMediaWithVideos(enhancedContent, input.lessonTitle);
      return enhancedContent;
    }
    
    throw error;
  }
}


/**
 * Generate content using Google Gemini (fallback)
 */
async function generateWithGemini(input: GenerateLessonContentInput): Promise<LessonContentDTO> {
  const gemini = getGemini();
  if (!gemini) {
    throw new Error('Gemini client not available');
  }

  const prompt = buildLessonContentPrompt(input);
  const model = process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp';
  const timeout = parseInt(process.env.GEMINI_CONTENT_TIMEOUT_MS || '120000', 10);

  try {
    const genModel = gemini.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const result = await Promise.race([
      genModel.generateContent(prompt),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timeout')), timeout)
      ),
    ]);

    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini');
    }

    const parsedContent = parseLessonContent(text);
    
    // Automatically search for and enhance images
    let enhancedContent = await enhanceMediaWithImages(parsedContent, input.lessonTitle, input.courseTitle, input.language);
    // Automatically search for and enhance videos
    enhancedContent = await enhanceMediaWithVideos(enhancedContent, input.lessonTitle);
    return enhancedContent;
  } catch (error: any) {
    // Retry once with lower temperature if parsing fails
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      
      const genModel = gemini.getGenerativeModel({ 
        model,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const result = await genModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini on retry');
      }

      const parsedContent = parseLessonContent(text);
      
      // Automatically search for and enhance images
      let enhancedContent = await enhanceMediaWithImages(parsedContent, input.lessonTitle, input.courseTitle, input.language);
      // Automatically search for and enhance videos
      enhancedContent = await enhanceMediaWithVideos(enhancedContent, input.lessonTitle);
      return enhancedContent;
    }
    
    throw error;
  }
}

/**
 * Parse and validate lesson content response
 */
function parseLessonContent(response: string): LessonContentDTO {
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
    if (!parsed.theoryMd || typeof parsed.theoryMd !== 'string') {
      throw new Error('Invalid or missing theoryMd');
    }
    if (!parsed.exampleMd || typeof parsed.exampleMd !== 'string') {
      throw new Error('Invalid or missing exampleMd');
    }
    if (!parsed.exerciseMd || typeof parsed.exerciseMd !== 'string') {
      throw new Error('Invalid or missing exerciseMd');
    }
    if (!Array.isArray(parsed.keyTakeaways) || parsed.keyTakeaways.length === 0) {
      throw new Error('Invalid or missing keyTakeaways');
    }
    if (!parsed.quiz || !Array.isArray(parsed.quiz.questions)) {
      throw new Error('Invalid or missing quiz.questions');
    }

    // Validate quiz questions
    parsed.quiz.questions.forEach((q: any, idx: number) => {
      if (!q.stem || typeof q.stem !== 'string') {
        throw new Error(`Quiz question ${idx + 1} has invalid stem`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Quiz question ${idx + 1} must have exactly 4 options`);
      }
      if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex > 3) {
        throw new Error(`Quiz question ${idx + 1} has invalid answerIndex (must be 0-3)`);
      }
      if (!q.rationale || typeof q.rationale !== 'string') {
        throw new Error(`Quiz question ${idx + 1} has invalid rationale`);
      }
    });

    // Validate media if present
    if (parsed.media) {
      if (!Array.isArray(parsed.media)) {
        throw new Error('media must be an array');
      }
      parsed.media.forEach((item: any, idx: number) => {
        if (!item.type || !['image', 'video'].includes(item.type)) {
          throw new Error(`Media item ${idx + 1} has invalid type`);
        }
      });
    }

    // Enforce word count limits (updated for comprehensive content)
    const wordCount = (text: string) => text.split(/\s+/).length;
    
    if (wordCount(parsed.theoryMd) > 1300) {
      const words = parsed.theoryMd.split(/\s+/).slice(0, 1200);
      parsed.theoryMd = words.join(' ') + '...';
    }
    
    if (wordCount(parsed.exampleMd) > 650) {
      const words = parsed.exampleMd.split(/\s+/).slice(0, 600);
      parsed.exampleMd = words.join(' ') + '...';
    }
    
    if (wordCount(parsed.exerciseMd) > 550) {
      const words = parsed.exerciseMd.split(/\s+/).slice(0, 500);
      parsed.exerciseMd = words.join(' ') + '...';
    }

    return parsed as LessonContentDTO;
  } catch (error: any) {
    throw new Error(`Failed to parse lesson content: ${error.message}`);
  }
}

/**
 * Generate topic-specific educational image prompts with strict relevance
 * Now creates highly specific prompts that focus on the exact lesson content
 */
function generateEducationalImagePrompts(lessonTitle: string, subject: string, lessonContent: string): string[] {
  
  const prompts: string[] = [];
  const subjectLower = subject.toLowerCase();
  const titleLower = lessonTitle.toLowerCase();
  
  // Extract key concepts from lesson title and content
  const keyConcepts = extractKeyConcepts(lessonTitle, lessonContent);
  
  // Generate highly specific prompts based on the exact lesson content
  if (subjectLower.includes('programming') || subjectLower.includes('coding') || subjectLower.includes('python') || subjectLower.includes('javascript')) {
    // Programming-specific prompts with exact technical terms
    if (titleLower.includes('function') || titleLower.includes('method')) {
      prompts.push(`${keyConcepts.join(' ')} function definition programming flowchart`);
      prompts.push(`${keyConcepts.join(' ')} function call stack diagram`);
    } else if (titleLower.includes('loop') || titleLower.includes('iteration')) {
      prompts.push(`${keyConcepts.join(' ')} loop execution flowchart programming`);
      prompts.push(`${keyConcepts.join(' ')} iteration process diagram`);
    } else if (titleLower.includes('class') || titleLower.includes('object')) {
      prompts.push(`${keyConcepts.join(' ')} class hierarchy diagram programming`);
      prompts.push(`${keyConcepts.join(' ')} object relationship diagram`);
    } else if (titleLower.includes('algorithm') || titleLower.includes('sort')) {
      prompts.push(`${keyConcepts.join(' ')} algorithm flowchart programming`);
      prompts.push(`${keyConcepts.join(' ')} sorting algorithm visualization`);
    } else {
      // General programming concepts
      prompts.push(`${keyConcepts.join(' ')} programming concept diagram`);
      prompts.push(`${keyConcepts.join(' ')} code structure flowchart`);
    }
  } else if (subjectLower.includes('data') || subjectLower.includes('analysis') || subjectLower.includes('statistics')) {
    // Data science-specific prompts
    if (titleLower.includes('machine learning') || titleLower.includes('ai')) {
      prompts.push(`${keyConcepts.join(' ')} machine learning algorithm diagram`);
      prompts.push(`${keyConcepts.join(' ')} neural network architecture diagram`);
    } else if (titleLower.includes('visualization') || titleLower.includes('chart')) {
      prompts.push(`${keyConcepts.join(' ')} data visualization chart`);
      prompts.push(`${keyConcepts.join(' ')} statistical analysis diagram`);
    } else {
      prompts.push(`${keyConcepts.join(' ')} data analysis flowchart`);
      prompts.push(`${keyConcepts.join(' ')} statistical process diagram`);
    }
  } else if (subjectLower.includes('web') || subjectLower.includes('html') || subjectLower.includes('css')) {
    // Web development-specific prompts
    if (titleLower.includes('html') || titleLower.includes('structure')) {
      prompts.push(`${keyConcepts.join(' ')} HTML structure diagram`);
      prompts.push(`${keyConcepts.join(' ')} web page layout diagram`);
    } else if (titleLower.includes('css') || titleLower.includes('styling')) {
      prompts.push(`${keyConcepts.join(' ')} CSS styling diagram`);
      prompts.push(`${keyConcepts.join(' ')} responsive design flowchart`);
    } else if (titleLower.includes('javascript') || titleLower.includes('interactive')) {
      prompts.push(`${keyConcepts.join(' ')} JavaScript interaction diagram`);
      prompts.push(`${keyConcepts.join(' ')} DOM manipulation flowchart`);
    } else {
      prompts.push(`${keyConcepts.join(' ')} web development process diagram`);
    }
  } else if (subjectLower.includes('database') || subjectLower.includes('sql')) {
    // Database-specific prompts
    if (titleLower.includes('table') || titleLower.includes('schema')) {
      prompts.push(`${keyConcepts.join(' ')} database schema diagram`);
      prompts.push(`${keyConcepts.join(' ')} table relationship diagram`);
    } else if (titleLower.includes('query') || titleLower.includes('select')) {
      prompts.push(`${keyConcepts.join(' ')} SQL query execution diagram`);
      prompts.push(`${keyConcepts.join(' ')} database query flowchart`);
    } else {
      prompts.push(`${keyConcepts.join(' ')} database architecture diagram`);
    }
  } else if (subjectLower.includes('business') || subjectLower.includes('marketing') || subjectLower.includes('management')) {
    // Business-specific prompts
    if (titleLower.includes('strategy') || titleLower.includes('planning')) {
      prompts.push(`${keyConcepts.join(' ')} business strategy diagram`);
      prompts.push(`${keyConcepts.join(' ')} strategic planning flowchart`);
    } else if (titleLower.includes('marketing') || titleLower.includes('campaign')) {
      prompts.push(`${keyConcepts.join(' ')} marketing funnel diagram`);
      prompts.push(`${keyConcepts.join(' ')} customer journey map`);
    } else {
      prompts.push(`${keyConcepts.join(' ')} business process diagram`);
    }
  } else if (subjectLower.includes('science') || subjectLower.includes('chemistry') || subjectLower.includes('biology') || subjectLower.includes('physics')) {
    // Science-specific prompts
    if (titleLower.includes('process') || titleLower.includes('reaction')) {
      prompts.push(`${keyConcepts.join(' ')} scientific process diagram`);
      prompts.push(`${keyConcepts.join(' ')} chemical reaction flowchart`);
    } else if (titleLower.includes('structure') || titleLower.includes('molecule')) {
      prompts.push(`${keyConcepts.join(' ')} molecular structure diagram`);
      prompts.push(`${keyConcepts.join(' ')} chemical structure visualization`);
    } else {
      prompts.push(`${keyConcepts.join(' ')} scientific concept diagram`);
    }
  } else if (subjectLower.includes('math') || subjectLower.includes('mathematics') || subjectLower.includes('algebra') || subjectLower.includes('calculus')) {
    // Math-specific prompts
    if (titleLower.includes('function') || titleLower.includes('graph')) {
      prompts.push(`${keyConcepts.join(' ')} mathematical function graph`);
      prompts.push(`${keyConcepts.join(' ')} function visualization diagram`);
    } else if (titleLower.includes('equation') || titleLower.includes('formula')) {
      prompts.push(`${keyConcepts.join(' ')} mathematical equation diagram`);
      prompts.push(`${keyConcepts.join(' ')} formula derivation flowchart`);
    } else {
      prompts.push(`${keyConcepts.join(' ')} mathematical concept diagram`);
    }
  } else {
    // General educational prompts with specific focus
    prompts.push(`${keyConcepts.join(' ')} concept diagram educational`);
    prompts.push(`${keyConcepts.join(' ')} learning process flowchart`);
  }
  
  // Add fallback prompts only if we have very few specific prompts
  if (prompts.length < 2) {
    if (subjectLower.includes('programming') || subjectLower.includes('coding')) {
      prompts.push('programming concept flowchart diagram');
    } else if (subjectLower.includes('data') || subjectLower.includes('analysis')) {
      prompts.push('data analysis process diagram');
    } else {
      prompts.push('educational concept diagram');
    }
  }
  
  return prompts;
}

/**
 * Extract key concepts from lesson title and content with improved precision
 */
function extractKeyConcepts(lessonTitle: string, lessonContent: string): string[] {
  const concepts: string[] = [];
  
  // Extract from title with better filtering
  const titleWords = lessonTitle.toLowerCase().split(/\s+/);
  const importantWords = titleWords.filter(word => 
    word.length > 3 && 
    !['the', 'and', 'or', 'for', 'with', 'from', 'into', 'onto', 'upon', 'about', 'over', 'under', 'through', 'what', 'how', 'why', 'when', 'where', 'introduction', 'basics', 'fundamentals', 'overview'].includes(word)
  );
  concepts.push(...importantWords);
  
  // Extract technical terms from content (first 300 characters for better context)
  const contentPreview = lessonContent.substring(0, 300).toLowerCase();
  const contentWords = contentPreview.split(/\s+/);
  
  // Filter for technical and meaningful terms
  const technicalTerms = contentWords.filter(word => 
    word.length > 4 && 
    !['this', 'that', 'with', 'from', 'into', 'onto', 'upon', 'about', 'over', 'under', 'through', 'lesson', 'content', 'example', 'learn', 'understand', 'concept', 'topic', 'subject', 'course', 'module', 'chapter', 'section', 'part', 'beginner', 'advanced', 'intermediate'].includes(word) &&
    // Prioritize technical terms
    (word.includes('ing') || word.includes('tion') || word.includes('sion') || word.includes('ment') || 
     word.includes('code') || word.includes('data') || word.includes('function') || word.includes('method') ||
     word.includes('class') || word.includes('object') || word.includes('variable') || word.includes('array') ||
     word.includes('loop') || word.includes('algorithm') || word.includes('structure') || word.includes('process') ||
     word.includes('system') || word.includes('model') || word.includes('analysis') || word.includes('design'))
  );
  
  concepts.push(...technicalTerms.slice(0, 4)); // Take first 4 relevant technical terms
  
  // Remove duplicates and limit to 6 concepts for better specificity
  const uniqueConcepts = [...new Set(concepts)].slice(0, 6);
  
  return uniqueConcepts;
}

/**
 * Validate if a URL is a valid media URL (image or video)
 * Filters out marketing/promotional links and non-media URLs
 */
function isValidMediaUrl(url: string | null | undefined, type: 'image' | 'video'): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const urlLower = url.toLowerCase();

    // Block marketing/promotional URLs
    const blockedPatterns = [
      'utm_campaign',
      'utm_source',
      'utm_medium',
      'utm_content',
      'utm_term',
      'youtube.com/user/',  // Channel pages, not embed URLs
      'youtube.com/channel/',
      'youtube.com/c/',
      'youtube.com/@',  // Handle pages
      'simplilearn.com',
      'coursera.org',
      'udemy.com',
      '/course/',
      '/certification',
      '/training-course',
      'sub_confirmation',  // Subscribe links
    ];

    if (blockedPatterns.some(pattern => urlLower.includes(pattern))) {
      return false;
    }

    if (type === 'image') {
      // Valid image extensions (exclude .svg to avoid broken images)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasImageExtension = imageExtensions.some(ext => 
        urlLower.endsWith(ext) || 
        urlLower.includes(`${ext}?`) || 
        urlLower.includes(`${ext}&`)
      );

      const isBingProxy = urlLower.includes('r.bing.com/rp/');
      const isBingCdn = urlLower.includes('://th.bing.com/th/id/') ||
        urlLower.includes('://www.bing.com/th?id=') ||
        urlLower.includes('://c.bing.net/th?id=');
      
      // Prefer Wikipedia/Wikimedia/.edu URLs - always allow these
      if ((urlLower.includes('wikipedia.org') || urlLower.includes('wikimedia.org') || /\.edu(\/|$)/i.test(urlObj.hostname)) && (hasImageExtension || isBingCdn)) {
        return true;
      }
      
      // Prefer direct image URLs (non-proxy)
      if ((hasImageExtension || isBingCdn) && !isBingProxy) {
        return true;
      }
      
      // REJECT: Do not allow Bing proxy URLs - they often fail to load
      // Instead, the search should continue to find a better URL or skip the image
      if (isBingProxy) {
        // Reject proxy URLs completely
        return false;
      }
      
      return false;
    }

    if (type === 'video') {
      // Allow YouTube embed URLs
      const youtubeEmbedPattern = /^https:\/\/www\.youtube\.com\/embed\/[\w-]+/i;
      if (youtubeEmbedPattern.test(url)) {
        return true;
      }
      
      // Allow YouTube watch URLs
      const youtubeWatchPattern = /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/i;
      if (youtubeWatchPattern.test(url)) {
        return true;
      }
      
      // Allow youtu.be format
      const youtubeBePattern = /^https:\/\/youtu\.be\/[\w-]+/i;
      if (youtubeBePattern.test(url)) {
        return true;
      }
      
      return false;
    }

    return false;
  } catch (e) {
    // Invalid URL format
    return false;
  }
}

/**
 * Detect if text is likely non-English (contains non-ASCII characters or common non-English scripts)
 */
function isNonEnglish(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  // Check for non-ASCII characters (common indicator of non-English)
  const nonAsciiRegex = /[^\x00-\x7F]/;
  if (!nonAsciiRegex.test(text)) return false;
  
  // Common English words should be ASCII, so if we have non-ASCII, it's likely non-English
  // But allow some common exceptions like accented characters in English
  const englishWordRatio = (text.match(/[a-zA-Z]+/g) || []).length;
  const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;
  
  // If less than 30% of words are English-like, consider it non-English
  return englishWordRatio / totalWords < 0.3;
}

/**
 * Translate text to English if it's non-English
 */
async function translateToEnglishIfNeeded(text: string, sourceLanguage?: string): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  
  // Skip translation if already English or language is English
  if (sourceLanguage === 'en' || !isNonEnglish(text)) {
    return text;
  }
  
  try {
    const translation = await translateText({
      text: text,
      targetLanguage: 'en',
      sourceLanguage: sourceLanguage || 'auto',
      context: 'image search query'
    });
    return translation.translatedText;
  } catch (error: any) {
    return text; // Fallback to original if translation fails
  }
}

/**
 * Automatically search for and update media items with actual image URLs
 */
async function enhanceMediaWithImages(
  content: LessonContentDTO, 
  lessonTitle?: string, 
  subject?: string,
  language?: string
): Promise<LessonContentDTO> {
  
  if (!content.media || content.media.length === 0) {
    return content;
  }

  
  // Generate topic-specific educational prompts based on ACTUAL lesson content
  let educationalPrompts: string[] = [];
  if (lessonTitle && subject) {
    // Use the full lesson content (theory + examples) for better relevance
    const lessonContent = `${content.theoryMd || ''} ${content.exampleMd || ''} ${content.exerciseMd || ''}`;
    educationalPrompts = generateEducationalImagePrompts(lessonTitle, subject, lessonContent);
  }
  
  // Log all media items that need images
  content.media.forEach((mediaItem, index) => {
    if (mediaItem.type === 'image' && !mediaItem.url && mediaItem.prompt) {
    }
  });

  const enhancedMedia = await Promise.all(
    content.media.map(async (mediaItem, index) => {
      // Only process image items that don't have URLs yet
      if (mediaItem.type === 'image' && !mediaItem.url && mediaItem.prompt) {
        
        // Translate prompts to English for better image search results
        const translatedPrompt = await translateToEnglishIfNeeded(mediaItem.prompt, language);
        const translatedLessonTitle = lessonTitle ? await translateToEnglishIfNeeded(lessonTitle, language) : lessonTitle;
        const translatedSubject = subject ? await translateToEnglishIfNeeded(subject, language) : subject;
        
        // Translate educational prompts if they exist
        const translatedEducationalPrompts = await Promise.all(
          educationalPrompts.map(p => translateToEnglishIfNeeded(p, language))
        );
        
        // PRIORITY: Use the original AI-generated prompt first (it's already content-specific)
        // Then try educational prompts generated from actual lesson content
        // Build content-specific prompts from the actual lesson content
        const contentSpecificPrompts: string[] = [];
        
        // Extract key terms from lesson content for better relevance
        const lessonContentText = `${content.theoryMd || ''} ${content.exampleMd || ''}`;
        const keyTerms = extractKeyConcepts(lessonTitle || '', lessonContentText);
        
        // Create content-specific prompts using actual lesson terms
        if (translatedPrompt && keyTerms.length > 0) {
          // Combine original prompt with content-specific terms for maximum relevance
          const topTerms = keyTerms.slice(0, 2).join(' ');
          contentSpecificPrompts.push(`${translatedPrompt} ${topTerms}`);
          contentSpecificPrompts.push(`${topTerms} ${translatedPrompt}`);
        }
        
        // Try multiple search strategies (prioritize content-specific prompts)
        const searchStrategies = [
          // Strategy 1 (HIGHEST PRIORITY): Original AI-generated prompt (already content-specific)
          translatedPrompt,
          // Strategy 2: Content-specific prompts (original prompt + lesson content terms)
          ...contentSpecificPrompts,
          // Strategy 3: Educational prompts generated from lesson content
          ...(translatedEducationalPrompts.length > 0 ? translatedEducationalPrompts.slice(0, 2) : []),
          // Strategy 4: Fallback with lesson title + subject
          `${translatedLessonTitle || ''} ${translatedSubject || ''} educational diagram infographic`.trim()
        ].filter(p => p && p.trim().length > 0); // Remove empty prompts
        
        let searchResult: any = null;
        let usedPrompt = '';
        
        // Try each strategy until we find a good result
        for (const prompt of searchStrategies) {
          if (!prompt || prompt.trim().length === 0) continue;
          
          if (searchResult && searchResult.results && searchResult.results.length > 0) {
            break; // Found a good result, stop trying
          }
          
          try {
            searchResult = await searchImages(prompt, 1);
            usedPrompt = prompt;
            
            if (searchResult.results && searchResult.results.length > 0) {
              // Prefer non-proxy URLs but allow proxy URLs as fallback (yesterday's fix behavior)
              if (searchResult.provider === 'bing') {
                const hasNonProxyUrl = searchResult.results.some((r: any) => {
                  const url = r.link || r.image?.contextLink || '';
                  return url && !url.includes('r.bing.com/rp/');
                });
                
                if (!hasNonProxyUrl) {
                  // Continue with proxy URLs as fallback (yesterday's fix behavior)
                }
              }
              
              break;
            }
          } catch (error: any) {
            continue;
          }
        }
        
        if (searchResult && searchResult.results && searchResult.results.length > 0) {
          const firstResult = searchResult.results[0];
          let imageUrl = '';
          
          // Handle different result formats from different providers
          if (searchResult.provider === 'google') {
            const googleResult = firstResult as any;
            imageUrl = googleResult.link || googleResult.image?.contextLink;
          } else if (searchResult.provider === 'bing') {
            const bingResult = firstResult as any;
            // Prefer non-proxy URLs but allow proxy URLs as fallback (yesterday's fix behavior)
            const results = searchResult.results as any[];
            
            // First, try to find a non-proxy URL
            let nonProxyResult = results.find((r: any) => {
              const url = r.link || r.image?.contextLink || '';
              return url && !url.includes('r.bing.com/rp/') && isValidMediaUrl(url, 'image');
            });
            
            let selectedResult = firstResult;
            if (nonProxyResult) {
              imageUrl = nonProxyResult.link || nonProxyResult.image?.contextLink;
              selectedResult = nonProxyResult;
            } else {
              // Fallback to proxy URLs if no non-proxy URLs available (yesterday's fix)
              const proxyResult = results.find((r: any) => {
                const url = r.link || r.image?.contextLink || '';
                return url && isValidMediaUrl(url, 'image');
              });
              
              if (proxyResult) {
                imageUrl = proxyResult.link || proxyResult.image?.contextLink;
                selectedResult = proxyResult;
              } else {
                // Skip this result entirely
                searchResult = null;
              }
            }
            
            // If we have a valid URL (proxy or non-proxy), process it
            if (imageUrl && searchResult) {
              // Use the selected result for title extraction
              const resultTitle = (selectedResult as any).title || (selectedResult as any).alt_description;
              const enhancedItem = {
                ...mediaItem,
                url: imageUrl,
                title: resultTitle || mediaItem.title || `Image for ${mediaItem.alt || 'lesson content'}`,
                prompt: usedPrompt // Update with the successful prompt
              };
              
              return enhancedItem;
            }
          }
          
          // Validate URL is not null, empty, or invalid
          if (imageUrl && imageUrl !== 'null' && typeof imageUrl === 'string' && imageUrl.trim() !== '' && isValidMediaUrl(imageUrl, 'image')) {
            const resultTitle = (firstResult as any).title || (firstResult as any).alt_description;
            const enhancedItem = {
              ...mediaItem,
              url: imageUrl,
              title: resultTitle || mediaItem.title || `Image for ${mediaItem.alt || 'lesson content'}`,
              prompt: usedPrompt // Update with the successful prompt
            };
            
            return enhancedItem;
          }
        }
        
        return mediaItem;
      } else {
        return mediaItem; // Return unchanged if not an image or already has URL
      }
    })
  );

  // Filter out media items with invalid URLs
  const validatedMedia = enhancedMedia.filter((item) => {
    if (!item.url) {
      // Allow items without URLs if they have prompts (they'll be searched later)
      return !!item.prompt;
    }
    return isValidMediaUrl(item.url, item.type);
  });
  
  const enhancedCount = validatedMedia.filter((item, index) => 
    content.media?.[index]?.type === 'image' && 
    !content.media[index].url && 
    content.media[index].prompt && 
    item.url
  ).length;
  

  return {
    ...content,
    media: validatedMedia
  };
}

/**
 * Automatically search for and update media items with relevant lesson videos
 */
async function enhanceMediaWithVideos(content: LessonContentDTO, lessonTitle?: string): Promise<LessonContentDTO> {
  if (!lessonTitle) {
    return content;
  }
  let videos: YouTubeVideo[] = [];
  try {
    videos = await searchVideosWithFallback(lessonTitle) as YouTubeVideo[];
  } catch (error: any) {
  }
  // Format as lesson media items and filter out invalid URLs
  const videoMedia: MediaItem[] = (videos || [])
    .slice(0, 3)
    .map((video): MediaItem => ({
      type: 'video' as const,
      url: video.embedUrl,
      title: video.title,
      alt: video.description || video.title,
      prompt: `Auto-searched video for lesson: ${lessonTitle}`,
    }))
    .filter(media => isValidMediaUrl(media.url, 'video')); // Filter out invalid URLs
  
  
  // Keep any existing non-video media (images)
  const existingNonVideoMedia: MediaItem[] = (content.media || []).filter(item => item.type !== 'video');
  return {
    ...content,
    media: [...existingNonVideoMedia, ...videoMedia],
  };
}
