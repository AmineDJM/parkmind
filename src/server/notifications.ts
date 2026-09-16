import 'server-only';
import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mailer';

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  sessionId?: string | null;
  meta?: Prisma.InputJsonValue;
}

/**
 * Create an in-app (web) notification and, when the user opted in, also send an
 * email. Email failures never block the in-app notification.
 */
export async function notify(input: NotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      channel: 'WEB',
      title: input.title,
      body: input.body,
      sessionId: input.sessionId ?? null,
      meta: input.meta ?? undefined,
      sentAt: new Date(),
    },
  });

  try {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: input.userId },
      select: { notifyByEmail: true },
    });
    if (prefs?.notifyByEmail) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendMail({
          to: user.email,
          subject: `Parkmind — ${input.title}`,
          text: input.body,
        });
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[notify] email failed', err);
  }

  return notification;
}
