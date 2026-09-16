import type { Metadata } from 'next';
import Link from 'next/link';
import { Car, Plus, Trash2 } from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PROVIDER_LABELS } from '@/domain/enums';
import type { ProviderKey } from '@/domain/enums';
import { Card, CardContent, Badge, buttonVariants, SubmitButton } from '@/components/ui';
import { PageHeader, EmptyState } from '@/components/app/bits';
import { deleteVehicleAction } from '@/server/actions/vehicles';

export const metadata: Metadata = { title: 'Véhicules' };

export default async function VehiclesPage() {
  const user = await requireOnboardedUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    include: {
      city: true,
      defaultZone: true,
      providerConnection: { include: { provider: true } },
      _count: { select: { automations: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div>
      <PageHeader
        title="Véhicules"
        description="Gérez vos véhicules, leur ville et leur opérateur."
        action={
          <Link href="/vehicles/new" className={buttonVariants({ variant: 'brand', size: 'sm' })}>
            <Plus className="h-4 w-4" /> Ajouter
          </Link>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={<Car className="h-6 w-6" />}
          title="Aucun véhicule"
          description="Ajoutez votre premier véhicule pour commencer."
          action={
            <Link href="/vehicles/new" className={buttonVariants({ variant: 'brand' })}>
              Ajouter un véhicule
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{v.model ?? 'Véhicule'}</p>
                    <p className="font-mono text-sm text-muted-foreground">{v.displayPlate}</p>
                  </div>
                  <Badge variant={v.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {v.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ville</dt>
                    <dd>{v.city.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Zone</dt>
                    <dd>{v.defaultZone?.name ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Opérateur</dt>
                    <dd>
                      {v.providerConnection
                        ? PROVIDER_LABELS[v.providerConnection.provider.key as ProviderKey]
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Automatisations</dt>
                    <dd>{v._count.automations}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end">
                  <form action={deleteVehicleAction}>
                    <input type="hidden" name="vehicleId" value={v.id} />
                    <SubmitButton variant="ghost" size="sm" className="text-danger hover:bg-danger/10" pendingLabel="…">
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </SubmitButton>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
