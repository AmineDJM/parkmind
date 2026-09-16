import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cityOptions } from '@/lib/city-options';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { NewAutomationForm } from '@/components/app/forms';

export const metadata: Metadata = { title: 'Nouvelle automatisation' };

export default async function NewAutomationPage() {
  const user = await requireOnboardedUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    select: { id: true, displayPlate: true, model: true },
  });
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/automations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Automatisations
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle automatisation</CardTitle>
        </CardHeader>
        <CardContent>
          <NewAutomationForm
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
