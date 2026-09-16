import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSystemFlags } from '@/server/settings';
import { logoutAction } from '@/server/actions/auth';
import { LogoMark } from '@/components/ui/logo';
import { StatusDot, Badge } from '@/components/ui';
import { initials } from '@/lib/utils';
import { SidebarNav, BottomNav, NAV_ITEMS, type NavItem } from '@/components/app/app-nav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOnboardedUser();
  const [unread, flags] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    getSystemFlags(),
  ]);

  const items: NavItem[] = NAV_ITEMS.map((i) =>
    i.href === '/notifications' ? { ...i, badge: unread } : i,
  );
  if (user.role === 'ADMIN') {
    items.push({ href: '/admin', label: 'Administration', icon: 'admin', admin: true });
  }

  const paused =
    flags.killSwitch ||
    !flags.automationsGloballyEnabled ||
    !(user.preferences?.automationEnabled ?? true);
  const simulation = user.preferences?.simulationMode ?? true;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-bold tracking-tight">Parkmind</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={items} />
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
              {initials(user.name, user.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name ?? 'Compte'}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Se déconnecter"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <LogoMark className="h-7 w-7" />
            <span className="font-bold tracking-tight">Parkmind</span>
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2.5">
            {simulation && <Badge variant="info">Simulation</Badge>}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
              <StatusDot tone={paused ? 'muted' : 'success'} pulse={!paused} />
              {paused ? 'En pause' : 'Actif'}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
