
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleTokenPayload {
  email: string;
  name: string;
  sub: string; // Google ID
}

export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleTokenPayload> {
  try {
    // Check if GOOGLE_CLIENT_ID is configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      throw new Error('Invalid token payload');
    }

    return {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      sub: payload.sub,
    };
  } catch (error: any) {
    console.error('Google token verification error:', error);
    // Preserve the original error message for debugging
    if (error.message) {
      throw new Error(`Failed to verify Google token: ${error.message}`);
    }
    throw new Error('Failed to verify Google token');
  }
}

