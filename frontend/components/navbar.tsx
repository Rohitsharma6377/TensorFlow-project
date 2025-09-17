"use client";

import React, { Fragment, useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from './theme-provider';
import { 
  HomeIcon, 
  MagnifyingGlassIcon as SearchIcon,
  PlusCircleIcon, 
  PaperAirplaneIcon,
  UserGroupIcon,
  UserIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  MoonIcon,
  SunIcon,
  ShoppingCartIcon,
  BookmarkIcon,
  Cog6ToothIcon as CogIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  MagnifyingGlassIcon as SearchIconSolid, 
  PlusCircleIcon as PlusCircleIconSolid, 
  PaperAirplaneIcon as PaperAirplaneIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout as logoutAction } from '@/store/slice/authSlice';

export function Navbar() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role;
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder to prevent layout shift
    return (
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isActive = (path: string) => pathname === path;

  const roleHome = role === 'seller' ? '/seller/dashboard' : role === 'superadmin' ? '/superadmin/dashboard' : role === 'admin' ? '/admin' : '/';

  const navItems = [
    { 
      name: 'Home', 
      href: roleHome, 
      icon: isActive(roleHome) ? HomeIconSolid : HomeIcon,
    },
    { 
      name: 'Search', 
      href: '/explore', 
      icon: isActive('/explore') ? SearchIconSolid : SearchIcon,
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: isActive('/messages') ? PaperAirplaneIconSolid : PaperAirplaneIcon,
    },
    { 
      name: 'Create', 
      href: '/create', 
      icon: isActive('/create') ? PlusCircleIconSolid : PlusCircleIcon,
    },
    { 
      name: 'Discover', 
      href: '/explore/people', 
      icon: isActive('/explore/people') ? UserGroupIconSolid : UserGroupIcon,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left - Logo */}
          <Link href={roleHome} className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
              SocialShop
            </h1>
          </Link>

          {/* Center - Search (hidden on mobile) */}
          <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 w-1/3 max-w-md">
            <SearchIcon className="h-4 w-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent border-none outline-none w-full text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500"
            />
          </div>

          {/* Right - Navigation Icons */}
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className={`p-2 rounded-md ${isActive(item.href) ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'}`} aria-label={item.name}>
                  <Icon className="h-6 w-6" />
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className={clsx('p-2 rounded-md transition-colors','text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white','focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500','dark:focus:ring-offset-gray-900')}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolvedTheme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>

            {user ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 focus:outline-none">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
                    <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 p-0.5">
                      <Image src="https://i.pravatar.cc/150?img=1" alt="Profile" width={32} height={32} className="rounded-full object-cover h-full w-full" unoptimized />
                    </div>
                  </div>
                </Menu.Button>
                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link href={role === 'seller' ? '/seller/profile' : role === 'superadmin' ? '/superadmin/dashboard' : '/user/profile'} className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}>
                            <UserIcon className="mr-2 h-5 w-5" />
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link href={role === 'seller' ? '/seller/orders' : '/user/wishlist'} className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}>
                            <BookmarkIcon className="mr-2 h-5 w-5" />
                            {role === 'seller' ? 'Orders' : 'Saved'}
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link href={role === 'seller' ? '/seller/products' : '/shop'} className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}>
                            <ShoppingCartIcon className="mr-2 h-5 w-5" />
                            {role === 'seller' ? 'Products' : 'Shop'}
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link href={role === 'seller' ? '/seller/settings' : role === 'superadmin' ? '/superadmin/settings' : '/user/settings'} className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}>
                            <CogIcon className="mr-2 h-5 w-5" />
                            Settings
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={() => { dispatch(logoutAction()); router.push('/'); }} className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-500`}>
                            <LogoutIcon className="mr-2 h-5 w-5" />
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <button type="button" onClick={() => router.push('/login')} className="flex items-center space-x-2 focus:outline-none" aria-label="Open profile (login required)">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
                  <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 p-0.5">
                    <Image src="https://i.pravatar.cc/150?img=1" alt="Profile" width={32} height={32} className="rounded-full object-cover h-full w-full" unoptimized />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}