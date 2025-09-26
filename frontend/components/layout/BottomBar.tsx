"use client";

import React, { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store";
import { logout as logoutAction } from "@/store/slice/authSlice";
import { Menu, Transition } from "@headlessui/react";
import {
  HomeIcon,
  MagnifyingGlassIcon as SearchIcon,
  ShoppingCartIcon,
  UserIcon,
  Cog6ToothIcon as CogIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  GiftIcon,
  ClipboardDocumentListIcon as OrdersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function BottomBar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="lg:hidden">
      {/* Spacer so content is not hidden behind bar */}
      <div className="h-14" />
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="mx-auto max-w-3xl grid grid-cols-4 text-center py-2">
          <Link href="/" className={clsx("flex flex-col items-center gap-1", isActive("/") ? "text-emerald-600" : "text-gray-600 dark:text-gray-300")}> 
            <HomeIcon className="h-6 w-6" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link href="/explore" className={clsx("flex flex-col items-center gap-1", isActive("/explore") ? "text-emerald-600" : "text-gray-600 dark:text-gray-300")}> 
            <SearchIcon className="h-6 w-6" />
            <span className="text-[10px]">Search</span>
          </Link>
          <Link href="/cart" className={clsx("flex flex-col items-center gap-1", isActive("/cart") ? "text-emerald-600" : "text-gray-600 dark:text-gray-300")}> 
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="text-[10px]">Cart</span>
          </Link>

          {/* Profile menu */}
          {user && accessToken ? (
            <Menu as="div" className="relative flex items-center justify-center">
              <Menu.Button className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300">
                <UserIcon className="h-6 w-6" />
                <span className="text-[10px]">Profile</span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute bottom-12 right-2 w-56 origin-bottom-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 focus:outline-none">
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/user/profile" className={clsx("group flex w-full items-center rounded-md px-2 py-2 text-sm", active ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" : "text-gray-900 dark:text-gray-100")}> 
                          <UserIcon className="mr-2 h-5 w-5" />
                          Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/user/orders" className={clsx("group flex w-full items-center rounded-md px-2 py-2 text-sm", active ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" : "text-gray-900 dark:text-gray-100")}>
                          <OrdersIcon className="mr-2 h-5 w-5" />
                          Orders
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/user/rewards" className={clsx("group flex w-full items-center rounded-md px-2 py-2 text-sm", active ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" : "text-gray-900 dark:text-gray-100")}>
                          <GiftIcon className="mr-2 h-5 w-5" />
                          Rewards
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/user/settings" className={clsx("group flex w-full items-center rounded-md px-2 py-2 text-sm", active ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" : "text-gray-900 dark:text-gray-100")}>
                          <CogIcon className="mr-2 h-5 w-5" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => {
                            dispatch(logoutAction());
                            try { document.cookie = 'role=; Max-Age=0; Path=/'; } catch {}
                            router.push('/');
                          }}
                          className={clsx("group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-500", active && "bg-gray-100 dark:bg-gray-700")}
                        >
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
            <button onClick={() => router.push('/login')} className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300">
              <UserIcon className="h-6 w-6" />
              <span className="text-[10px]">Login</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
