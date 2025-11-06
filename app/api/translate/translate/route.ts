import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import { translateText, TranslationRequest } from '@/src/server/services/translation.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/translate/translate - Translate text
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { text, targetLanguage, sourceLanguage, context } = await req.json();

  if (!text || !targetLanguage) {
    return NextResponse.json(
      { error: 'Text and target language are required' },
      { status: 400 }
    );
  }

  const translationRequest: TranslationRequest = {
    text,
    targetLanguage,
    sourceLanguage,
    context
  };

  const result = await translateText(translationRequest);

  return NextResponse.json({
    success: true,
    data: result
  });
});
