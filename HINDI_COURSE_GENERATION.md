# Hindi Course Generation - Complete Documentation

This document provides a detailed explanation of how Hindi courses are generated in this project, including the complete flow, code examples, and implementation details.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Language Detection & Support](#language-detection--support)
4. [AI Provider Selection](#ai-provider-selection)
5. [Course Outline Generation](#course-outline-generation)
6. [Lesson Content Generation](#lesson-content-generation)
7. [Translation Services](#translation-services)
8. [Complete Code Examples](#complete-code-examples)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## Overview

The Hindi course generation system uses a **dual AI provider approach** (OpenAI + Google Gemini) with automatic fallback. Hindi (`hi`) is identified as an "unsupported language" for OpenAI's JSON mode, so the system automatically routes Hindi requests to Google Gemini.

### Key Features:
- **Automatic Language Detection**: Detects Hindi (`hi`) and routes to appropriate AI provider
- **Dual Provider Fallback**: Primary OpenAI → Fallback Gemini for Hindi
- **JSON Mode Support**: Uses Gemini's native JSON mode for Hindi content
- **Translation Services**: Translates image search queries and other metadata
- **Error Handling**: Handles quota limits, timeouts, and retries

---

## Architecture

```
User Request (language: 'hi')
    ↓
API Route (/api/generate/outline or /api/generate/content)
    ↓
Language Detection (hi → unsupportedLanguages array)
    ↓
AI Provider Selection (Gemini for Hindi)
    ↓
Content Generation (Hindi JSON response)
    ↓
Response Parsing & Validation
    ↓
Database Storage
```

---

## Language Detection & Support

### Supported Languages Configuration

**File**: `src/server/utils/language.ts`

```typescript
export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  // ... other languages
];

export function getLanguageInfo(code?: string): LanguageInfo | undefined {
  if (!code) {
    return SUPPORTED_LANGUAGES.find((lang) => lang.code === 'en');
  }
  return SUPPORTED_LANGUAGES.find(
    (lang) => lang.code.toLowerCase() === code.toLowerCase()
  );
}
```

### Unsupported Languages for OpenAI JSON Mode

**File**: `src/server/services/ai.service.ts` and `src/server/services/aiContent.service.ts`

```typescript
// Languages that OpenAI JSON mode doesn't support well
const unsupportedLanguages = ['hi', 'ar', 'zh', 'ja', 'ko', 'th'];

// Check if language is unsupported
if (unsupportedLanguages.includes(language.toLowerCase())) {
  // Route directly to Gemini
  const gemini = getGemini();
  if (gemini) {
    return await generateWithGemini(input);
  }
}
```

---

## AI Provider Selection

### Provider Initialization

**File**: `src/server/services/ai.service.ts`

```typescript
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
```

### Provider Selection Logic

```typescript
async function generateOutlineWithProviders(
  input: GenerateOutlineInput
): Promise<GeneratedOutline> {
  const language = input.language || 'en';
  const unsupportedLanguages = ['hi', 'ar', 'zh', 'ja', 'ko', 'th'];
  
  // Step 1: Check if Hindi (or other unsupported language)
  if (unsupportedLanguages.includes(language.toLowerCase())) {
    const gemini = getGemini();
    if (gemini) {
      return await generateWithGemini(input); // Direct to Gemini
    }
  }
  
  // Step 2: Try OpenAI first (for supported languages)
  const openai = getOpenAI();
  if (openai) {
    try {
      return await generateWithOpenAI(input);
    } catch (error: any) {
      // Step 3: Fallback to Gemini on error
      const gemini = getGemini();
      if (gemini) {
        try {
          return await generateWithGemini(input);
        } catch (geminiError: any) {
          throw new Error(`Both AI providers failed. OpenAI: ${error.message}, Gemini: ${geminiError.message}`);
        }
      }
      throw error;
    }
  }
  
  // Step 4: OpenAI not configured, try Gemini
  const gemini = getGemini();
  if (gemini) {
    return await generateWithGemini(input);
  }
  
  throw new Error('No AI provider configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY');
}
```

---

## Course Outline Generation

### API Endpoint

**File**: `app/api/generate/outline/route.ts`

```typescript
export const POST = withAuth(async (req: NextAuthRequest) => {
  const { topic, language, subtopics, courseId } = await req.json();
  
  // For Hindi, increase timeout (Gemini may have quota retries)
  const unsupportedLanguages = ['hi', 'ar', 'zh', 'ja', 'ko', 'th'];
  const isUnsupportedLanguage = unsupportedLanguages.includes(language?.toLowerCase() || '');
  const timeoutDuration = isUnsupportedLanguage ? 90000 : 45000; // 90s for Hindi
  
  const result = await generateWithTimeout(
    topic.trim(),
    language || 'en',
    subtopics || [],
    req.user!.plan,
    userId,
    courseId
  );
  
  return NextResponse.json({
    courseId: result.course._id.toString(),
    outline: {
      title: result.outline.title,
      language: result.outline.language,
      summary: result.outline.summary,
      modules: result.outline.modules,
    },
  });
});
```

### Outline Generation with Gemini (Hindi)

**File**: `src/server/services/ai.service.ts`

```typescript
async function generateWithGemini(
  input: GenerateOutlineInput, 
  retryCount: number = 0
): Promise<GeneratedOutline> {
  const gemini = getGemini();
  if (!gemini) {
    throw new Error('Gemini client not available');
  }

  const { topic, language = 'en', subtopics = [], userPlan } = input;
  
  // Process subtopics
  const processedSubtopics = subtopics
    .slice(0, 5)
    .map(s => s.trim().substring(0, 80));
  
  const subtopicsText = processedSubtopics.length > 0 
    ? processedSubtopics.join(', ') 
    : 'none';
  
  // Build Hindi-specific prompt
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
    // Use Gemini with JSON mode
    const model = gemini.getGenerativeModel({ 
      model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json', // Critical for JSON output
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini');
    }

    // Parse and validate
    let outline = parseOutlineResponse(text);
    outline = enforceOutlineConstraints(outline, userPlan);
    
    return outline;
  } catch (error: any) {
    // Handle quota errors with retry
    if (isGeminiQuotaError(error) && retryCount < 1) {
      const retryDelay = extractRetryDelay(error);
      const cappedDelay = Math.min(retryDelay, 30000);
      await new Promise(resolve => setTimeout(resolve, cappedDelay));
      return await generateWithGemini(input, retryCount + 1);
    }
    
    // Retry with lower temperature if parsing fails
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      const model = gemini.getGenerativeModel({ 
        model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      let outline = parseOutlineResponse(text);
      outline = enforceOutlineConstraints(outline, userPlan);
      return outline;
    }
    
    throw error;
  }
}
```

### Response Parsing

```typescript
function parseOutlineResponse(response: string): GeneratedOutline {
  try {
    // Remove markdown code blocks if present
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

    // Validate modules and lessons structure
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
```

---

## Lesson Content Generation

### API Endpoint

**File**: `app/api/generate/content/route.ts`

```typescript
export const POST = withAuth(async (req: NextAuthRequest) => {
  const body = await req.json();
  const { courseId, moduleOrder, lessonOrder, audienceLevel } = body;
  
  // Load course (includes language)
  const course = await Course.findById(courseId);
  
  // Generate content for lessons
  const content = await generateLessonContent({
    courseTitle: course.title,
    language: course.language, // 'hi' for Hindi
    moduleTitle: module.title,
    lessonTitle: lesson.title,
    lessonSummary: lesson.summary,
    audienceLevel: audienceLevel || 'beginner',
    lessonId: lesson._id?.toString(),
  });
  
  // Save to database
  lesson.content = {
    theoryMd: content.theoryMd,
    exampleMd: content.exampleMd,
    exerciseMd: content.exerciseMd,
    keyTakeaways: content.keyTakeaways,
    media: content.media,
    quiz: content.quiz,
    estimatedMinutes: content.estimatedMinutes,
  };
  
  await course.save();
  
  return NextResponse.json({ updatedCount: 1 });
});
```

### Lesson Content Generation with Gemini (Hindi)

**File**: `src/server/services/aiContent.service.ts`

```typescript
export async function generateLessonContent(
  input: GenerateLessonContentInput
): Promise<LessonContentDTO> {
  const language = input.language || 'en';
  const unsupportedLanguages = ['hi', 'ar', 'zh', 'ja', 'ko', 'th'];
  
  // For Hindi, use Gemini directly
  if (unsupportedLanguages.includes(language.toLowerCase())) {
    const gemini = getGemini();
    if (gemini) {
      return await generateWithRetry(() => generateWithGemini(input), 'Gemini');
    }
  }
  
  // Try OpenAI first, fallback to Gemini on error
  const openai = getOpenAI();
  if (openai) {
    try {
      return await generateWithRetry(() => generateWithOpenAI(input), 'OpenAI');
    } catch (error: any) {
      const gemini = getGemini();
      if (gemini) {
        return await generateWithRetry(() => generateWithGemini(input), 'Gemini');
      }
      throw error;
    }
  }
  
  throw new Error('No AI provider configured');
}
```

### Building Hindi Lesson Content Prompt

```typescript
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
- Inline math: wrap with single dollar signs $expression$ (e.g., $x^n$, $f'(x) = n \\cdot x^{n-1}$, $b^2 - 2ac$)
- Block math: wrap with double dollar signs $$expression$$ for centered equations

Required JSON fields
1. theoryMd - 800-1200 words. Provide a complete learning journey:
   - Start with fundamental concepts and definitions
   - Progress through intermediate applications and techniques
   - Conclude with advanced concepts, best practices, and real-world applications
   - Use clear Markdown headings (##, ###) to structure the progression
   - Include practical insights and industry knowledge
   - ALWAYS use LaTeX format for all mathematical expressions
2. exampleMd - 400-600 words. Provide multiple examples showing progression
3. exerciseMd - 300-500 words. Create a comprehensive exercise
4. keyTakeaways - 5-8 comprehensive bullet points
5. media - REQUIRED array with 1-3 relevant images
6. quiz - 4-6 questions covering beginner to advanced concepts
7. estimatedMinutes - realistic duration between 15 and 45 minutes

Return ONLY JSON exactly matching this shape (no markdown fences, no commentary):
{
  "theoryMd": "string",
  "exampleMd": "string",
  "exerciseMd": "string",
  "keyTakeaways": ["string"],
  "media": [
    { "type": "image", "url": null, "alt": "descriptive text", "prompt": "detailed search query" }
  ],
  "quiz": { 
    "questions": [
      { 
        "stem": "string", 
        "options": ["string", "string", "string", "string"], 
        "answerIndex": 0, 
        "rationale": "string" 
      }
    ]
  },
  "estimatedMinutes": 10
}

Respond in ${language}. Create content that serves learners at all levels.`;
}
```

### Generating with Gemini (Hindi)

```typescript
async function generateWithGemini(
  input: GenerateLessonContentInput, 
  retryCount: number = 0
): Promise<LessonContentDTO> {
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
        responseMimeType: 'application/json', // Critical for JSON output
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
    let enhancedContent = await enhanceMediaWithImages(
      parsedContent, 
      input.lessonTitle, 
      input.courseTitle, 
      input.language
    );
    
    // Automatically search for and enhance videos
    enhancedContent = await enhanceMediaWithVideos(enhancedContent, input.lessonTitle);
    
    return enhancedContent;
  } catch (error: any) {
    // Handle quota errors with retry
    if (isGeminiQuotaError(error) && retryCount < 1) {
      const retryDelay = extractRetryDelay(error);
      const cappedDelay = Math.min(retryDelay, 30000);
      await new Promise(resolve => setTimeout(resolve, cappedDelay));
      return await generateWithGemini(input, retryCount + 1);
    }
    
    // Retry with lower temperature if parsing fails
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      const genModel = gemini.getGenerativeModel({ 
        model,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const result = await genModel.generateContent(prompt);
      const text = result.response.text();
      const parsedContent = parseLessonContent(text);
      
      let enhancedContent = await enhanceMediaWithImages(
        parsedContent, 
        input.lessonTitle, 
        input.courseTitle, 
        input.language
      );
      enhancedContent = await enhanceMediaWithVideos(enhancedContent, input.lessonTitle);
      return enhancedContent;
    }
    
    throw error;
  }
}
```

---

## Translation Services

### Translation Service Overview

**File**: `src/server/services/translation.service.ts`

The translation service handles translating text between languages, primarily used for:
- Image search queries (translate Hindi to English for better search results)
- Metadata translation
- Content translation when needed

### Translation Implementation

```typescript
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
      throw error;
    }
  }

  // OpenAI not configured, try Gemini
  const gemini = getGemini();
  if (gemini) {
    return await translateWithGemini(request);
  }

  throw new Error('No AI provider configured for translation');
}
```

### Translating Image Search Queries

**File**: `src/server/services/aiContent.service.ts`

```typescript
/**
 * Translate text to English if it's non-English
 */
async function translateToEnglishIfNeeded(
  text: string, 
  sourceLanguage?: string
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  
  // Skip translation if already English
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
 * Detect if text is likely non-English
 */
function isNonEnglish(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  // Check for non-ASCII characters
  const nonAsciiRegex = /[^\u0020-\u007F]/;
  if (!nonAsciiRegex.test(text)) return false;
  
  // Check English word ratio
  const englishWordRatio = (text.match(/[a-zA-Z]+/g) || []).length;
  const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;
  
  return englishWordRatio / totalWords < 0.3;
}

/**
 * Enhance media with images (translates Hindi prompts to English for search)
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

  const enhancedMedia = await Promise.all(
    content.media.map(async (mediaItem) => {
      if (mediaItem.type !== 'image' || mediaItem.url || !mediaItem.prompt) {
        return mediaItem;
      }
      
      // Translate Hindi prompt to English for image search
      const translatedPrompt = await translateToEnglishIfNeeded(
        mediaItem.prompt, 
        language
      );
      const translatedLessonTitle = lessonTitle 
        ? await translateToEnglishIfNeeded(lessonTitle, language) 
        : lessonTitle;
      
      // Search for images using translated prompt
      const searchResult = await searchImages(translatedPrompt, 1);
      
      if (searchResult && searchResult.results && searchResult.results.length > 0) {
        const imageUrl = extractImageUrlFromResult(searchResult);
        if (imageUrl) {
          return {
            ...mediaItem,
            url: imageUrl.url,
            prompt: translatedPrompt
          };
        }
      }
      
      return mediaItem;
    })
  );

  return {
    ...content,
    media: enhancedMedia
  };
}
```

---

## Complete Code Examples

### Example 1: Generate Hindi Course Outline

```typescript
import { generateCourseOutline } from '@/src/server/services/ai.service';

async function createHindiCourse() {
  const outline = await generateCourseOutline({
    topic: 'Python प्रोग्रामिंग',
    language: 'hi',
    subtopics: ['बेसिक सिंटैक्स', 'डेटा स्ट्रक्चर', 'OOP'],
    userPlan: 'free'
  });
  
  console.log('Course Title:', outline.title);
  console.log('Language:', outline.language); // 'hi'
  console.log('Modules:', outline.modules.length);
  
  // Save to database
  const course = new Course({
    userId: userId,
    title: outline.title,
    language: outline.language,
    summary: outline.summary,
    modules: outline.modules.map((m) => ({
      order: m.order,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        order: l.order,
        title: l.title,
        content: undefined,
      })),
    })),
  });
  
  await course.save();
  return course;
}
```

### Example 2: Generate Hindi Lesson Content

```typescript
import { generateLessonContent } from '@/src/server/services/aiContent.service';

async function createHindiLesson() {
  const content = await generateLessonContent({
    courseTitle: 'Python प्रोग्रामिंग',
    language: 'hi',
    moduleTitle: 'बेसिक सिंटैक्स',
    lessonTitle: 'वेरिएबल और डेटा टाइप',
    lessonSummary: 'Python में वेरिएबल कैसे बनाएं',
    audienceLevel: 'beginner',
  });
  
  console.log('Theory:', content.theoryMd); // Hindi markdown
  console.log('Examples:', content.exampleMd); // Hindi markdown
  console.log('Quiz Questions:', content.quiz.questions.length);
  
  // Save to lesson
  lesson.content = {
    theoryMd: content.theoryMd,
    exampleMd: content.exampleMd,
    exerciseMd: content.exerciseMd,
    keyTakeaways: content.keyTakeaways,
    media: content.media,
    quiz: content.quiz,
    estimatedMinutes: content.estimatedMinutes,
  };
  
  await course.save();
}
```

### Example 3: API Request Example

```typescript
// POST /api/generate/outline
const response = await fetch('/api/generate/outline', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    topic: 'Python प्रोग्रामिंग',
    language: 'hi',
    subtopics: ['बेसिक सिंटैक्स', 'डेटा स्ट्रक्चर']
  })
});

const data = await response.json();
// {
//   courseId: "...",
//   outline: {
//     title: "Python प्रोग्रामिंग का परिचय",
//     language: "hi",
//     summary: "...",
//     modules: [...]
//   }
// }
```

### Example 4: Complete Flow Integration

```typescript
async function generateCompleteHindiCourse(topic: string, userId: string) {
  // Step 1: Generate outline
  const outline = await generateCourseOutline({
    topic,
    language: 'hi',
    userPlan: 'free'
  });
  
  // Step 2: Create course in database
  const course = new Course({
    userId,
    title: outline.title,
    language: outline.language,
    summary: outline.summary,
    modules: outline.modules.map(m => ({
      order: m.order,
      title: m.title,
      lessons: m.lessons.map(l => ({
        order: l.order,
        title: l.title,
        content: undefined,
      })),
    })),
  });
  await course.save();
  
  // Step 3: Generate content for each lesson
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      const content = await generateLessonContent({
        courseTitle: course.title,
        language: course.language, // 'hi'
        moduleTitle: module.title,
        lessonTitle: lesson.title,
        lessonSummary: lesson.summary,
        audienceLevel: 'beginner',
        lessonId: lesson._id.toString(),
      });
      
      lesson.content = {
        theoryMd: content.theoryMd,
        exampleMd: content.exampleMd,
        exerciseMd: content.exerciseMd,
        keyTakeaways: content.keyTakeaways,
        media: content.media,
        quiz: content.quiz,
        estimatedMinutes: content.estimatedMinutes,
      };
    }
  }
  
  await course.save();
  return course;
}
```

---

## Error Handling

### Quota Error Handling

```typescript
function isGeminiQuotaError(error: any): boolean {
  const errorMessage = error?.message || '';
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('quota exceeded') ||
    errorMessage.includes('Quota exceeded') ||
    error?.status === 429
  );
}

function extractRetryDelay(error: any): number {
  try {
    const errorMessage = error?.message || '';
    const retryMatch = errorMessage.match(/Please retry in ([\d.]+)s/i);
    if (retryMatch) {
      return Math.ceil(parseFloat(retryMatch[1]) * 1000);
    }
    
    if (error?.details) {
      for (const detail of error.details) {
        if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
          const seconds = parseFloat(detail.retryDelay.replace('s', ''));
          return Math.ceil(seconds * 1000);
        }
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return 20000; // Default: 20 seconds
}
```

### Timeout Handling

```typescript
// In route handler
const unsupportedLanguages = ['hi', 'ar', 'zh', 'ja', 'ko', 'th'];
const isUnsupportedLanguage = unsupportedLanguages.includes(language?.toLowerCase() || '');
const timeoutDuration = isUnsupportedLanguage ? 90000 : 45000; // 90s for Hindi

const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error('Request timeout'));
  }, timeoutDuration);
});

const generatePromise = generateCourseOutline({ topic, language, subtopics });

return Promise.race([generatePromise, timeoutPromise]);
```

### Retry Logic

```typescript
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
```

---

## Best Practices

### 1. Environment Variables

```bash
# .env file
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
OPENAI_MODEL=gpt-4o
GOOGLE_MODEL=gemini-2.0-flash-exp
GEMINI_CONTENT_TIMEOUT_MS=120000
```

### 2. Language Detection

Always check language before routing:
```typescript
const unsupportedLanguages = ['hi', 'ar', 'zh', 'ja', 'ko', 'th'];
if (unsupportedLanguages.includes(language.toLowerCase())) {
  // Use Gemini directly
}
```

### 3. JSON Mode Configuration

For Gemini, always use `responseMimeType: 'application/json'`:
```typescript
const model = gemini.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.7,
    responseMimeType: 'application/json', // Critical!
  },
});
```

### 4. Error Handling

Always implement:
- Quota error detection and retry
- Timeout handling (longer for Hindi/Gemini)
- Fallback between providers
- JSON parsing error recovery

### 5. Translation for Search

Translate Hindi text to English for image/video searches:
```typescript
const translatedPrompt = await translateToEnglishIfNeeded(
  hindiPrompt, 
  'hi'
);
const searchResult = await searchImages(translatedPrompt);
```

---

## Summary

The Hindi course generation system:

1. **Detects Hindi** (`hi`) as an unsupported language for OpenAI JSON mode
2. **Routes to Gemini** directly for Hindi content generation
3. **Uses JSON mode** (`responseMimeType: 'application/json'`) for structured output
4. **Handles errors** with retry logic, quota management, and timeouts
5. **Translates metadata** (image search queries) from Hindi to English
6. **Validates responses** with comprehensive parsing and error handling
7. **Falls back gracefully** between OpenAI and Gemini providers

This approach ensures reliable Hindi course generation while maintaining compatibility with other languages through the dual-provider architecture.

