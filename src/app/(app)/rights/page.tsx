import type { Metadata } from 'next';
import Link from 'next/link';
import { ScrollText, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { RIGHT_TYPE_LABELS } from '@/domain/enums';
import type { RightType } from '@/domain/enums';
import { RIGHT_STATUS } from '@/lib/display';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, Badge, Alert, buttonVariants, SubmitButton } from '@/components/ui';
import { PageHeader, EmptyState } from '@/components/app/bits';
import { deleteRightAction } from '@/server/actions/rights';

export const metadata: Metadata = { title: 'Droits de stationnement' };

const THIRTY_DAYS = 30 * 86_400_000;

export default async function RightsPage() {
  const user = await requireOnboardedUser();
  const rights = await prisma.parkingRight.findMany({
    where: { userId: user.id },
    include: { city: true, zone: true, vehicle: true },
    orderBy: [{ expiresOn: 'asc' }],
  });

  const now = Date.now();
  const expiringSoon = rights.filter(
    (r) =>
      r.expiresOn &&
      r.status !== 'EXPIRED' &&
      r.expiresOn.getTime() - now < THIRTY_DAYS &&
      r.expiresOn.getTime() > now,
  );

  return (
    <div>
      <PageHeader
        title="Droits de stationnement"
        description="Vos droits résident / professionnel et leurs échéances."
        action={
          <Link href="/rights/new" className={buttonVariants({ variant: 'brand', size: 'sm' })}>
            <Plus className="h-4 w-4" /> Ajouter
          </Link>
        }
      />

      {expiringSoon.length > 0 && (
        <Alert tone="warning" className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {expiringSoon.length} droit(s) expirent dans moins de 30 jours. Pensez à les renouveler.
        </Alert>
      )}

      {rights.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-6 w-6" />}
          title="Aucun droit enregistré"
          description="Ajoutez votre droit résident ou professionnel pour appliquer le bon tarif."
          action={
            <Link href="/rights/new" className={buttonVariants({ variant: 'brand' })}>
              Ajouter un droit
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rights.map((r) => {
            const info = RIGHT_STATUS[r.status] ?? { label: r.status, tone: 'neutral' as const };
            return (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{RIGHT_TYPE_LABELS[r.type as RightType]}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.city.name}
                        {r.zone ? ` · ${r.zone.name}` : ''}
                      </p>
                    </div>
                    <Badge variant={info.tone}>{info.label}</Badge>
                  </div>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Référence</dt>
                      <dd className="font-mono">{r.reference ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Véhicule</dt>
                      <dd className="font-mono">{r.vehicle?.displayPlate ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Expiration</dt>
                      <dd>{formatDate(r.expiresOn)}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex justify-end">
                    <form action={deleteRightAction}>
                      <input type="hidden" name="rightId" value={r.id} />
                      <SubmitButton variant="ghost" size="sm" className="text-danger hover:bg-danger/10" pendingLabel="…">
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </SubmitButton>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
