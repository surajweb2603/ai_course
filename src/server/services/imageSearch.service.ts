
import axios from 'axios';

// Type declaration for g-i-s library
interface GISResult {
  url: string;
  title: string;
  description: string;
  domain: string;
  height: number;
  width: number;
  thumbnail: string;
}

type GISModule = (query: string, callback: (error: any, results: GISResult[]) => void) => void;

let gis: GISModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  gis = require('g-i-s') as GISModule;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
}

/**
 * Advanced Google Images scraper that bypasses blocking
 * Uses multiple strategies to avoid Google's anti-bot measures
 */
async function customGoogleImagesScraper(query: string): Promise<GISResult[]> {
  
  // Try multiple strategies to bypass blocking
  const strategies = [
    {
      name: 'Direct Google Search',
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    },
    {
      name: 'Google Images with Referer',
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.google.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    },
    {
      name: 'Mobile User Agent',
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    }
  ];
  
  for (const strategy of strategies) {
    
    try {
      const response = await axios.get(strategy.url, {
        headers: strategy.headers,
        timeout: 15000,
        validateStatus: (status) => status < 500 // Accept redirects and client errors
      });
      
      // Check if we got a valid response
      if (response.status === 200 && (response.data as string).length > 1000) {
        const imageUrls = extractImageUrls(String(response.data), query);
        
        if (imageUrls.length > 0) {
          // Convert to GISResult format
          const results: GISResult[] = imageUrls.map((url, index) => ({
            url: url,
            title: `${query} - Image ${index + 1}`,
            description: `Image related to ${query}`,
            domain: extractDomain(url),
            height: 0,
            width: 0,
            thumbnail: url
          }));
          
          return results;
        }
      } else if (response.status === 429) {
        // Rate limited, wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Try next strategy
      }
      
    } catch (error: any) {
      
      if (error.response?.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  
  return [];
}

/**
 * Extract image URLs from Google's HTML response
 */
function extractImageUrls(html: string, query: string): string[] {
  const imageUrls: string[] = [];
  
  // Multiple regex patterns to find image URLs
  const patterns = [
    /"ou":"([^"]+)"/g,  // Original pattern
    /"ru":"([^"]+)"/g,  // Alternative pattern
    /"imgurl":"([^"]+)"/g,  // Direct image URL
    /"src":"([^"]+\.(jpg|jpeg|png|gif|webp))"/g,  // Direct image sources
    /data-src="([^"]+\.(jpg|jpeg|png|gif|webp))"/g  // Lazy loaded images
  ];
  
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null && imageUrls.length < 15) {
      const url = match[1];
      // Block SVG images
      if (url && url.toLowerCase().endsWith('.svg')) {
        continue;
      }
      if (url && url.startsWith('http') && !imageUrls.includes(url)) {
        // Validate URL
        try {
          new URL(url);
          imageUrls.push(url);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }
  }
  
  return imageUrls;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return 'Unknown';
  }
}

export interface ImageSearchResult {
  title: string;
  link: string;
  displayLink: string;
  snippet: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}


/**
 * Enhance search query for better educational results with focus on diagrams
 * Now focuses on topic-specific relevance rather than generic educational terms
 */
function enhanceSearchQuery(query: string): string {
  
  const queryLower = query.toLowerCase();
  
  // Extract the core topic from the query
  const coreTopic = extractCoreTopic(query);
  
  // Build topic-specific diagram query
  let enhancedQuery = query;
  
  // Only add diagram terms if they're not already present and relevant to the topic
  const diagramTerms = ['diagram', 'chart', 'infographic', 'flowchart', 'visualization', 'illustration', 'schema', 'blueprint'];
  const hasDiagramTerms = diagramTerms.some(term => queryLower.includes(term));
  
  if (!hasDiagramTerms) {
    // Add specific diagram types based on the core topic
    if (coreTopic.includes('programming') || coreTopic.includes('code') || coreTopic.includes('algorithm')) {
      enhancedQuery = `${query} programming flowchart diagram`;
    } else if (coreTopic.includes('data') || coreTopic.includes('analysis') || coreTopic.includes('statistics')) {
      enhancedQuery = `${query} data visualization chart`;
    } else if (coreTopic.includes('process') || coreTopic.includes('workflow') || coreTopic.includes('steps')) {
      enhancedQuery = `${query} process flowchart diagram`;
    } else if (coreTopic.includes('architecture') || coreTopic.includes('system') || coreTopic.includes('structure')) {
      enhancedQuery = `${query} architecture diagram schema`;
    } else if (coreTopic.includes('machine learning') || coreTopic.includes('ai') || coreTopic.includes('neural')) {
      enhancedQuery = `${query} neural network diagram architecture`;
    } else if (coreTopic.includes('database') || coreTopic.includes('sql') || coreTopic.includes('data model')) {
      enhancedQuery = `${query} database schema diagram`;
    } else {
      // For general topics, add specific diagram terms
      enhancedQuery = `${query} concept diagram visualization`;
    }
  }
  
  // Add educational context only if it helps with the specific topic
  const educationalTerms = ['educational', 'tutorial', 'learning', 'academic', 'study'];
  const hasEducationalContext = educationalTerms.some(term => queryLower.includes(term));
  
  if (!hasEducationalContext && coreTopic.length > 0) {
    // Only add educational context if it's relevant to the core topic
    enhancedQuery = `${enhancedQuery} tutorial guide`;
  }
  
  // Remove noise terms that don't help with topic-specific diagrams
  const noiseTerms = ['meme', 'poster', 'wallpaper', 'aesthetic', 'art', 'funny', 'photo', 'picture', 'image'];
  const hasNoiseTerms = noiseTerms.some(term => queryLower.includes(term));
  
  if (hasNoiseTerms) {
    // Remove noise terms and add topic-specific diagram context
    let cleanQuery = enhancedQuery;
    noiseTerms.forEach(term => {
      cleanQuery = cleanQuery.replace(new RegExp(term, 'gi'), '');
    });
    enhancedQuery = `${cleanQuery.trim()} ${coreTopic} diagram`;
  }
  
  return enhancedQuery;
}

/**
 * Extract the core topic from a query to focus search on relevant content
 */
function extractCoreTopic(query: string): string {
  const queryLower = query.toLowerCase();
  
  // Define topic categories and their keywords
  const topicCategories = {
    'programming': ['programming', 'code', 'coding', 'python', 'javascript', 'java', 'algorithm', 'function', 'syntax', 'variable', 'loop', 'array', 'object', 'class', 'method'],
    'data science': ['data', 'analysis', 'statistics', 'machine learning', 'ai', 'artificial intelligence', 'neural', 'deep learning', 'data science', 'model', 'training', 'prediction'],
    'web development': ['web', 'html', 'css', 'javascript', 'react', 'angular', 'vue', 'frontend', 'backend', 'api', 'database', 'server'],
    'database': ['database', 'sql', 'data model', 'dbms', 'table', 'query', 'index', 'relationship', 'schema', 'normalization'],
    'business': ['business', 'marketing', 'management', 'strategy', 'finance', 'economics', 'entrepreneurship', 'leadership'],
    'science': ['science', 'chemistry', 'biology', 'physics', 'mathematics', 'math', 'algebra', 'calculus', 'geometry'],
    'design': ['design', 'ui', 'ux', 'user interface', 'user experience', 'graphic', 'visual', 'layout', 'typography']
  };
  
  // Find the most relevant topic category
  for (const [category, keywords] of Object.entries(topicCategories)) {
    const matchCount = keywords.filter(keyword => queryLower.includes(keyword)).length;
    if (matchCount > 0) {
      return category;
    }
  }
  
  // If no specific category found, extract key terms from the query
  const words = queryLower.split(/\s+/).filter(word => 
    word.length > 3 && 
    !['the', 'and', 'or', 'for', 'with', 'from', 'into', 'onto', 'upon', 'about', 'over', 'under', 'through', 'what', 'how', 'why', 'when', 'where'].includes(word)
  );
  
  return words.slice(0, 2).join(' '); // Return first 2 meaningful words
}

/**
 * Validate if an image result is educationally appropriate and topic-relevant
 * Now uses stricter validation to ensure images are actually related to the topic
 */
function validateEducationalImage(result: any, originalQuery: string): boolean {
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const altDescription = (result.alt_description || '').toLowerCase();
  const tags = (result.tags || '').toLowerCase();
  
  
  const originalQueryLower = originalQuery.toLowerCase();
  const coreTopic = extractCoreTopic(originalQuery);
  
  // Check for noise terms that should be filtered out
  // But allow results that contain query terms even if they have noise terms (for auto-generated titles)
  const noiseTerms = ['meme', 'poster', 'wallpaper', 'aesthetic', 'funny', 'joke', 'comic', 'cartoon'];
  const hasNoiseTerms = noiseTerms.some(term => 
    title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
  );
  
  // Check if title/snippet contains key query terms (allows auto-generated titles like "query - Image 1")
  // Extract meaningful words from query (excluding common stopwords but keeping educational terms)
  const queryWords = originalQueryLower.split(/\s+/).filter(word => 
    word.length > 2 && 
    !['the', 'and', 'or', 'for', 'with', 'from', 'into', 'onto', 'upon', 'about', 'over', 'under', 'through', 'what', 'how', 'why', 'when', 'where'].includes(word)
  );
  const hasQueryTerms = queryWords.length > 0 && queryWords.some(word =>
    title.includes(word) || snippet.includes(word) || altDescription.includes(word) || tags.includes(word)
  );
  
  // Only reject for noise terms if the result doesn't contain query terms
  if (hasNoiseTerms && !hasQueryTerms) {
    return false;
  }
  
  // STRICT TOPIC RELEVANCE CHECK - Must have topic-specific terms
  const topicRelevanceScore = calculateTopicRelevance(result, originalQueryLower, coreTopic);
  
  // Allow results with query terms even if score is lower (for auto-generated titles)
  if (topicRelevanceScore < 3 && !hasQueryTerms) {
    return false;
  }
  
  // Don't allow auto-generated titles without proper validation
  // Auto-generated titles like "query - Image 1" will have query terms but low relevance
  // Require minimum relevance score of 3 even if query terms are present
  if (hasQueryTerms && topicRelevanceScore >= 3) {
    return true;
  }
  
  // Prioritize diagram and visual content with topic relevance
  const diagramTerms = [
    'diagram', 'chart', 'infographic', 'flowchart', 'visualization', 'illustration', 
    'schema', 'blueprint', 'architecture', 'structure', 'process', 'workflow',
    'algorithm', 'data structure', 'neural network', 'database', 'system'
  ];
  const hasDiagramTerms = diagramTerms.some(term => 
    title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
  );
  
  if (hasDiagramTerms && topicRelevanceScore >= 3) {
    return true;
  }
  
  // Check for educational relevance WITH topic specificity
  const educationalTerms = [
    'tutorial', 'learn', 'beginner', 'example', 'educational', 'training', 'guide',
    'academic', 'course', 'lesson', 'study', 'research', 'analysis', 'method'
  ];
  const hasEducationalTerms = educationalTerms.some(term => 
    title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
  );
  
  if (hasEducationalTerms && topicRelevanceScore >= 4) {
    return true;
  }
  
  // Final check: Must have both topic relevance AND educational value
  if (topicRelevanceScore >= 5) {
    return true;
  }
  
  return false;
}

/**
 * Calculate topic relevance score for an image result
 */
function calculateTopicRelevance(result: any, originalQuery: string, coreTopic: string): number {
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const altDescription = (result.alt_description || '').toLowerCase();
  const tags = (result.tags || '').toLowerCase();
  
  let score = 0;
  
  // Extract key terms from the original query (keep educational terms for relevance scoring)
  const queryTerms = originalQuery.toLowerCase().split(/\s+/).filter(term => 
    term.length > 2 && 
    !['the', 'and', 'or', 'for', 'with', 'from', 'into', 'onto', 'upon', 'about', 'over', 'under', 'through', 'what', 'how', 'why', 'when', 'where'].includes(term)
  );
  
  // Check for exact query term matches (highest score)
  // This allows auto-generated titles like "query - Image 1" to score well
  const exactMatches = queryTerms.filter(term => 
    title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
  );
  score += exactMatches.length * 2; // 2 points per exact match
  
  // Bonus if title contains most/all of the query (for auto-generated titles)
  if (queryTerms.length > 0 && exactMatches.length >= Math.ceil(queryTerms.length * 0.5)) {
    score += 2; // Bonus for having majority of query terms
  }
  
  // Check for core topic relevance
  if (coreTopic && (title.includes(coreTopic) || snippet.includes(coreTopic) || altDescription.includes(coreTopic) || tags.includes(coreTopic))) {
    score += 3; // 3 points for core topic match
  }
  
  // Check for topic-specific technical terms
  const technicalTerms = getTopicSpecificTerms(coreTopic);
  const technicalMatches = technicalTerms.filter(term => 
    title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
  );
  score += technicalMatches.length; // 1 point per technical term match
  
  // Bonus for educational context with topic relevance
  const educationalTerms = ['tutorial', 'learn', 'example', 'educational', 'guide', 'course', 'lesson'];
  const hasEducationalContext = educationalTerms.some(term => 
    title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
  );
  
  if (hasEducationalContext && score > 0) {
    score += 1; // Bonus for educational context
  }
  
  return Math.min(score, 10); // Cap at 10
}

/**
 * Get topic-specific technical terms for relevance checking
 */
function getTopicSpecificTerms(coreTopic: string): string[] {
  const topicTerms: { [key: string]: string[] } = {
    'programming': ['code', 'function', 'variable', 'loop', 'array', 'object', 'class', 'method', 'syntax', 'algorithm', 'debug', 'compile', 'runtime', 'framework', 'library', 'api'],
    'data science': ['data', 'analysis', 'statistics', 'machine learning', 'ai', 'neural', 'model', 'training', 'prediction', 'classification', 'regression', 'clustering', 'nlp', 'computer vision', 'tensorflow', 'pytorch'],
    'web development': ['web', 'html', 'css', 'javascript', 'react', 'angular', 'vue', 'frontend', 'backend', 'api', 'server', 'client', 'responsive', 'framework'],
    'database': ['database', 'sql', 'table', 'query', 'index', 'relationship', 'schema', 'normalization', 'transaction', 'acid', 'rdbms', 'nosql', 'mongodb', 'mysql'],
    'business': ['business', 'marketing', 'management', 'strategy', 'finance', 'economics', 'entrepreneurship', 'leadership', 'customer', 'revenue', 'profit', 'market'],
    'science': ['science', 'chemistry', 'biology', 'physics', 'mathematics', 'math', 'algebra', 'calculus', 'geometry', 'formula', 'equation', 'theorem', 'hypothesis'],
    'design': ['design', 'ui', 'ux', 'user interface', 'user experience', 'graphic', 'visual', 'layout', 'typography', 'color', 'font', 'branding']
  };
  
  return topicTerms[coreTopic] || [];
}

/**
 * Validate topic-specific relevance to avoid completely unrelated content
 */
function validateTopicSpecificRelevance(result: any, originalQueryLower: string): boolean | null {
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const altDescription = (result.alt_description || '').toLowerCase();
  const tags = (result.tags || '').toLowerCase();
  
  // WEB3/Blockchain/Crypto topics
  if (originalQueryLower.includes('web3') || originalQueryLower.includes('blockchain') || 
      originalQueryLower.includes('crypto') || originalQueryLower.includes('decentralized') ||
      originalQueryLower.includes('defi') || originalQueryLower.includes('nft') ||
      originalQueryLower.includes('dao') || originalQueryLower.includes('smart contract')) {
    
    const web3Terms = ['blockchain', 'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'web3', 'decentralized', 'defi', 'nft', 'dao', 'smart contract', 'dapp', 'metaverse', 'token', 'wallet', 'mining', 'consensus', 'hash', 'merkle', 'distributed ledger'];
    const hasWeb3Terms = web3Terms.some(term => 
      title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
    );
    
    if (hasWeb3Terms) {
      return true;
    }
    
    // Reject agricultural, medical, or completely unrelated content
    const unrelatedTerms = ['agriculture', 'farming', 'crop', 'livestock', 'supply chain', 'medical', 'health', 'biology', 'chemistry', 'physics', 'sports', 'entertainment'];
    const hasUnrelatedTerms = unrelatedTerms.some(term => 
      title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
    );
    
    if (hasUnrelatedTerms) {
      return false;
    }
  }
  
  // Programming topics
  if (originalQueryLower.includes('programming') || originalQueryLower.includes('code') || 
      originalQueryLower.includes('python') || originalQueryLower.includes('javascript') ||
      originalQueryLower.includes('java') || originalQueryLower.includes('algorithm')) {
    
    const programmingTerms = ['programming', 'code', 'algorithm', 'function', 'variable', 'loop', 'array', 'object', 'class', 'method', 'syntax', 'debug', 'compile', 'runtime', 'framework', 'library', 'api', 'database', 'sql'];
    const hasProgrammingTerms = programmingTerms.some(term => 
      title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
    );
    
    if (hasProgrammingTerms) {
      return true;
    }
  }
  
  // Machine Learning/AI topics
  if (originalQueryLower.includes('machine learning') || originalQueryLower.includes('ai') || 
      originalQueryLower.includes('artificial intelligence') || originalQueryLower.includes('neural') ||
      originalQueryLower.includes('deep learning') || originalQueryLower.includes('data science')) {
    
    const aiTerms = ['machine learning', 'artificial intelligence', 'ai', 'neural network', 'deep learning', 'algorithm', 'data science', 'model', 'training', 'prediction', 'classification', 'regression', 'clustering', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'scikit', 'pandas', 'numpy'];
    const hasAiTerms = aiTerms.some(term => 
      title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
    );
    
    if (hasAiTerms) {
      return true;
    }
  }
  
  // Database topics
  if (originalQueryLower.includes('database') || originalQueryLower.includes('sql') || 
      originalQueryLower.includes('data model') || originalQueryLower.includes('dbms')) {
    
    const databaseTerms = ['database', 'sql', 'table', 'query', 'index', 'relationship', 'schema', 'normalization', 'transaction', 'acid', 'rdbms', 'nosql', 'mongodb', 'mysql', 'postgresql', 'oracle', 'sqlite'];
    const hasDatabaseTerms = databaseTerms.some(term => 
      title.includes(term) || snippet.includes(term) || altDescription.includes(term) || tags.includes(term)
    );
    
    if (hasDatabaseTerms) {
      return true;
    }
  }
  
  // Return null to continue with general validation
  return null;
}

/**
 * Search for images using g-i-s library (Google Image Search scraping)
 * FINAL FIX: Uses alternative image sources when Google blocks
 */
export async function searchGoogleImages(query: string, numResults: number = 5): Promise<ImageSearchResult[]> {
  const transformAndValidate = (source: string, results: GISResult[]): ImageSearchResult[] => {
    if (!results || results.length === 0) {
      return [];
    }

    const transformedResults: ImageSearchResult[] = results.slice(0, numResults).map((result: GISResult, index: number) => ({
      title: result.title || `${query} - Image ${index + 1}`,
      link: result.url,
      displayLink: result.domain || extractDomain(result.url) || 'Unknown',
      snippet: result.description || '',
      image: {
        contextLink: result.url,
        height: result.height || 0,
        width: result.width || 0,
        byteSize: 0,
        thumbnailLink: result.thumbnail || result.url,
        thumbnailHeight: 150,
        thumbnailWidth: 150
      }
    }));

    const validatedResults = transformedResults.filter((result: ImageSearchResult) => {
      const isValid = validateEducationalImage(result, query);
      if (!isValid) {
        // Filter out invalid results
      }
      return isValid;
    });

    if (validatedResults.length > 0) {
      // Results validated successfully
    }

    return validatedResults;
  };

  // Try g-i-s first (may work in some cases)
  if (gis) {
    try {
      const results = await new Promise<GISResult[]>((resolve, reject) => {
        gis(query, (error: any, results: GISResult[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results || []);
          }
        });
      });

      if (results && results.length > 0) {
        
        const validatedResults = transformAndValidate('g-i-s', results);
        if (validatedResults.length > 0) {
          return validatedResults;
        }
      }
      
      
    } catch (error: any) {
      // Ignore g-i-s errors
    }
  }
  
  // Custom Google scraping fallback (static HTML strategies)
  try {
    const customResults = await customGoogleImagesScraper(query);
    const validatedCustomResults = transformAndValidate('custom-scraper', customResults);
    if (validatedCustomResults.length > 0) {
      return validatedCustomResults;
    }
  } catch (error: any) {
    // Ignore custom scraper errors
  }
  
  // Advanced Google scraping fallback (aggressive heuristics)
  try {
    const advancedResults = await advancedGoogleImagesScraper(query);
    const validatedAdvancedResults = transformAndValidate('advanced-scraper', advancedResults);
    if (validatedAdvancedResults.length > 0) {
      return validatedAdvancedResults;
    }
  } catch (error: any) {
    // Ignore advanced scraper errors
  }

  // If g-i-s fails, try alternative image sources
  
  try {
    const alternativeResults = await searchAlternativeImageSources(query, numResults);
    if (alternativeResults && alternativeResults.length > 0) {
      return alternativeResults;
    }
  } catch (error: any) {
    // Ignore alternative source errors
  }
  
  throw new Error('Google Images search failed: All methods blocked');
}

/**
 * Search alternative image sources when Google is blocked
 */
async function searchAlternativeImageSources(query: string, numResults: number): Promise<ImageSearchResult[]> {
  
  const alternativeSources = [
    {
      name: 'Bing Images',
      url: `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&tsc=ImageBasicHover`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    },
    {
      name: 'DuckDuckGo Images',
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iax=images&ia=images`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    }
  ];
  
  for (const source of alternativeSources) {
    
    try {
      const response = await axios.get(source.url, {
        headers: source.headers,
        timeout: 15000,
        validateStatus: (status) => status < 500
      });
      
      
      if (response.status === 200 && (response.data as string).length > 1000) {
        let imageUrls: string[] = [];

        if (source.name === 'Bing Images') {
          imageUrls = extractBingImageUrls(String(response.data), query);
        } else {
          imageUrls = extractImageUrlsFromHTML(String(response.data), query);
        }
        
        if (imageUrls.length > 0) {
          // Convert to ImageSearchResult format
          const results: ImageSearchResult[] = imageUrls.slice(0, numResults).map((url, index) => ({
            title: `${query} - Image ${index + 1}`,
            link: url,
            displayLink: extractDomain(url),
            snippet: `Image related to ${query}`,
            image: {
              contextLink: url,
              height: 0,
              width: 0,
              byteSize: 0,
              thumbnailLink: url,
              thumbnailHeight: 150,
              thumbnailWidth: 150
            }
          }));
          
          return results;
        }
      }
      
    } catch (error: any) {
      // Ignore alternative source errors
    }
  }
  
  return [];
}

/**
 * Extract image URLs from HTML response
 */
function extractImageUrlsFromHTML(html: string, query: string): string[] {
  const imageUrls: string[] = [];
  
  // Multiple patterns to find image URLs
  const patterns = [
    // Generic image URLs
    /https:\/\/[^"]*\.(jpg|jpeg|png|gif|webp)(\?[^"]*)?/g,
    // Data URLs
    /data-src="([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    /src="([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    // JSON data
    /"url":"([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    /"src":"([^"]+\.(jpg|jpeg|png|gif|webp))"/g
  ];
  
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null && imageUrls.length < 15) {
      let url = match[1] || match[0];
      
      // Clean up the URL
      if (url.startsWith('"') && url.endsWith('"')) {
        url = url.slice(1, -1);
      }
      
      // Block SVG images
      if (url && url.toLowerCase().endsWith('.svg')) {
        continue;
      }
      
      if (url && url.startsWith('http') && !imageUrls.includes(url)) {
        try {
          const urlObj = new URL(url);
          const urlLower = url.toLowerCase();
          const isBingProxy = urlLower.includes('r.bing.com/rp/');
          const isBingCdn = urlLower.includes('://th.bing.com/th/id/') ||
            urlLower.includes('://www.bing.com/th?id=') ||
            urlLower.includes('://c.bing.net/th?id=');

          // Skip Bing proxy redirect URLs outright (they expire quickly)
          if (isBingProxy) {
            continue;
          }

          // Filter out social media and non-image domains
          if (!urlObj.hostname.includes('facebook') && 
              !urlObj.hostname.includes('twitter') &&
              !urlObj.hostname.includes('instagram') &&
              !urlObj.hostname.includes('tiktok') &&
              !url.includes('avatar') &&
              !url.includes('profile') &&
              !url.includes('logo') &&
              !url.includes('icon')) {
            // Allow Bing CDN links even if extension missing
            if (isBingCdn) {
              imageUrls.push(url);
              continue;
            }

            const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
            const hasAllowedExtension = allowedExtensions.some(ext => 
              urlLower.endsWith(ext) ||
              urlLower.includes(`${ext}?`) ||
              urlLower.includes(`${ext}&`)
            );

            if (hasAllowedExtension) {
              imageUrls.push(url);
            }
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }
  }
  
  // Remove duplicates and limit results
  const uniqueUrls = [...new Set(imageUrls)].slice(0, 10);
  
  return uniqueUrls;
}

/**
 * Advanced Google Images scraper that bypasses all blocking
 * Uses multiple sophisticated techniques to avoid detection
 */
/**
 * Build scraping strategies for Google Images
 */
function buildGoogleImageStrategies(query: string): Array<{ name: string; url: string; headers: Record<string, string> }> {
  const baseUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`;
  return [
    {
      name: 'Stealth Desktop',
      url: `${baseUrl}&tbs=isz:m`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1'
      }
    },
    {
      name: 'Mobile Safari',
      url: baseUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    },
    {
      name: 'Chrome Windows',
      url: `${baseUrl}&tbs=isz:m`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'Referer': 'https://www.google.com/'
      }
    },
    {
      name: 'Firefox Linux',
      url: baseUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
        'DNT': '1'
      }
    }
  ];
}

/**
 * Execute a scraping strategy
 */
async function executeScrapingStrategy(strategy: { name: string; url: string; headers: Record<string, string> }, query: string, index: number): Promise<GISResult[] | null> {
  if (index > 0) {
    const delay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  try {
    const response = await axios.get(strategy.url, {
      headers: strategy.headers,
      timeout: 20000,
      validateStatus: (status) => status < 500,
      transformRequest: [(data: any) => data]
    });
    
    if (response.status === 200 && (response.data as string).length > 1000) {
      const imageUrls = extractImageUrlsAdvanced(String(response.data), query);
      if (imageUrls.length > 0) {
        return imageUrls.map((url, idx) => ({
          url: url,
          title: `${query} - Image ${idx + 1}`,
          description: `Image related to ${query}`,
          domain: extractDomain(url),
          height: 0,
          width: 0,
          thumbnail: url
        }));
      }
    } else if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error: any) {
    if (error.response?.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return null;
}

/**
 * Advanced Google Images scraper that bypasses all blocking
 * Uses multiple sophisticated techniques to avoid detection
 */
async function advancedGoogleImagesScraper(query: string): Promise<GISResult[]> {
  const strategies = buildGoogleImageStrategies(query);
  
  for (let i = 0; i < strategies.length; i++) {
    const result = await executeScrapingStrategy(strategies[i], query, i);
    if (result) {
      return result;
    }
  }
  
  return [];
}

/**
 * Advanced image URL extraction with multiple patterns
 */
function extractImageUrlsAdvanced(html: string, query: string): string[] {
  const imageUrls: string[] = [];
  
  // Multiple sophisticated regex patterns to find image URLs
  const patterns = [
    // Google's JSON data patterns
    /"ou":"([^"]+)"/g,
    /"ru":"([^"]+)"/g,
    /"imgurl":"([^"]+)"/g,
    /"imgrefurl":"([^"]+)"/g,
    
    // Direct image sources
    /"src":"([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    /data-src="([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    /src="([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    
    // Base64 and data URLs
    /"data:image\/[^;]+;base64,[^"]+"/g,
    
    // Google's specific image patterns
    /https:\/\/[^"]*\.googleusercontent\.com\/[^"]*\.(jpg|jpeg|png|gif|webp)/g,
    /https:\/\/[^"]*\.googleapis\.com\/[^"]*\.(jpg|jpeg|png|gif|webp)/g,
    
    // Generic image URLs
    /https:\/\/[^"]*\.(jpg|jpeg|png|gif|webp)(\?[^"]*)?/g
  ];
  
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null && imageUrls.length < 20) {
      let url = match[1] || match[0];
      
      // Clean up the URL
      if (url.startsWith('"') && url.endsWith('"')) {
        url = url.slice(1, -1);
      }
      
      // Block SVG images
      if (url && url.toLowerCase().endsWith('.svg')) {
        continue;
      }
      
      if (url && url.startsWith('http') && !imageUrls.includes(url)) {
        // Validate URL
        try {
          const urlObj = new URL(url);
          // Filter out non-image domains and suspicious URLs
          if (!urlObj.hostname.includes('google') && 
              !urlObj.hostname.includes('youtube') && 
              !urlObj.hostname.includes('facebook') &&
              !urlObj.hostname.includes('twitter') &&
              !urlObj.hostname.includes('instagram') &&
              !urlObj.hostname.includes('tiktok') &&
              !url.includes('avatar') &&
              !url.includes('profile') &&
              !url.includes('logo') &&
              !url.includes('icon')) {
            imageUrls.push(url);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }
  }
  
  // Remove duplicates and limit results
  const uniqueUrls = [...new Set(imageUrls)].slice(0, 15);
  
  return uniqueUrls;
}

/**
 * Search for images using Bing Images (middle step)
 */
export async function searchBingImages(query: string, numResults: number = 5): Promise<ImageSearchResult[]> {
  try {
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&tsc=ImageBasicHover&count=${numResults}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1'
      },
      timeout: 15000,
      validateStatus: (status) => status < 500
    });

    if (response.status === 200 && (response.data as string).length > 1000) {
      const htmlStr = String(response.data);
      const imageUrls = extractBingImageUrls(htmlStr, query);
      
      if (imageUrls.length > 0) {
        // Convert to ImageSearchResult format
        const results: ImageSearchResult[] = imageUrls.slice(0, numResults).map((url, index) => ({
          title: `${query} - Image ${index + 1}`,
          link: url,
          displayLink: extractDomain(url),
          snippet: `Image related to ${query}`,
          image: {
            contextLink: url,
            height: 0,
            width: 0,
            byteSize: 0,
            thumbnailLink: url,
            thumbnailHeight: 150,
            thumbnailWidth: 150
          }
        }));
        
        // Filter for educational appropriateness
        const validatedResults = results.filter((result: ImageSearchResult) => {
          const isValid = validateEducationalImage(result, query);
          if (!isValid) {
            // Filter out invalid results
          }
          return isValid;
        });
        
        
        if (validatedResults.length > 0) {
          return validatedResults;
        } else {
          throw new Error('Bing Images found no educationally appropriate results');
        }
      } else {
        throw new Error('Bing Images found no image URLs');
      }
      } else {
        throw new Error(`Bing Images returned invalid response: ${response.status}`);
      }
    
  } catch (error: any) {
    throw new Error(`Bing Images search failed: ${error.message}`);
  }
}

/**
 * Extract image URLs from Bing's HTML response
 */
function extractBingImageUrls(html: string, query: string): string[] {
  // ALLOW: png, jpg, jpeg, webp, gif, and prefer original sources
  // Always allow if wikipedia.org/wikimedia.org or .edu TLD, fallback to proxy (r.bing.com/rp/) only if no preferred remains
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const preferredUrls: string[] = [];
  const fallbackUrls: string[] = [];
  const patterns = [
    // Bing's specific patterns
    /"murl":"([^"]+)"/g,
    /"turl":"([^"]+)"/g,
    /"imgurl":"([^"]+)"/g,
    /"src":"([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    /data-src="([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    /src="([^"]+\.(jpg|jpeg|png|gif|webp))"/g,
    // Generic image URLs
    /https:\/\/[^"]*\.(jpg|jpeg|png|gif|webp)(\?[^"]*)?/g,
    // JSON data patterns
    /"url":"([^"]+\.(jpg|jpeg|png|gif|webp))"/g
  ];
  
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null && (preferredUrls.length + fallbackUrls.length) < 30) {
      let url = match[1] || match[0];
      // Clean up the URL
      if (url.startsWith('"') && url.endsWith('"')) {
        url = url.slice(1, -1);
      }
      
      // Block SVG images
      if (url && url.toLowerCase().endsWith('.svg')) {
        continue;
      }
      
      if (!url || !url.startsWith('http')) {
        continue;
      }

      const urlLower = url.toLowerCase();
      const hasAllowedExtension = allowedExtensions.some(ext => 
        urlLower.endsWith(ext) ||
        urlLower.includes(`${ext}?`) ||
        urlLower.includes(`${ext}&`)
      );
      const isBingProxy = urlLower.includes('r.bing.com/rp/');
      const isBingCdn = urlLower.includes('://th.bing.com/th/id/') ||
        urlLower.includes('://www.bing.com/th?id=') ||
        urlLower.includes('://c.bing.net/th?id=');

      // Require a known extension or a trusted CDN pattern (e.g., Bing CDN) to avoid non-image resources
      if (!hasAllowedExtension && !isBingCdn) {
        continue;
      }

      // Always allow if Wikipedia/Wikimedia/.edu
      if (
        url.includes('wikipedia.org') ||
        url.includes('wikimedia.org') ||
        /https?:\/\/([\w.-]+\.)?\w+\.edu(\/|$)/i.test(url)
      ) {
        if (!preferredUrls.includes(url)) preferredUrls.push(url);
        continue;
      }

      if (isBingCdn) {
        if (!preferredUrls.includes(url)) preferredUrls.push(url);
        continue;
      }

      if (!isBingProxy) {
        if (!preferredUrls.includes(url)) preferredUrls.push(url);
      } else if (!fallbackUrls.includes(url)) {
        fallbackUrls.push(url);
      }
    }
  }
  // Deduplicate, prioritize preferred, fallback to proxies if needed
  const allUrls = preferredUrls.concat(fallbackUrls).filter((url, idx, arr) => arr.indexOf(url) === idx);
  const uniqueUrls = allUrls.slice(0, 10);
  return uniqueUrls;
}

// Multi-provider search with fallback (g-i-s -> Bing)
export async function searchImages(query: string, numResults: number = 5): Promise<{
  provider: 'google' | 'bing';
  results: ImageSearchResult[];
}> {
  // Try Google Images (g-i-s)
  try {
    const googleResults = await searchGoogleImages(query, numResults);
    if (googleResults && googleResults.length > 0) {
      return { provider: 'google', results: googleResults };
    }
  } catch (e) {
    // continue
  }
  // Fallback to Bing
  try {
    const bingResults = await searchBingImages(query, numResults);
    if (bingResults && bingResults.length > 0) {
      return { provider: 'bing', results: bingResults };
    }
  } catch (e) {
    // continue
  }
  // If everything fails
  return { provider: 'google', results: [] };
}
