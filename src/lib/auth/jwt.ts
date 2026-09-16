import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/lib/env';

/**
 * Edge-safe session token signing/verification with `jose`.
 * No database access here, so it can run in middleware.
 */

const secret = new TextEncoder().encode(env.authSecret);
const ALG = 'HS256';

export interface SessionClaims {
  sub: string; // user id
  email: string;
  role: 'USER' | 'ADMIN';
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.sessionDays}d`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      role: (payload.role as 'USER' | 'ADMIN') ?? 'USER',
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'pm_session';
