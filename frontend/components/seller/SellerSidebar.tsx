"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { useState } from 'react';

const items = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: Icons.dashboard },
  { href: '/seller/products', label: 'Products', icon: Icons.store },
  { href: '/seller/orders', label: 'Orders', icon: Icons.package },
  { href: '/seller/payments', label: 'Payouts', icon: Icons.wallet },
  { href: '/seller/anylatics', label: 'Analytics', icon: Icons.dashboard },
  { href: '/seller/post', label: 'Posts', icon: Icons.package },
  { href: '/seller/shopprofie', label: 'Shop', icon: Icons.store },
  { href: '/seller/profile', label: 'Profile', icon: Icons.user },
  { href: '/seller/settings', label: 'Settings', icon: Icons.settings },
  { href: '/seller/subscription', label: 'Subscription', icon: Icons.gift },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'shrink-0 border-r bg-gradient-to-b from-sky-50 via-emerald-50 to-emerald-100/40 transition-all duration-300 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-hidden',
        collapsed ? 'w-14' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-emerald-100/60 flex items-center justify-between">
        <div className={cn('text-sm font-semibold text-emerald-900 transition-all duration-200', collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100')}>Seller Center</div>
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

export default SellerSidebar;
