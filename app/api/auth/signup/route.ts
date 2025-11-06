import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import User from '@/src/models/User';
import { hashPassword } from '@/src/utils/hash';
import { signJwt } from '@/src/server/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = publicHandler(async (req: NextRequest) => {
  const { email, name, password } = await req.json();

  // Validate inputs
  if (!email || !name || !password) {
    return NextResponse.json(
      { error: 'Email, name, and password are required' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return NextResponse.json(
      { error: 'User with this email already exists' },
      { status: 400 }
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    name,
    passwordHash,
    provider: 'local',
    plan: 'free',
  });

  // Sign JWT
  const token = signJwt({
    sub: (user._id as any).toString(),
    email: user.email,
    plan: user.plan,
  });

  // Create response with JSON
  const response = NextResponse.json(
    {
      token,
      user: {
        id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        plan: user.plan,
        provider: user.provider,
      },
    },
    { status: 201 }
  );

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
