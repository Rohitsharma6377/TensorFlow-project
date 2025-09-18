'use client';

import { useState, useEffect } from 'react';
import { BellIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import ChatPanel from '@/components/panels/ChatPanel';
import NotificationsPanel from '@/components/panels/NotificationsPanel';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout as logoutAction } from '@/store/slice/authSlice';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  roles?: string[];
  guest?: boolean;
}

const mainNavItems: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Shops', href: '/shops' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

const authNavItems: NavItem[] = [
  // Customer links under /user
  {
    name: 'Profile',
    href: '/user/profile',
    icon: <Icons.user className="mr-2 h-4 w-4" />,
    roles: ['customer'],
  },
  {
    name: 'Orders',
    href: '/user/orders',
    icon: <Icons.package className="mr-2 h-4 w-4" />,
    roles: ['customer'],
  },
  {
    name: 'Wishlist',
    href: '/user/wishlist',
    icon: <Icons.heart className="mr-2 h-4 w-4" />,
    roles: ['customer'],
  },
  {
    name: 'Cart',
    href: '/user/cart',
    icon: <Icons.shoppingCart className="mr-2 h-4 w-4" />,
    roles: ['customer'],
  },
  // Seller link
  {
    name: 'Seller Dashboard',
    href: '/seller/dashboard',
    icon: <Icons.store className="mr-2 h-4 w-4" />,
    roles: ['seller'],
  },
  // Admin link
  {
    name: 'Admin',
    href: '/admin',
    icon: <Icons.shield className="mr-2 h-4 w-4" />,
    roles: ['admin', 'superadmin'],
  },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openNotifs, setOpenNotifs] = useState(false);
  const dispatch = useAppDispatch();
  const { user, accessToken, status } = useAppSelector((s) => s.auth);
  const isAuthenticated = Boolean(user && accessToken);
  const isLoading = status === 'loading';
  const pathname = usePathname();
  const router = useRouter();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenChat(false);
    setOpenNotifs(false);
  }, [pathname]);

  // Keep role cookie in sync once auth is hydrated (covers InitAuth/me)
  useEffect(() => {
    if (user?.role && accessToken) {
      try {
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        document.cookie = `role=${user.role}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      } catch {}
    }
  }, [user?.role, accessToken]);

  const handleLogout = () => {
    dispatch(logoutAction());
    try { document.cookie = 'role=; Max-Age=0; Path=/'; } catch {}
    router.push('/');
  };

  const filteredMainNavItems = mainNavItems.filter(item => {
    if (item.roles) {
      return item.roles.includes(user?.role || '');
    }
    return true;
  });

  const filteredAuthNavItems = authNavItems.filter(item => {
    if (item.roles) {
      return item.roles.some(role => user?.role === role);
    }
    return true;
  });

  const getUserInitials = () => {
    if (!user) return '';
    if (user.isGuest) return 'G';
    if (user.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
        isScrolled ? 'shadow-sm' : ''
      )}
    >
      <div className="w-full px-4 flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center
         gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold inline-block">EcomApp</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {filteredMainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/80',
                  pathname === item.href ? 'text-foreground' : ''
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick actions */}
          <button
            type="button"
            onClick={() => setOpenNotifs((v) => !v)}
            className="hidden md:inline-flex p-2 rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Open notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setOpenChat((v) => !v)}
            className="hidden md:inline-flex p-2 rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Open messages"
          >
            <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
          </button>
          {/* Search Bar - Only show on desktop */}
          <div className="hidden md:flex items-center relative w-64">
            <Icons.search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>

          {/* Theme Toggle removed (component not available) */}

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative">
            <Icons.shoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              0
            </span>
          </Button>

          {/* Auth Buttons */}
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile?.avatarUrl} alt={user?.username} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.profile?.fullName || user?.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filteredAuthNavItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="cursor-pointer"
                  >
                    {item.icon}
                    {item.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <Icons.logout className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <Icons.close className="h-5 w-5" />
            ) : (
              <Icons.menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="w-full px-4 py-4 space-y-4">
            <div className="relative w-full mb-4">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
            
            <nav className="flex flex-col space-y-2">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <div className="border-t my-2"></div>
                  {filteredAuthNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                        pathname === item.href
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Icons.logout className="mr-2 h-4 w-4" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2 border-t">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
      {/* Slide-over panels (portals will render above all) */}
      <NotificationsPanel open={openNotifs} onClose={() => setOpenNotifs(false)} />
      <ChatPanel open={openChat} onClose={() => setOpenChat(false)} />
    </header>
  );
}
