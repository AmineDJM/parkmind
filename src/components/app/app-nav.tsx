'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  ScrollText,
  Zap,
  History,
  Bell,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem, NavIconKey } from './nav-items';

const ICONS = {
  dashboard: LayoutDashboard,
  car: Car,
  rights: ScrollText,
  automations: Zap,
  history: History,
  bell: Bell,
  settings: Settings,
  admin: ShieldCheck,
} satisfies Record<NavIconKey, LucideIcon>;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-soft text-brand'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </span>
            {item.badge ? (
              <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-foreground">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Compact bottom tab bar for mobile. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const tabs = items.filter((i) =>
    ['/dashboard', '/automations', '/history', '/notifications', '/settings'].includes(
      i.href,
    ),
  );
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border lg:hidden">
      {tabs.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
              active ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label.split(' ')[0]}
            {item.badge ? (
              <span className="absolute right-1/2 top-1.5 translate-x-3 rounded-full bg-brand px-1 text-[9px] font-bold text-brand-foreground">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
