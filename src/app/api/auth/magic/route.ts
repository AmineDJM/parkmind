import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { consumeAuthToken } from '@/lib/auth/tokens';
import { signSession, SESSION_COOKIE } from '@/lib/auth/jwt';
import { logAudit } from '@/server/audit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const bad = NextResponse.redirect(new URL('/login?error=magic', req.url));
  if (!token) return bad;

  const userId = await consumeAuthToken(token, 'MAGIC_LINK');
  if (!userId) return bad;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isSuspended) return bad;

  // Magic-link click proves email ownership.
  if (!user.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  }
  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'AUTH',
    action: 'LOGIN_MAGIC',
    summary: `Connexion par lien magique (${user.email}).`,
  });

  const jwt = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const dest = user.onboardedAt ? '/dashboard' : '/onboarding';
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: env.sessionDays * 24 * 60 * 60,
  });
  return res;
}
