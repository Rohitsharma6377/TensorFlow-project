"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { useState } from 'react';

const items = [
  { href: '/superadmin/dashboard', label: 'Dashboard', icon: Icons.dashboard },
  { href: '/superadmin/analytics', label: 'Analytics', icon: Icons.dashboard },
  { href: '/superadmin/users', label: 'Users', icon: Icons.user },
  { href: '/superadmin/contacts', label: 'Contacts', icon: Icons.package },
  { href: '/superadmin/leads', label: 'Leads', icon: Icons.package },
  { href: '/superadmin/payout', label: 'Payout', icon: Icons.wallet },
  { href: '/superadmin/delivery-partners', label: 'Delivery', icon: Icons.package },
  { href: '/superadmin/premium-member', label: 'Premium', icon: Icons.gift },
  { href: '/superadmin/settings', label: 'Settings', icon: Icons.settings },
];

export function SuperSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'shrink-0 border-r bg-gradient-to-b from-sky-50 via-emerald-50 to-emerald-100/40 transition-all duration-300',
        collapsed ? 'w-14' : 'w-full md:w-64'
      )}
    >
      <div className="p-4 border-b border-emerald-100/60 flex items-center justify-between">
        <div className={cn('text-sm font-semibold text-emerald-900 transition-all duration-200', collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100')}>Super Admin</div>
        <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setCollapsed((c)=>!c)}>
          {collapsed ? '›' : '‹'}
        </Button>
      </div>
      <nav className="p-2 space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100/70 transition-colors',
              pathname === it.href && 'bg-emerald-200/70 text-emerald-900',
              collapsed && 'justify-center'
            )}
            title={collapsed ? it.label : undefined}
          >
            {it.icon ? <it.icon className={cn('h-4 w-4 mr-2 text-emerald-700', collapsed && 'mr-0')} /> : null}
            <span className={cn('transition-all duration-200', collapsed ? 'sr-only' : 'not-sr-only')}>{it.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default SuperSidebar;
