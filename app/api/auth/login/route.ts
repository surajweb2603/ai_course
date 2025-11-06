import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import User from '@/src/models/User';
import { verifyPassword } from '@/src/utils/hash';
import { signJwt } from '@/src/server/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = publicHandler(async (req: NextRequest) => {
  const { email, password, rememberMe } = await req.json();

  // Validate inputs
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  // Find user with local provider
  const user = await User.findOne({
    email: email.toLowerCase(),
    provider: 'local',
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Sign JWT with appropriate expiry
  const expiresIn = rememberMe ? '30d' : '7d';
  const token = signJwt(
    {
      sub: (user._id as any).toString(),
      email: user.email,
      plan: user.plan,
    },
    expiresIn
  );

  // Create response with JSON
  const response = NextResponse.json({
    token,
    user: {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      plan: user.plan,
      provider: user.provider,
    },
  });

  // Set cookie directly on response
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // Convert to seconds
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  return response;
});
