import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { listCityRules } from '@/cities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { NewVehicleForm } from '@/components/app/forms';

export const metadata: Metadata = { title: 'Nouveau véhicule' };

export default function NewVehiclePage() {
  const cities = listCityRules().map((c) => ({ slug: c.slug, name: c.name }));
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/vehicles" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Véhicules
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <NewVehicleForm cities={cities} />
        </CardContent>
      </Card>
    </div>
  );
}
