"use client";
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import Link from 'next/link';
import { ShoppingCart, Bell, User2 } from 'lucide-react';
import clsx from 'classnames';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">Social Commerce</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-slate-600 hover:text-slate-900">Feed</Link>
          <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">Admin</Link>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">Seller</Link>
          <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          <Link href="/cart" className="rounded-lg p-2 hover:bg-slate-100" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <User2 className="h-4 w-4" />
                Account
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        className={clsx(
                          active ? 'bg-slate-100' : '','group flex w-full items-center rounded-md px-2 py-2 text-sm')}
                        href="/profile"
                      >
                        Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          active ? 'bg-slate-100' : '','group flex w-full items-center rounded-md px-2 py-2 text-sm')}
                      >
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  );
}
