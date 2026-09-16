import type { Metadata } from 'next';
import { Bell, CheckCheck } from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NOTIFICATION_LABEL, notificationTone } from '@/lib/display';
import { formatDateTime, cn } from '@/lib/utils';
import { Card, CardContent, Badge, SubmitButton } from '@/components/ui';
import { PageHeader, EmptyState } from '@/components/app/bits';
import { markAllReadAction, markReadAction } from '@/server/actions/notifications';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireOnboardedUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Parkmind ne vous alerte que lorsque c'est utile."
        action={
          hasUnread ? (
            <form action={markAllReadAction}>
              <SubmitButton variant="outline" size="sm" pendingLabel="…">
                <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
              </SubmitButton>
            </form>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="Aucune notification"
          description="Vous serez prévenu en cas de session activée, d'échec, de droit expirant ou d'action requise."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {notifications.map((n) => {
            const unread = !n.readAt;
            return (
              <Card
                key={n.id}
                className={cn(unread && 'border-l-2 border-l-brand bg-brand-soft/30')}
              >
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{n.title}</p>
                      <Badge variant={notificationTone(n.type)}>
                        {NOTIFICATION_LABEL[n.type] ?? n.type}
                      </Badge>
                      {unread && <span className="h-2 w-2 rounded-full bg-brand" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                  {unread && (
                    <form action={markReadAction}>
                      <input type="hidden" name="notificationId" value={n.id} />
                      <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                        Lu
                      </SubmitButton>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
