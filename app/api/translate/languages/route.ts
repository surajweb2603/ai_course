import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import { getSupportedLanguages } from '@/src/server/services/translation.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/translate/languages - Get supported languages
export const GET = publicHandler(async (req: NextRequest) => {
  const languages = getSupportedLanguages();

  return NextResponse.json({
    success: true,
    data: languages,
  });
});
