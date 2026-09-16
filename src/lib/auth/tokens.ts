import { createHash, randomBytes } from 'node:crypto';
import type { TokenType } from '@prisma/client';
import { prisma } from '@/lib/db';

/** One-time tokens for magic link, email verification and password reset. */

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createAuthToken(
  userId: string,
  type: TokenType,
  ttlMinutes: number,
): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  // Invalidate previous tokens of the same type for this user.
  await prisma.authToken.deleteMany({ where: { userId, type, consumedAt: null } });
  await prisma.authToken.create({ data: { userId, type, tokenHash, expiresAt } });
  return raw;
}

export async function consumeAuthToken(
  raw: string,
  type: TokenType,
): Promise<string | null> {
  const tokenHash = hashToken(raw);
  const token = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!token || token.type !== type) return null;
  if (token.consumedAt) return null;
  if (token.expiresAt < new Date()) return null;

  await prisma.authToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  });
  return token.userId;
}
