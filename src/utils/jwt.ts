
import * as jwt from 'jsonwebtoken';

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
