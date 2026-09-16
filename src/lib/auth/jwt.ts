import { SignJWT, jwtVerify } from 'jose';

/**
 * Edge-safe session token signing/verification with `jose`.
 * No database access here, so it can run in middleware.
 *
 * IMPORTANT: read env with *static* `process.env.X` (dot) access, not via a
 * helper using bracket access — only dot access is inlined into the Edge
 * middleware bundle at build time. Bracket access would leave the secret
 * undefined at the edge and silently fall back to the default, rejecting every
 * valid session. AUTH_SECRET must therefore be present at build AND runtime.
 */

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'dev-insecure-secret-change-me',
);
const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS) || 30;
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
    .setExpirationTime(`${SESSION_DAYS}d`)
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
