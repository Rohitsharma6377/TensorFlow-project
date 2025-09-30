"use client";

import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import { XMarkIcon, BellIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { listNotifications, markAllRead, markRead, seedNotifications, type NotificationItem } from "@/store/slice/notificationSlice";
import { mockNotifications } from "@/store/seed/notifications";
import { useRouter } from "next/navigation";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items, status } = useAppSelector((s) => s.notifications);
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Load notifications on open
  useEffect(() => {
    if (open) dispatch(listNotifications(undefined));
  }, [open, dispatch]);

  const groups = useMemo(() => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    for (const n of items) {
      const t = n.createdAt ? new Date(n.createdAt) : new Date();
      if (t >= startOfToday) today.push(n);
      else if (t >= startOfYesterday) yesterday.push(n);
      else earlier.push(n);
    }
    return { today, yesterday, earlier };
  }, [items]);

  const relTime = (d: Date) => {
    const diff = Math.max(0, Date.now() - d.getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const nameOf = (n: NotificationItem) => (n.actor?.name || n.shop?.name || "Someone");
  const avatarOf = (n: NotificationItem) => (n.actor?.avatar as string | undefined);

  const go = async (n: NotificationItem) => {
    try { await dispatch(markRead(n._id)).unwrap(); } catch {}
    if (n.post) router.push(`/posts/${typeof n.post === 'string' ? n.post : n.post._id}`);
    else if (n.story) router.push(`/stories/${typeof n.story === 'string' ? n.story : n.story._id}`);
    else if (n.shop) router.push(`/shops/${typeof n.shop === 'string' ? n.shop : n.shop._id}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ zIndex: 2147483646 }}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed top-0 right-0 h-screen w-full max-w-md bg-white dark:bg-gray-900 border-l shadow-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ zIndex: 2147483647, transform: open ? 'translateX(0)' as const : 'translateX(100%)' as const }}
        aria-hidden={!open}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between border-b px-4 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          <h2 className="text-base font-semibold">Notifications</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(markAllRead())}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/70"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-muted"
              aria-label="Close notifications"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="h-full overflow-y-auto p-4 space-y-6">
          {status === 'loading' && (
            <div className="text-xs text-muted-foreground">Loading...</div>
          )}
          {items.length === 0 && (
            <div className="text-center text-sm text-muted-foreground space-y-3">
              <div>No notifications yet.</div>
              <button
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs"
                onClick={() => dispatch(seedNotifications(mockNotifications))}
              >
                Load sample notifications
              </button>
            </div>
          )}

          {(['today','yesterday','earlier'] as const).map((k) => (
            <div key={k}>
              <div className="text-[11px] tracking-wide font-semibold uppercase text-muted-foreground mb-2">{k}</div>
              <div className="space-y-2.5">
                {groups[k].length === 0 && (
                  <div className="text-xs text-muted-foreground">No notifications</div>
                )}
                {groups[k].map((n) => (
                  <div
                    key={n._id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-md cursor-pointer border bg-white/80 dark:bg-gray-900/80 backdrop-blur",
                      !n.readAt ? "ring-1 ring-primary/20" : "hover:bg-muted"
                    )}
                    onClick={() => go(n)}
                  >
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      {avatarOf(n) ? (
                        <Image src={avatarOf(n)!} alt={nameOf(n)} width={36} height={36} className="h-full w-full object-cover" />
                      ) : (
                        <BellIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-5">
                        <button
                          className="font-medium hover:underline"
                          onClick={(e) => { e.stopPropagation(); if (n.shop) router.push(`/shops/${typeof n.shop === 'string' ? n.shop : n.shop._id}`); }}
                          aria-label="Open shop"
                        >
                          {nameOf(n)}
                        </button>{' '}
                        {n.type === 'follow' && 'followed your shop'}
                        {n.type === 'unfollow' && 'unfollowed your shop'}
                        {n.type === 'post_new' && 'posted a new product'}
                        {n.type === 'post_like' && 'liked your post'}
                        {n.type === 'post_comment' && 'commented on your post'}
                        {n.type === 'story_new' && 'added a new story'}
                        {n.type === 'story_like' && 'liked your story'}
                        {n.message ? <span className="text-muted-foreground"> — {n.message}</span> : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{relTime(new Date(n.createdAt || Date.now()))}</div>
                    </div>
                    {!n.readAt && <span className="ml-2 h-2.5 w-2.5 rounded-full bg-primary mt-1" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default NotificationsPanel;
