import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cityOptions } from '@/lib/city-options';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { NewRightForm } from '@/components/app/forms';

export const metadata: Metadata = { title: 'Nouveau droit' };

export default async function NewRightPage() {
  const user = await requireOnboardedUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    select: { id: true, displayPlate: true, model: true },
  });
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/rights" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Droits
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un droit</CardTitle>
        </CardHeader>
        <CardContent>
          <NewRightForm
            cities={cityOptions()}
            vehicles={vehicles.map((v) => ({
              id: v.id,
              label: `${v.model ? v.model + ' — ' : ''}${v.displayPlate}`,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
