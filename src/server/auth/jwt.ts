
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JwtPayload {
  sub: string;
  email: string;
  plan: string;
}

export function signJwt(
  payload: JwtPayload,
  expiresIn: jwt.SignOptions['expiresIn'] = '7d' as jwt.SignOptions['expiresIn']
): string {
  const signOptions: jwt.SignOptions = {};
  if (expiresIn !== undefined) {
    signOptions.expiresIn = expiresIn;
  }
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// Cookie-based JWT utilities for Next.js
export async function setAuthCookie(token: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiresIn / 1000, // Convert to seconds
    path: '/',
  });
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  return token?.value || null;
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

// Get user from request (for Next.js API routes)
export async function getUserFromRequest(): Promise<JwtPayload | null> {
  try {
    const token = await getAuthCookie();
    if (!token) {
      // Fallback to Authorization header for backward compatibility
      return null;
    }
    return verifyJwt(token);
  } catch (error) {
    return null;
  }
}

// Get user from Authorization header (for backward compatibility)
export function getUserFromHeader(authHeader: string | null): JwtPayload | null {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    return verifyJwt(token);
  } catch (error) {
    return null;
  }
}

