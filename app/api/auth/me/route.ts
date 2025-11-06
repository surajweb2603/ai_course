import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import User from '@/src/models/User';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch full user data
  const user = await User.findById(req.user.sub).select('-passwordHash');

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      plan: user.plan,
      provider: user.provider,
      createdAt: user.createdAt,
    },
  });
});
