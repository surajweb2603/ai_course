
import axios from 'axios';
import { quotaManager } from './quotaManager.service';
import * as cheerio from 'cheerio';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  embedUrl: string;
}

export type VideoResult = YouTubeVideo;

/**
 * Enhanced topic-specific validation for video relevance
 */
function validateVideoRelevance(video: any, topic: string, provider: 'youtube'): boolean {
  const topicLower = topic.toLowerCase();
  
  // Get video content from YouTube
  const title = (video.snippet?.title || '').toLowerCase();
  const description = (video.snippet?.description || '').toLowerCase();
  
  // Check for exact topic match (highest priority)
  const hasExactTopicMatch = title.includes(topicLower) || 
                            description.includes(topicLower);
  
  if (hasExactTopicMatch) {
    return true;
  }
  
  // Check for partial topic match (split topic into words)
  const topicWords = topicLower.split(' ').filter(word => word.length > 2);
  const hasPartialMatch = topicWords.some(word => 
    title.includes(word) || description.includes(word)
  );
  
  if (hasPartialMatch) {
    return true;
  }
  
  // Check for educational context
  const educationalTerms = [
    'tutorial', 'education', 'learning', 'course', 'lesson', 'guide', 'explain',
    'how to', 'introduction', 'beginner', 'advanced', 'training', 'academic'
  ];
  
  const hasEducationalContext = educationalTerms.some(term => 
    title.includes(term) || description.includes(term)
  );
  
  if (hasEducationalContext) {
    return true;
  }
  
  return false;
}

/**
 * Search for videos using YouTube Search API (web scraping)
 * This is a fallback when YouTube Data API v3 quota is exceeded
 */
export async function searchYouTubeVideosScraping(topic: string): Promise<YouTubeVideo[]> {
  try {
    
    // Enhance the search query for better educational relevance
    const enhancedQuery = `${topic} tutorial education learning course lesson`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(enhancedQuery)}`;
    
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data as string);
    const videos: YouTubeVideo[] = [];
    
    // Look for video data in the page
    $('script').each((index, element) => {
      const scriptContent = $(element).html();
      if (scriptContent && scriptContent.includes('var ytInitialData')) {
        try {
          // Extract video data from YouTube's initial data
          const dataMatch = scriptContent.match(/var ytInitialData = ({.+?});/);
          if (dataMatch) {
            const data = JSON.parse(dataMatch[1]);
            const videoContents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
            
            if (videoContents) {
              videoContents.forEach((content: any) => {
                const videoRenderer = content?.videoRenderer;
                if (videoRenderer && videos.length < 3) {
                  const videoId = videoRenderer.videoId;
                  const title = videoRenderer.title?.runs?.[0]?.text || 'Untitled';
                  const channelTitle = videoRenderer.ownerText?.runs?.[0]?.text || 'Unknown Channel';
                  const thumbnail = videoRenderer.thumbnail?.thumbnails?.[0]?.url || '';
                  const viewCount = videoRenderer.viewCountText?.simpleText || '0 views';
                  const publishedAt = videoRenderer.publishedTimeText?.simpleText || '';
                  
                  // Validate relevance
                  const videoData = {
                    snippet: {
                      title: title,
                      description: title // Use title as description for scraping
                    }
                  };
                  
                  if (validateVideoRelevance(videoData, topic, 'youtube')) {
                    videos.push({
                      id: videoId,
                      title: title,
                      description: title,
                      thumbnail: thumbnail,
                      channelTitle: channelTitle,
                      publishedAt: publishedAt,
                      duration: '0:00', // Not available from scraping
                      viewCount: viewCount,
                      embedUrl: `https://www.youtube.com/embed/${videoId}`
                    });
                  }
                }
              });
            }
          }
        } catch (parseError) {
          // Ignore parse errors
        }
      }
    });

    return videos;
    
  } catch (error: any) {
    throw new Error('Failed to fetch videos from YouTube search scraping');
  }
}


/**
 * Search for videos using YouTube Data API v3
 * Returns top 3 videos for the given topic
 */
export async function searchVideos(topic: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please set YOUTUBE_API_KEY in environment variables');
  }

  try {
    // Enhance the search query for better educational relevance
    const enhancedQuery = `${topic} tutorial education learning course lesson`;
    
    // Search for videos
    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: enhancedQuery,
        type: 'video',
        maxResults: 10, // Get more results to filter from
        order: 'relevance',
        key: apiKey,
        safeSearch: 'moderate',
        videoDuration: 'medium', // Focus on medium-length educational videos
        videoDefinition: 'high' // Higher quality videos
      }
    });

    const searchData = searchResponse.data as any;
    // Filter YouTube videos for educational relevance using enhanced validation
    const relevantItems = searchData.items.filter((item: any) => {
      return validateVideoRelevance(item, topic, 'youtube');
    });

    const videoIds = relevantItems.slice(0, 3).map((item: any) => item.id.videoId).join(',');
    
    if (!videoIds) {
      return [];
    }

    // Get detailed video information
    const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoIds,
        key: apiKey
      }
    });

    const detailsData = detailsResponse.data as any;
    // Format the response
    const videos: YouTubeVideo[] = detailsData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount || '0',
      embedUrl: `https://www.youtube.com/embed/${video.id}`
    }));

    return videos;
  } catch (error: any) {
    
    if (error.response?.status === 403) {
      if (error.response.data?.error?.message?.includes('quota')) {
        throw new Error('YouTube API quota exceeded - falling back to YouTube Search API');
      }
      throw new Error('YouTube API access denied - check API key');
    }
    
    if (error.response?.status === 400) {
      throw new Error('Invalid YouTube API request');
    }
    
    throw new Error('Failed to fetch videos from YouTube');
  }
}

/**
 * Search for videos with fallback to YouTube Search API if YouTube Data API fails
 * Returns top 3 videos for the given topic
 */
export async function searchVideosWithFallback(topic: string): Promise<VideoResult[]> {
  // Check quota status and determine strategy
  const strategy = await quotaManager.getVideoSearchStrategy();

  if (strategy === 'scraping') {
    return await searchYouTubeVideosScraping(topic);
  }

  // Try YouTube Data API first, then fall back to scraping if needed
  try {
    return await searchVideos(topic);
  } catch (youtubeError: any) {
    const youtubeMessage =
      youtubeError instanceof Error ? youtubeError.message : String(youtubeError);

    try {
      return await searchYouTubeVideosScraping(topic);
    } catch (scrapingError: any) {
      console.error('❌ [VIDEO SEARCH] Both YouTube Data API v3 and YouTube Search API failed:', {
        youtubeError: youtubeMessage,
        scrapingError: scrapingError instanceof Error ? scrapingError.message : String(scrapingError),
      });
      throw new Error('Failed to fetch videos from both YouTube Data API v3 and YouTube Search API');
    }
  }
}

/**
 * Format duration from ISO 8601 to readable format
 */
export function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format view count to readable format
 */
export function formatViewCount(viewCount: string): string {
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
}
