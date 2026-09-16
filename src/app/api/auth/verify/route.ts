import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { consumeAuthToken } from '@/lib/auth/tokens';
import { logAudit } from '@/server/audit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=verify', req.url));
  }
  const userId = await consumeAuthToken(token, 'EMAIL_VERIFICATION');
  if (!userId) {
    return NextResponse.redirect(new URL('/login?error=verify', req.url));
  }
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  await logAudit({
    userId,
    actor: userId,
    category: 'AUTH',
    action: 'EMAIL_VERIFIED',
    summary: 'Adresse e-mail vérifiée.',
  });
  return NextResponse.redirect(new URL('/dashboard?verified=1', req.url));
}
