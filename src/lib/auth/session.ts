import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Prisma, User, UserPreferences } from '@prisma/client';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { SESSION_COOKIE, signSession, verifySession } from './jwt';

export type CurrentUser = User & { preferences: UserPreferences | null };

export async function setSessionCookie(user: {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}): Promise<void> {
  const token = await signSession({ sub: user.id, email: user.email, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: env.sessionDays * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionClaims() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Load the current user (with preferences) from the session cookie.
 * Returns null for anonymous or suspended users.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: { preferences: true },
  });
  if (!user || user.isSuspended) return null;
  return user;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireOnboardedUser(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.onboardedAt) redirect('/onboarding');
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/dashboard');
  return user;
}

/** Ensure a user always has a preferences row. */
export async function ensurePreferences(
  userId: string,
  data?: Partial<Prisma.UserPreferencesUncheckedCreateInput>,
): Promise<UserPreferences> {
  const existing = await prisma.userPreferences.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userPreferences.create({
    data: {
      userId,
      simulationMode: env.defaultSimulationMode,
      ...data,
    },
  });
}
