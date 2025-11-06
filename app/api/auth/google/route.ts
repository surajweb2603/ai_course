import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import User from '@/src/models/User';
import { signJwt } from '@/src/server/auth/jwt';
import { verifyGoogleIdToken } from '@/src/server/services/googleAuth.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = publicHandler(async (req: NextRequest) => {
  const { idToken } = await req.json();

  if (!idToken) {
    return NextResponse.json(
      { error: 'ID token is required' },
      { status: 400 }
    );
  }

  // Verify Google token
  const googlePayload = await verifyGoogleIdToken(idToken);

  // Find or create user
  let user = await User.findOne({ email: googlePayload.email.toLowerCase() });

  if (user) {
    // Update existing user if needed
    if (user.provider !== 'google') {
      user.provider = 'google';
      user.googleId = googlePayload.sub;
      await user.save();
    }
  } else {
    // Create new user
    user = await User.create({
      email: googlePayload.email.toLowerCase(),
      name: googlePayload.name,
      provider: 'google',
      googleId: googlePayload.sub,
      plan: 'free',
    });
  }

  // Sign JWT
  const token = signJwt({
    sub: (user._id as any).toString(),
    email: user.email,
    plan: user.plan,
  });

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
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });

  return response;
});
