import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, Badge, SubmitButton } from '@/components/ui';
import { PageHeader } from '@/components/app/bits';
import { setUserSuspendedAction } from '@/server/actions/admin';

export const metadata: Metadata = { title: 'Admin · Utilisateurs' };

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { vehicles: true, automations: true, sessions: true } } },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Utilisateurs" description={`${users.length} compte(s).`} />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{u.name ?? '—'}</p>
                    <span className="text-sm text-muted-foreground">{u.email}</span>
                    {u.role === 'ADMIN' && <Badge variant="brand">Admin</Badge>}
                    <Badge variant="outline">{u.planTier}</Badge>
                    {u.isSuspended && <Badge variant="danger">Suspendu</Badge>}
                    {!u.emailVerifiedAt && <Badge variant="warning">Non vérifié</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {u._count.vehicles} véhicule(s) · {u._count.automations} automatisation(s) ·{' '}
                    {u._count.sessions} session(s) · inscrit le {formatDate(u.createdAt)}
                  </p>
                </div>
                {me?.id !== u.id && (
                  <form action={setUserSuspendedAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="suspended" value={(!u.isSuspended).toString()} />
                    <SubmitButton
                      variant={u.isSuspended ? 'outline' : 'danger'}
                      size="sm"
                      pendingLabel="…"
                    >
                      {u.isSuspended ? 'Réactiver' : 'Suspendre'}
                    </SubmitButton>
                  </form>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
