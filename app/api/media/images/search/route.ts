import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { searchImages } from '@/src/server/services/imageSearch.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/media/images/search - Search for images
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, numResults = 5 } = await req.json();

  // Validate input
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Query is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  if (query.trim().length > 200) {
    return NextResponse.json(
      { error: 'Query must be 200 characters or less' },
      { status: 400 }
    );
  }

  if (typeof numResults !== 'number' || numResults < 1 || numResults > 10) {
    return NextResponse.json(
      { error: 'numResults must be a number between 1 and 10' },
      { status: 400 }
    );
  }

  // Search for images
  const searchResult = await searchImages(query.trim(), numResults);

  // Return results
  return NextResponse.json({
    success: true,
    provider: searchResult.provider,
    query: query.trim(),
    results: searchResult.results,
    count: searchResult.results.length,
  });
});
