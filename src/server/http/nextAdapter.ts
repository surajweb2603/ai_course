
import { NextRequest, NextResponse } from 'next/server';
import { connectDBForServerless } from '../db/mongoose';
import { getUserFromRequest, getUserFromHeader, JwtPayload } from '../auth/jwt';

export interface NextAuthRequest extends NextRequest {
  user?: JwtPayload;
}

// Helper to get authenticated user from request
export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  // Try cookie first
  const user = await getUserFromRequest();
  if (user) return user;
  
  // Fallback to Authorization header
  const authHeader = req.headers.get('authorization');
  return getUserFromHeader(authHeader);
}

// Helper to ensure database connection
export async function ensureDB() {
  await connectDBForServerless();
}

// Helper to create authenticated request handler
export function withAuth(
  handler: (req: NextAuthRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Ensure database connection
      await ensureDB();
      
      // Get authenticated user
      const user = await getAuthUser(req);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Attach user to request
      (req as NextAuthRequest).user = user;
      
      // Handle params if they're a Promise (Next.js 14)
      if (context?.params && typeof context.params.then === 'function') {
        context.params = await context.params;
      }
      
      // Call handler
      return await handler(req as NextAuthRequest, context);
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper to create public request handler (no auth required)
export function publicHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Ensure database connection
      await ensureDB();
      
      // Call handler
      return await handler(req, context);
    } catch (error: any) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

