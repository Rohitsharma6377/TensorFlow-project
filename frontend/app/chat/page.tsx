"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatAPI, ShopsAPI, SocialAPI, ProductAPI } from "@/lib/api";
import { getSocket, connectSocket, joinConversationRoom, leaveConversationRoom } from "@/lib/socket";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import LeftSidebar from "@/components/feed/LeftSidebar";
// MUI Icons
import MenuRounded from "@mui/icons-material/MenuRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import CallRounded from "@mui/icons-material/CallRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import AttachFileRounded from "@mui/icons-material/AttachFileRounded";
import MicRounded from "@mui/icons-material/MicRounded";
import SendRounded from "@mui/icons-material/SendRounded";

export default function ChatPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const seller = search.get("seller"); // seller user id
  const shop = search.get("shop"); // shop id
  const post = search.get("post"); // optional post id to tie context

  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [conversations, setConversations] = useState<any[]>([]);
  const [followedShops, setFollowedShops] = useState<Array<{ _id: string; name: string; slug: string; logo?: { url: string }; owner: string }>>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [showChats, setShowChats] = useState(false); // mobile drawer for chat list
  const [currentShopSlug, setCurrentShopSlug] = useState<string | null>(null);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [currentShopName, setCurrentShopName] = useState<string | null>(null);
  const [currentShopLogo, setCurrentShopLogo] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false); // right profile drawer
  const [chatSearch, setChatSearch] = useState("");
  const [chattedOnly, setChattedOnly] = useState(true);
  const [currentShopPhone, setCurrentShopPhone] = useState<string | null>(null);

  // Inline component to render a product preview card when a link is detected
  function ProductPreviewCard({ productId }: { productId: string }) {
    const [p, setP] = useState<any | null>(null);
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const r = await ProductAPI.get(productId);
          if (!mounted) return;
          setP(r?.product || null);
        } catch { setP(null); }
      })();
      return () => { mounted = false; };
    }, [productId]);
    if (!p) return null;
    const href = `/shops/shop/products/${p._id}`;
    const img = p.mainImage || (Array.isArray(p.images) && p.images[0]) || '/product-placeholder.png';
    return (
      <Link href={href} className="mt-2 inline-block border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow w-[220px] text-left">
        <div className="aspect-square bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={p.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-2">
          <div className="text-sm font-medium line-clamp-2">{p.title}</div>
          {typeof p.price === 'number' && (
            <div className="text-emerald-700 font-semibold mt-1">₹{Number(p.price).toLocaleString()}</div>
          )}
        </div>
      </Link>
    );
  }

  const isAuthed = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      // Stash redirect and push to login
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", `/chat?${search.toString()}`);
      }
      router.push("/login");
      return;
    }
  }, [isAuthed, router, search]);

  // Lock page scroll while on chat so only the message list can scroll (iOS friendly)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const html = document.documentElement;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyWidth = document.body.style.width;
    const scrollY = window.scrollY;
    const nextRoot = document.getElementById('__next') || document.getElementById('root');
    const prevNextOverflow = nextRoot ? (nextRoot as HTMLElement).style.overflow : undefined;
    const prevNextHeight = nextRoot ? (nextRoot as HTMLElement).style.height : undefined;

    // Prevent background scroll and keep layout width stable
    document.body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    if (nextRoot) {
      (nextRoot as HTMLElement).style.overflow = 'hidden';
      (nextRoot as HTMLElement).style.height = '100dvh';
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.width = prevBodyWidth;
      if (nextRoot) {
        (nextRoot as HTMLElement).style.overflow = prevNextOverflow || '';
        (nextRoot as HTMLElement).style.height = prevNextHeight || '';
      }
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Load followed shops for sidebar after auth
  useEffect(() => {
    (async () => {
      if (!isAuthed) return;
      try {
        // conversations still available for future use if needed
        const convRes = await ChatAPI.listConversations().catch(() => ({ conversations: [] }));
        setConversations(convRes.conversations || []);
        const f = await SocialAPI.following();
        const ids = (f.shops || []);
        if (ids.length) {
          const bulk = await ShopsAPI.bulk(ids);
          setFollowedShops(bulk.shops || []);
        } else {
          setFollowedShops([]);
        }
        // Resolve shop slug for navigation if query has an id
        if (shop) {
          const looksLikeId = /^[a-f0-9]{24}$/i.test(shop);
          if (looksLikeId) {
            try {
              const b = await ShopsAPI.bulk([shop]);
              const one = (b.shops || [])[0];
              if (one?.slug) setCurrentShopSlug(one.slug);
              if (one?._id) setCurrentShopId(one._id);
              if (one?.name) setCurrentShopName(one.name);
              if (one?.logo?.url) setCurrentShopLogo(one.logo.url);
            } catch {}
          } else {
            setCurrentShopSlug(shop);
            // Try to resolve id from following list cache
            const found = (Array.isArray(followedShops) ? followedShops : []).find((x:any)=>x.slug===shop);
            if (found?._id) setCurrentShopId(found._id);
            if (found?.name) setCurrentShopName(found.name);
            if (found?.logo?.url) setCurrentShopLogo(found.logo.url);
          }
        }
      } catch {}
    })();
  }, [isAuthed]);

  // When we know the slug, fetch shop details to retrieve name/logo/phone
  useEffect(() => {
    (async () => {
      try {
        if (currentShopSlug) {
          const res: any = await ShopsAPI.getBySlug(currentShopSlug);
          const phone = res?.shop?.contact?.phone || res?.shop?.contactPhone || null;
          setCurrentShopPhone(phone || null);
          if (res?.shop?.name) setCurrentShopName(res.shop.name);
          // Best-effort resolve logo via bulk using id, as some backends omit logo in getBySlug
          if (res?.shop?._id) {
            try {
              const b = await ShopsAPI.bulk([String(res.shop._id)]);
              const one = (b?.shops || [])[0];
              if (one?.logo?.url) setCurrentShopLogo(one.logo.url);
              if (!currentShopName && one?.name) setCurrentShopName(one.name);
            } catch {}
          } else if (res?.shop?.logo?.url) {
            setCurrentShopLogo(res.shop.logo.url);
          }
        }
      } catch {
        setCurrentShopPhone(null);
      }
    })();
  }, [currentShopSlug]);

  // Ensure or load conversation, then connect socket, join room and fetch messages
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!seller) {
          setError("Missing seller parameter");
          return;
        }
        // Establish socket connection early to avoid join delay
        await connectSocket().catch(() => {});
        const ensured = await ChatAPI.ensureConversation([seller], post ? { postId: post } : undefined);
        const id = ensured.conversation._id;
        if (!mounted) return;
        // When switching conversations, leave previous room
        if (convId && convId !== id) leaveConversationRoom(convId);
        setConvId(id);
        joinConversationRoom(id);
        const list = await ChatAPI.getMessages(id, 1, 30);
        if (!mounted) return;
        const msgs = list.messages || [];
        // seed seen ids
        seenIdsRef.current = new Set(msgs.map((m: any) => String(m._id || '')));
        setMessages(msgs);
        // If navigated from a product page, auto-send the prefilled message once
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('chatPrefill') : null;
          if (raw) {
            const pre = JSON.parse(raw);
            await ChatAPI.sendMessage(id, { text: pre.text, attachments: pre.image ? [pre.image] : undefined });
            localStorage.removeItem('chatPrefill');
            const list2 = await ChatAPI.getMessages(id, 1, 30);
            if (!mounted) return;
            setMessages(list2.messages || msgs);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        } catch {}
        // Wire socket listener
        const s = getSocket();
        const onMsg = (payload: { conversationId: string; message: any }) => {
          if (payload.conversationId === id) {
            const msgId = String(payload.message?._id || '');
            if (msgId && seenIdsRef.current.has(msgId)) return;
            if (msgId) seenIdsRef.current.add(msgId);
            setMessages((prev) => [...prev, payload.message]);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        };
        s.on("chat:message", onMsg);
        return () => {
          s.off("chat:message", onMsg);
        };
      } catch (e: any) {
        setError(e?.message || "Failed to start chat");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (convId) leaveConversationRoom(convId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller, post]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!convId || !input.trim()) return;
    const text = input.trim();
    setInput("");
    try {
      // Ensure socket is connected to reduce server round-trip on echo
      await connectSocket().catch(() => {});
      // Optimistic message
      const tempId = `tmp-${Date.now()}`;
      const optimistic = {
        _id: tempId,
        conversation: convId,
        text,
        createdAt: new Date().toISOString(),
        pending: true,
      } as any;
      setMessages((prev) => [...prev, optimistic]);
      // Send to server
      const res = await ChatAPI.sendMessage(convId, { text });
      // Reconcile: replace optimistic with server message
      setMessages((prev) => prev.map((m) => (m._id === tempId ? res.message : m)));
      const realId = String(res.message?._id || '');
      if (realId) seenIdsRef.current.add(realId);
    } catch (e) {
      // If sending fails, restore text and mark last optimistic (if any) as failed
      setMessages((prev) => prev.map((m) => (m.pending ? { ...m, failed: true } : m)));
      setInput(text);
    }
  }

  // Upload helper mirrors other parts of app
  async function uploadFile(file: File, folder: string) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch((process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000') + '/api/v1/uploads', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Upload failed');
    return data?.url || data?.secure_url || data?.location || data?.path;
  }

  async function sendImage(file: File) {
    if (!convId || !file) return;
    try {
      await connectSocket().catch(() => {});
      const url = await uploadFile(file, 'chat');
      const res = await ChatAPI.sendMessage(convId, { attachments: [url] });
      const realId = String(res.message?._id || '');
      if (realId) seenIdsRef.current.add(realId);
      setMessages((prev) => [...prev, res.message]);
    } catch {}
  }

  // Share current shop as a rich-like message (text + optional logo attachment)
  async function shareShop() {
    if (!convId) return;
    const slug = currentShopSlug || shop || '';
    const text = slug ? `Check out this shop: /shops/${slug}` : 'Check out this shop';
    try {
      await connectSocket().catch(() => {});
      // Try to attach a logo if we have it from the sidebar cache
      const logo = (followedShops.find((s:any)=> s.slug===slug)?.logo?.url) || undefined;
      const payload: any = logo ? { text, attachments: [logo] } : { text };
      const res = await ChatAPI.sendMessage(convId, payload);
      const realId = String(res.message?._id || '');
      if (realId) seenIdsRef.current.add(realId);
      setMessages((prev) => [...prev, res.message]);
    } catch {}
  }

  // Paste image from clipboard into chat
  async function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    try {
      const items = e.clipboardData?.items || [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === 'file') {
          const f = it.getAsFile();
          if (f && /^image\//.test(f.type)) {
            e.preventDefault();
            await sendImage(f);
            return;
          }
        }
      }
    } catch {}
  }

  async function toggleRecording() {
    if (!convId) return;
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        await sendImage(file);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {}
  }

  if (!isAuthed) return null;
  if (loading) return <div className="p-6">Connecting chat…</div>;
  if (error) return (
    <div className="p-6 space-y-3">
      <div className="text-red-600">{error}</div>
      <Link className="text-emerald-700 hover:underline" href={shop ? `/shops/${shop}` : "/"}>Go back</Link>
    </div>
  );
  if (!convId) return <div className="p-6">Unable to open conversation.</div>;

  return (
    <div className="mx-auto p-0 md:p-4 h-[calc(100dvh-120px)] min-h-[calc(100dvh-120px)] max-h-[calc(100dvh-120px)] grid grid-cols-1 lg:grid-cols-[260px_320px_1fr] gap-0 md:gap-4 overflow-hidden overscroll-none">
      {/* Global Left Sidebar */}
      <aside className="hidden lg:block rounded-lg overflow-hidden h-full min-h-0">
        <LeftSidebar />
      </aside>

      {/* Chat list (followed shops) */}
      <aside className="hidden md:block border md:border rounded-lg bg-white overflow-hidden h-full min-h-0">
        <div className="p-3 border-b flex items-center justify-between gap-2">
          <div className="font-semibold">Conversations</div>
          {(currentShopSlug || shop) && (
            <Link className="text-xs text-emerald-700 hover:underline" href={`/shops/${currentShopSlug || shop}`}>View shop</Link>
          )}
        </div>
        <div className="p-2 border-b flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Search shops"
              value={chatSearch}
              onChange={(e)=>setChatSearch(e.target.value)}
            />
            <SearchRounded fontSize="small" className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input type="checkbox" className="accent-emerald-600" checked={chattedOnly} onChange={(e)=>setChattedOnly(e.target.checked)} />
            Chatted
          </label>
        </div>
        <div className="h-full max-h-full overflow-y-auto">
          {followedShops.length === 0 && (
            <div className="p-3 text-sm text-slate-500">No followed shops yet.</div>
          )}
          {(() => {
            // Build owner set from conversations to show only chatted shops if toggled
            const otherIds = new Set<string>();
            conversations.forEach((c: any) => {
              const parts: any[] = c.participants || [];
              parts.forEach((pid: any) => {
                if (String(pid) !== String(user?.id)) otherIds.add(String(pid));
              });
            });
            const base = chattedOnly ? followedShops.filter(s => otherIds.has(String(s.owner))) : followedShops;
            const filtered = base.filter((s) =>
              (s.name || '').toLowerCase().includes(chatSearch.toLowerCase()) ||
              (s.slug || '').toLowerCase().includes(chatSearch.toLowerCase())
            );
            return filtered.map((s) => (
            <button
              key={s._id}
              className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-3`}
              onClick={async () => {
                try {
                  await connectSocket().catch(() => {});
                  const ensured = await ChatAPI.ensureConversation([s.owner]);
                  const id = ensured.conversation._id;
                  if (convId && convId !== id) leaveConversationRoom(convId);
                  setConvId(id);
                  joinConversationRoom(id);
                  const list = await ChatAPI.getMessages(id, 1, 30);
                  const msgs = list.messages || [];
                  seenIdsRef.current = new Set(msgs.map((m: any) => String(m._id || '')));
                  setMessages(msgs);
                  // If coming from a product "Chat with Shop", auto-send prefilled message once
                  try {
                    const raw = typeof window !== 'undefined' ? localStorage.getItem('chatPrefill') : null;
                    if (raw) {
                      const pre = JSON.parse(raw);
                      await ChatAPI.sendMessage(id, { text: pre.text, attachments: pre.image ? [pre.image] : undefined });
                      localStorage.removeItem('chatPrefill');
                      // Refresh messages after sending
                      const list2 = await ChatAPI.getMessages(id, 1, 30);
                      setMessages(list2.messages || msgs);
                    }
                  } catch {}
                  setShowChats(false);
                  setCurrentShopSlug(s.slug || null);
                  setCurrentShopId(s._id || null);
                } catch {}
              }}
            >
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shadow-sm">
                {s.logo?.url ? (
                  <img src={s.logo.url} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-emerald-700 text-sm">{s.name?.[0]?.toUpperCase() || 'S'}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.name}</div>
                <div className="text-xs text-slate-500 truncate">@{s.slug}</div>
              </div>
            </button>
            ));
          })()}
        </div>
      </aside>

      {/* Chat main (compact, aligned right) */}
      <div className="rounded-lg border bg-white flex flex-col relative min-h-0 h-full overflow-hidden">
        <div className="px-2 sm:px-4 py-2 border-b flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-slate-50 transition-transform duration-200 hover:scale-110 active:scale-95" onClick={() => setShowChats(true)} aria-label="Open chat list"><MenuRounded fontSize="small" /></button>
            <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setShowProfile(true)} title="View profile">
              {currentShopLogo ? (
                <img src={currentShopLogo} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sky-700 text-sm">{(currentShopName?.[0] || 'C').toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{currentShopName || 'Conversation'}</div>
              <div className="text-xs text-emerald-600">Online</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Removed search/profile icons per request. Keep Call only. */}
            {currentShopPhone ? (
              <a href={`tel:${currentShopPhone}`} className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400/30 to-emerald-400/30 hover:from-sky-400/50 hover:to-emerald-400/50 flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-110 active:scale-95" title={`Call ${currentShopPhone}`} aria-label="Call shop">
                <CallRounded fontSize="small" className="text-emerald-700"/>
              </a>
            ) : (
              <button className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 opacity-60 cursor-not-allowed flex items-center justify-center" title="Phone not available" disabled aria-disabled>
                <CallRounded fontSize="small" className="text-emerald-700"/>
              </button>
            )}
            {shop && <button className="hidden sm:inline text-sm text-red-600 hover:underline" onClick={() => setReportOpen(true)}>Report</button>}
            {(currentShopSlug || shop) && (
              <Link className="hidden sm:inline text-sm text-emerald-700 hover:underline" href={`/shops/${currentShopSlug || shop}`}>View</Link>
            )}
          </div>
        </div>
        <div
          className="p-2 sm:p-3 flex-1 overflow-y-auto overscroll-contain touch-pan-y bg-gradient-to-br from-emerald-50/70 via-white/70 to-sky-50/70 bg-center bg-cover"
          style={{
            backgroundImage:
              "linear-gradient(to bottom right, rgba(16,185,129,0.08), rgba(255,255,255,0.08), rgba(56,189,248,0.08)), url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1800&q=60')",
          }}
        >
          <div className="w-full px-1">
          {messages.length === 0 && (
            <div className="text-sm text-slate-500">No messages yet. Say hello!</div>
          )}
          {messages.map((m) => {
            const mine = String(m.sender || '') === String(user?.id);
            const bubble = mine
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm'
              : 'bg-white border shadow-sm';
            // Detect product link either legacy /products/:id or current /shops/shop/products/:id
            const txt: string = m.text || '';
            const match = txt.match(/\/(?:shops\/shop\/products|products)\/([a-z0-9]{24})/i);
            const productId = match ? match[1] : null;
            const cleanedText = productId ? txt.replace(/\s*\/(?:shops\/shop\/products|products)\/[a-z0-9]{24}/i, '').trim() : txt;
            return (
              <div key={m._id || m.tempId || Math.random()} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {!mine && (
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs select-none">S</div>
                )}
                <div className={`${mine ? 'items-end text-right' : 'items-start text-left'} flex flex-col max-w-[98%] sm:max-w-[92%]`}>
                  <div className="text-[11px] text-slate-500 mb-1">{new Date(m.createdAt || Date.now()).toLocaleString()}</div>
                  {cleanedText && (
                    <div className={`px-3 py-2 rounded-2xl inline-block mt-1 ${bubble} ${m.pending ? 'opacity-80' : ''}`}>
                      {cleanedText}
                      {m.failed && <span className="ml-2 text-[10px] opacity-80">• failed</span>}
                    </div>
                  )}
                  {productId && (
                    <ProductPreviewCard productId={productId} />
                  )}
                  {Array.isArray(m.attachments) && m.attachments.map((a: string, idx: number) => (
                    a.match(/\.(png|jpe?g|gif|webp|svg)$/i) ? (
                      <div key={idx} className={`mt-2 ${mine ? 'text-right' : 'text-left'}`}>
                        <img src={a} alt="attachment" className="max-w-[260px] sm:max-w-[320px] rounded-lg border" />
                      </div>
                    ) : (
                      <div key={idx} className="mt-2">
                        <audio src={a} controls className="max-w-full" />
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
          </div>
        </div>
        <div className="p-2 sm:p-3 border-t flex items-center gap-1 sm:gap-2 max-w-2xl ml-auto mr-0 w-full sticky bottom-0 bg-white pb-[env(safe-area-inset-bottom)]">
          <label className="shrink-0 h-10 w-10 rounded-md border cursor-pointer bg-white hover:bg-slate-50 flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95" title="Attach file" aria-label="Attach file">
            <AttachFileRounded fontSize="small" className="text-slate-600" />
            <input type="file" accept="image/*,audio/*" hidden onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await sendImage(f);
              e.currentTarget.value = '';
            }} />
          </label>
          <button
            className={`shrink-0 h-10 w-10 rounded-md border ${isRecording ? 'bg-red-50 text-red-600' : 'bg-white hover:bg-slate-50'} transition-transform duration-200 hover:scale-110 active:scale-95`}
            onClick={toggleRecording}
            title={isRecording ? 'Stop recording' : 'Record voice'}
          >
            <MicRounded fontSize="small" />
          </button>
          <input
            className="flex-1 min-w-0 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button className="shrink-0 h-10 w-10 bg-gradient-to-br from-sky-500 to-emerald-600 text-white rounded-md shadow-sm grid place-items-center transition-transform duration-200 hover:scale-110 active:scale-95" onClick={send} title="Send" aria-label="Send message"><SendRounded fontSize="small"/></button>
        </div>
      </div>

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <div className="text-lg font-semibold mb-2">Report shop</div>
            <textarea
              className="w-full border rounded-md p-2 h-28"
              placeholder="Describe the issue..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-2 border rounded-md" onClick={() => setReportOpen(false)}>Cancel</button>
              <button
                className="px-3 py-2 rounded-md bg-red-600 text-white"
                onClick={async () => {
                  if (!currentShopId && shop) {
                    // best-effort resolve id if only slug is present
                    try {
                      const looksLikeId = /^[a-f0-9]{24}$/i.test(shop);
                      if (!looksLikeId) {
                        const b = await ShopsAPI.bulk((followedShops||[]).map((s:any)=>s._id));
                        const match = (b.shops||[]).find((x:any)=>x.slug===shop);
                        if (match?._id) setCurrentShopId(match._id);
                      }
                    } catch {}
                  }
                  if (!currentShopId) return setReportOpen(false);
                  try {
                    await ShopsAPI.report(currentShopId, { reason: reportText || 'Inappropriate behavior', details: reportText, conversation: convId || undefined });
                  } catch {}
                  setReportOpen(false);
                  setReportText('');
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Profile drawer */}
      {showProfile && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowProfile(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[88%] sm:w-[360px] bg-white shadow-xl border-l flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">User Profile</div>
              <button className="h-9 px-3 rounded-md border hover:bg-slate-50" onClick={() => setShowProfile(false)}>Close</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-sky-100 overflow-hidden flex items-center justify-center">
                  {(() => {
                    const logo = currentShopLogo || followedShops.find(x => x.slug === (currentShopSlug || shop || ''))?.logo?.url;
                    if (logo) return (<img src={logo} alt="avatar" className="h-full w-full object-cover" />);
                    const nm = currentShopName || followedShops.find(x => x.slug === (currentShopSlug || shop || ''))?.name || 'C';
                    return (<span className="text-sky-700 text-lg">{(nm[0] || 'C').toUpperCase()}</span>);
                  })()}
                </div>
                <div>
                  <div className="font-semibold">{currentShopName || followedShops.find(x=>x.slug===(currentShopSlug||shop||''))?.name || 'Conversation'}</div>
                  {(() => {
                    const s = currentShopSlug || shop || '';
                    const looksId = /^[a-f0-9]{24}$/i.test(s);
                    return !looksId ? (<div className="text-xs text-slate-500">@{s}</div>) : null;
                  })()}
                </div>
              </div>
              {(currentShopSlug || shop) && (
                <Link className="text-sm text-emerald-700 hover:underline" href={`/shops/${currentShopSlug || shop}`}>View shop</Link>
              )}
              <div className="flex items-center gap-2 pt-2">
                <button className="px-3 py-2 border rounded-md" onClick={() => setReportOpen(true)}>Report</button>
                <button className="px-3 py-2 border rounded-md" onClick={() => setShowProfile(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mobile chat drawer */}
      {showChats && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowChats(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-xl flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="font-semibold">Chats</div>
              <button className="h-9 px-3 rounded-md border hover:bg-slate-50" onClick={() => setShowChats(false)}>Close</button>
            </div>
            <div className="p-2 border-b flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Search shops"
                  value={chatSearch}
                  onChange={(e)=>setChatSearch(e.target.value)}
                />
                <SearchRounded fontSize="small" className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input type="checkbox" className="accent-emerald-600" checked={chattedOnly} onChange={(e)=>setChattedOnly(e.target.checked)} />
                Chatted
              </label>
            </div>
            <div className="flex-1 overflow-y-auto">
              {followedShops.length === 0 && (
                <div className="p-3 text-sm text-slate-500">No followed shops yet.</div>
              )}
              {(() => {
                const otherIds = new Set<string>();
                conversations.forEach((c: any) => {
                  const parts: any[] = c.participants || [];
                  parts.forEach((pid: any) => {
                    if (String(pid) !== String(user?.id)) otherIds.add(String(pid));
                  });
                });
                const base = chattedOnly ? followedShops.filter(s => otherIds.has(String(s.owner))) : followedShops;
                const filtered = base.filter((s) =>
                  (s.name || '').toLowerCase().includes(chatSearch.toLowerCase()) ||
                  (s.slug || '').toLowerCase().includes(chatSearch.toLowerCase())
                );
                return filtered.map((s) => (
                  <button
                    key={s._id}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-3`}
                    onClick={async () => {
                      try {
                        await connectSocket().catch(() => {});
                        const ensured = await ChatAPI.ensureConversation([s.owner]);
                        const id = ensured.conversation._id;
                        if (convId && convId !== id) leaveConversationRoom(convId);
                        setConvId(id);
                        joinConversationRoom(id);
                        const list = await ChatAPI.getMessages(id, 1, 30);
                        const msgs = list.messages || [];
                        seenIdsRef.current = new Set(msgs.map((m: any) => String(m._id || '')));
                        setMessages(msgs);
                        setCurrentShopSlug(s.slug || null);
                        setCurrentShopId(s._id || null);
                      } catch {}
                      setShowChats(false);
                    }}
                  >
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shadow-sm">
                      {s.logo?.url ? (
                        <img src={s.logo.url} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-emerald-700 text-sm">{s.name?.[0]?.toUpperCase() || 'S'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-slate-500 truncate">@{s.slug}</div>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
