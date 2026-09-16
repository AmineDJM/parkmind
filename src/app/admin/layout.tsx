import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { logoutAction } from '@/server/actions/auth';
import { LogoMark } from '@/components/ui/logo';
import { Badge } from '@/components/ui';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-20 border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="font-bold tracking-tight">Parkmind</span>
            <Badge variant="danger">Admin</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">Vue d'ensemble</Link>
            <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">Utilisateurs</Link>
            <Link href="/admin/logs" className="text-muted-foreground hover:text-foreground">Journaux</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> App
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-muted-foreground hover:text-foreground">Quitter</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
