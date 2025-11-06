import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { searchVideosWithFallback } from '@/src/server/services/video.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/media/videos/search - Search for videos related to a lesson topic
export const GET = withAuth(async (req: NextAuthRequest) => {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic');

  // Validation
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return NextResponse.json({ error: 'Topic parameter is required' }, { status: 400 });
  }

  if (topic.trim().length > 100) {
    return NextResponse.json({ error: 'Topic must be 100 characters or less' }, { status: 400 });
  }

  try {
    // Search for videos using YouTube Data API with YouTube Search API fallback
    const rawVideos = await searchVideosWithFallback(topic.trim());

    // All videos are now YouTube videos
    const provider = 'youtube';

    // Transform videos to match frontend format
    const videos = rawVideos.map((video: any) => {
      return {
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        provider: 'youtube',
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt,
        duration: video.duration,
        viewCount: video.viewCount,
        embedUrl: video.embedUrl,
      };
    });

    return NextResponse.json({ 
      topic: topic.trim(),
      videos,
      count: videos.length,
      provider: provider,
      message: 'Using YouTube videos (Data API v3 or Search API)'
    });
  } catch (error: any) {
    // Handle specific API errors
    if (error.message?.includes('API key')) {
      return NextResponse.json({ error: 'Video API key not configured' }, { status: 500 });
    }
    if (error.message?.includes('quota')) {
      return NextResponse.json({ error: 'Video API quota exceeded' }, { status: 429 });
    }
    if (error.message?.includes('both YouTube Data API and YouTube Search API')) {
      return NextResponse.json({ error: 'All video sources failed' }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Failed to search videos' }, { status: 500 });
  }
});
