"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slice/authSlice';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

const items = [
  { href: '/user/profile', label: 'Profile', icon: Icons.user },
  { href: '/user/addresses', label: 'Addresses', icon: Icons.mapPin },
  { href: '/user/wallet', label: 'Wallet', icon: Icons.wallet },
  { href: '/user/settings', label: 'Settings', icon: Icons.settings },
  { href: '/user/cart', label: 'Cart', icon: Icons.shoppingCart },
  { href: '/user/wishlist', label: 'Wishlist', icon: Icons.heart },
  { href: '/user/orders', label: 'Orders', icon: Icons.package },
  { href: '/user/rewards', label: 'Rewards', icon: Icons.gift },
];

export function ProfileSidebar({ collapsed = false, onToggle, className }: { collapsed?: boolean; onToggle?: () => void; className?: string }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  return (
    <aside
      className={cn(
        'shrink-0 border-r bg-gradient-to-b from-sky-50 via-emerald-50 to-emerald-100/40 transition-all duration-300',
        collapsed ? 'w-14' : 'w-full md:w-64',
        className
      )}
    >
      <div className={cn('p-4 border-b border-emerald-100/60 flex items-center justify-between')}
      >
        <div className={cn('transition-all duration-200', collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100')}>
          <div className="text-xs text-emerald-700">Signed in as</div>
          <div className="text-sm font-semibold text-emerald-900">{user?.username || 'User'}</div>
        </div>
        <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={onToggle}>
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
            {it.icon ? (
              <it.icon className={cn('h-4 w-4 mr-2 text-emerald-700', collapsed && 'mr-0')} />
            ) : null}
            <span className={cn('transition-all duration-200', collapsed ? 'sr-only' : 'not-sr-only')}>{it.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-emerald-100/60">
        <Button
          variant="outline"
          className="w-full border-emerald-200 text-red-600 hover:bg-red-50"
          onClick={() => dispatch(logout())}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}

export default ProfileSidebar;
