'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send,
  ShieldAlert,
  Search,
  ArrowLeft,
  MoreVertical,
  Ban,
  Flag,
  Check,
  CheckCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { getPusherClient } from '@/lib/pusher/client';
import { playNotificationSound } from '@/lib/audio/sound';

interface MessagesClientProps {
  currentUser: any;
  initialConversations: any[];
  initialConversationId?: string;
}

const QUICK_REPLIES = [
  'Hala müsait mi?',
  'Fiyatta pazarlık payı var mı?',
  'Ne zaman görebilirim?',
  'Konum tam olarak neresi?',
];

export default function MessagesClient({
  currentUser,
  initialConversations,
  initialConversationId,
}: MessagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<any[]>(initialConversations);
  // activeId is set only if explicitly provided via URL; on mobile without URL id it starts as null (showing list)
  const [activeId, setActiveId] = useState<string | null>(initialConversationId || null);

  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConvMeta, setActiveConvMeta] = useState<any>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Message input state
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  // Modal states
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('DOLANDIRICILIK');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Block state
  const [blockLoading, setBlockLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef<boolean>(true);
  const lastMsgCountRef = useRef<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef<boolean>(false);

  // Auto-select first conversation on desktop (>768px) only on client mount
  useEffect(() => {
    if (window.innerWidth >= 768 && !activeId && initialConversations.length > 0) {
      setActiveId(initialConversations[0].id);
    }
  }, []);

  // Close 3-dots menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync activeId with URL query params if changed
  useEffect(() => {
    const qId = searchParams.get('id') || searchParams.get('conversationId');
    if (qId && qId !== activeId) {
      setActiveId(qId);
    }
  }, [searchParams]);

  // Fetch conversation messages when activeId changes
  useEffect(() => {
    if (!activeId) {
      setActiveConvMeta(null);
      setMessages([]);
      return;
    }
    isFirstLoadRef.current = true;
    lastMsgCountRef.current = 0;
    fetchConversationData(activeId);
    setModerationError(null);
    setMenuOpen(false);
  }, [activeId]);

  // Smooth scroll within message container (without scrolling viewport)
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;

    const countIncreased = messages.length > lastMsgCountRef.current;
    lastMsgCountRef.current = messages.length;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (countIncreased) {
      const isMe = messages[messages.length - 1]?.senderId === currentUser.id;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 180;

      if (isMe || isNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, currentUser?.id]);

  // Real-time incoming messages across OTHER conversations (background notifications via Pusher + SSE fallback)
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleOtherMessage = (data: any) => {
      if (data.type === 'MESSAGE') {
        // If the incoming message belongs to the currently active conversation,
        // the active conversation stream (/api/messages/stream / conversation channel) handles message appending, read receipts, and sound.
        // Do NOT insert into messages here to prevent duplicate bubbles.
        if (activeId && data.conversationId === activeId) {
          return;
        }

        // Notification sound for incoming messages in other conversations
        playNotificationSound();

        // Refresh conversations list to update previews and unread badges
        refreshConversationsList();

        // Refresh navbar unread badge
        window.dispatchEvent(new CustomEvent('gampus:refresh-unread'));
        window.dispatchEvent(new CustomEvent('unilive:refresh-unread'));
      }
    };

    // 1. Pusher Channels (WebSocket) for user-level notifications
    const pusher = getPusherClient();
    let pusherUserChannel: any = null;
    if (pusher) {
      pusherUserChannel = pusher.subscribe(`user-${currentUser.id}`);
      pusherUserChannel.bind('new-notification', (data: any) => {
        handleOtherMessage(data);
      });
    }

    // 2. Server-Sent Events fallback
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');
      eventSource.addEventListener('user-event', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleOtherMessage(data);
        } catch {
          // ignore
        }
      });
      eventSource.onerror = () => {
        // Auto reconnect
      };
    } catch {
      // ignore
    }

    return () => {
      if (pusher && pusherUserChannel) {
        pusherUserChannel.unbind_all();
        pusherUserChannel.unsubscribe();
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [currentUser?.id, activeId]);

  // Active conversation SSE stream (for 0ms instant push of newly sent messages)
  useEffect(() => {
    if (!activeId) return;

    let eventSource: EventSource | null = null;
    let pusherChannel: any = null;
    const pusher = getPusherClient();

    const handleIncomingMessage = (data: any) => {
      if (!data || !data.id) return;

      setMessages((prev) => {
        // Strict deduplication check
        if (prev.some((m) => m.id === data.id)) return prev;
        if (data.senderId !== currentUser?.id) {
          playNotificationSound();
          // Current user is viewing this conversation; mark as read immediately on server
          fetch(`/api/messages/conversations/${activeId}`, { method: 'PATCH' }).then(() => {
            window.dispatchEvent(new CustomEvent('gampus:refresh-unread'));
            window.dispatchEvent(new CustomEvent('unilive:refresh-unread'));
          });
        }
        return [...prev, data];
      });

      // Update sidebar conversation preview and ensure unread count stays 0 for active conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, lastMessageText: data.text, lastMessageAt: data.createdAt, unreadCount: 0 }
            : c
        )
      );

      // Refresh navbar unread badge immediately
      window.dispatchEvent(new CustomEvent('gampus:refresh-unread'));
      window.dispatchEvent(new CustomEvent('unilive:refresh-unread'));
    };

    try {
      eventSource = new EventSource(`/api/messages/stream?conversationId=${activeId}`);
      eventSource.addEventListener('new-message', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          handleIncomingMessage(parsed);
        } catch {
          // ignore
        }
      });
      eventSource.onerror = () => {
        // Auto reconnect
      };
    } catch (e) {
      console.warn('SSE stream failed', e);
    }

    if (pusher) {
      pusherChannel = pusher.subscribe(`conversation-${activeId}`);
      pusherChannel.bind('new-message', (data: any) => {
        handleIncomingMessage(data);
      });
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (pusher && pusherChannel) {
        pusherChannel.unbind_all();
        pusherChannel.unsubscribe();
      }
    };
  }, [activeId, currentUser?.id]);

  const fetchConversationData = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveConvMeta(data.conversation);

        // Reset unread count locally for this conversation
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );

        // Notify Navbar to update message badge
        window.dispatchEvent(new CustomEvent('gampus:refresh-unread'));
        window.dispatchEvent(new CustomEvent('unilive:refresh-unread'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (convId: string) => {
    setActiveId(convId);
    // Optimistically reset unreadCount for selected conversation
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/messages?id=${convId}`);
    }
  };

  const handleBackToList = () => {
    setActiveId(null);
    setActiveConvMeta(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/messages');
    }
  };

  const refreshConversationsList = async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      if (res.ok) {
        const data = await res.json();
        // If an active conversation is open, ensure its unread count remains 0
        const updated = (data.conversations || []).map((c: any) =>
          c.id === activeId ? { ...c, unreadCount: 0 } : c
        );
        setConversations(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeId || sending || isSendingRef.current) return;

    isSendingRef.current = true;
    setSending(true);
    setModerationError(null);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeId,
          text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModerationError(data.error || 'Mesaj gönderilemedi.');
        return;
      }

      setMessages((prev) => {
        if (!data.message || prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      setInputText('');

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, lastMessageText: text, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      setModerationError('Bağlantı hatası oluştu.');
    } finally {
      setSending(false);
      isSendingRef.current = false;
    }
  };

  const handleToggleBlock = async () => {
    if (!activeConvMeta?.otherUser?.id) return;
    const isCurrentlyBlocked = activeConvMeta.blockStatus?.blockedByMe;
    setBlockLoading(true);

    try {
      if (isCurrentlyBlocked) {
        const res = await fetch('/api/messages/block', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockedId: activeConvMeta.otherUser.id }),
        });
        if (res.ok) {
          setActiveConvMeta((prev: any) => ({
            ...prev,
            blockStatus: { isBlocked: false, blockedByMe: false, blockedByUser: false },
          }));
        }
      } else {
        if (!confirm(`${activeConvMeta.otherUser.name} kullanıcısını engellemek istediğinize emin misiniz?`)) {
          setBlockLoading(false);
          return;
        }
        const res = await fetch('/api/messages/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockedId: activeConvMeta.otherUser.id }),
        });
        if (res.ok) {
          setActiveConvMeta((prev: any) => ({
            ...prev,
            blockStatus: { isBlocked: true, blockedByMe: true, blockedByUser: false },
          }));
        }
      }
      setMenuOpen(false);
      refreshConversationsList();
    } catch (e) {
      alert('İşlem başarısız oldu.');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    setSubmittingReport(true);

    try {
      const res = await fetch('/api/messages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeId,
          reason: reportReason,
          description: reportDescription.trim() || undefined,
        }),
      });

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportModalOpen(false);
          setReportSuccess(false);
          setReportDescription('');
        }, 1800);
      } else {
        alert('Rapor iletilemedi.');
      }
    } catch (e) {
      alert('Bir hata oluştu.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const otherName = c.otherUser?.name?.toLowerCase() || '';
    const title = c.listing?.title?.toLowerCase() || '';
    return otherName.includes(q) || title.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto p-0 md:px-6 md:py-6">
      <div className="bg-white md:rounded-3xl border-0 md:border md:border-slate-200 md:shadow-sm overflow-hidden h-[calc(100dvh-64px-65px)] md:h-[calc(100vh-140px)] md:min-h-[550px] flex relative">
        
        {/* LEFT PANE: CONVERSATIONS LIST */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 ${
            activeId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                Mesajlar
              </h2>
              <span className="text-xs bg-slate-100 font-bold text-slate-600 px-2.5 py-1 rounded-full">
                {conversations.length} Sohbet
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Kişi veya ilan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <div className="text-3xl">💬</div>
                <p className="text-xs">
                  {searchQuery ? 'Aramanıza uygun sohbet bulunamadı.' : 'Henüz aktif bir mesajlaşmanız yok.'}
                </p>
                <Link
                  href="/explore"
                  className="inline-block text-xs font-bold text-teal-600 hover:underline"
                >
                  İlanları inceleyip mesaj atın →
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeId;
                const listingImg = conv.listing?.images?.[0]?.url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200';

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/70 border-l-4 border-teal-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Listing Thumbnail */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img src={listingImg} alt="" className="w-full h-full object-cover" />
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-teal-600 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-xs z-10">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                          {conv.otherUser?.name || 'Kullanıcı'}
                          {conv.otherUser?.studentVerified && (
                            <span title="Öğrenci Doğrulandı" className="text-[10px]">🟢</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleDateString('tr-TR', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-teal-800 truncate mt-0.5">
                        {conv.listing?.title}
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`text-[11px] truncate flex-1 ${conv.unreadCount > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                          {conv.isBlocked ? (
                            <span className="text-rose-500 font-semibold">[Engellendi]</span>
                          ) : (
                            conv.lastMessageText || 'Sohbet başladı...'
                          )}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: ACTIVE CONVERSATION */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/50 ${
            activeId
              ? 'fixed inset-0 z-50 md:static md:z-auto h-[100dvh] md:h-full bg-white md:bg-slate-50/50'
              : 'hidden md:flex h-full'
          }`}
        >
          {activeId ? (
            activeConvMeta ? (
              <>
                {/* Native Mobile / Desktop Chat Header */}
                <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <button
                      onClick={handleBackToList}
                      className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 md:hidden cursor-pointer"
                      title="Sohbetlere Dön"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 shadow-xs">
                      {activeConvMeta.otherUser?.name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5">
                        <span>{activeConvMeta.otherUser?.name}</span>
                        {activeConvMeta.otherUser?.studentVerified && (
                          <span className="text-[9px] sm:text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                            Öğrenci
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                        {activeConvMeta.blockStatus?.isBlocked ? (
                          <span className="text-rose-600 font-bold">Engellendi</span>
                        ) : (
                          activeConvMeta.listing?.title || 'Gampüs Güvenli Sohbet'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right controls: Listing preview link & 3-dots actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {activeConvMeta.listing && (
                      <Link
                        href={`/listings/${activeConvMeta.listingId}`}
                        target="_blank"
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                        title="İlanı Görüntüle"
                      >
                        <span className="hidden sm:inline truncate max-w-[140px]">{activeConvMeta.listing.title}</span>
                        <span className="font-bold text-teal-700">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(
                            activeConvMeta.listing.price
                          )}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    )}

                    {/* 3-dots Menu */}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-30 text-xs">
                          <button
                            onClick={handleToggleBlock}
                            disabled={blockLoading}
                            className="w-full px-4 py-2 text-left flex items-center gap-2 text-slate-700 hover:bg-slate-50 font-semibold"
                          >
                            <Ban className="w-4 h-4 text-slate-500" />
                            {activeConvMeta.blockStatus?.blockedByMe ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setReportModalOpen(true);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-semibold"
                          >
                            <Flag className="w-4 h-4 text-rose-500" />
                            Şikayet Et / Raporla
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECURITY WARNING BANNER */}
                <div className="bg-amber-50/90 border-b border-amber-200/60 px-3 sm:px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-800 shrink-0">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Güvenlik Uyarısı:</strong> Kapora, IBAN veya platform dışı ödeme taleplerine itibar etmeyiniz.
                    </span>
                  </div>
                </div>

                {/* MESSAGES BODY */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  {loadingMessages ? (
                    <div className="text-center py-12 text-xs text-slate-400">Mesajlar yükleniyor...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800">Sohbet Başladı!</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto px-4">
                        {activeConvMeta.listing?.title} ilanı hakkında satıcıya soru sorabilir veya aşağıdaki hazır yanıtlardan birini seçebilirsiniz.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === currentUser.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-md px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-teal-600 text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                            <div
                              className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                                isMe ? 'text-teal-100' : 'text-slate-400'
                              }`}
                            >
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString('tr-TR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && (
                                <span>
                                  {m.isRead ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-teal-200 inline" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-teal-200 inline" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* MODERATION / ABUSE REJECTION BANNER */}
                {moderationError && (
                  <div className="mx-3 sm:mx-4 mb-2 bg-rose-50 border-2 border-rose-300 text-rose-800 px-4 py-2.5 rounded-2xl text-xs flex items-start gap-2 shadow-sm animate-shake shrink-0">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold block text-rose-900">Güvenlik Engeli</span>
                      <span>{moderationError}</span>
                    </div>
                    <button
                      onClick={() => setModerationError(null)}
                      className="text-rose-400 hover:text-rose-700 font-bold ml-2 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* QUICK REPLIES BAR */}
                {!activeConvMeta.blockStatus?.isBlocked && (
                  <div className="px-3 sm:px-4 py-1.5 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-white/70 backdrop-blur-xs">
                    {QUICK_REPLIES.map((quick, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(quick)}
                        disabled={sending}
                        className="whitespace-nowrap px-3 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 border border-slate-200 text-slate-600 rounded-full text-xs font-medium transition cursor-pointer shrink-0"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                )}

                {/* FOOTER / INPUT BAR OR BLOCKED BANNER */}
                <div className="bg-white border-t border-slate-200 p-2.5 sm:p-4 shrink-0 pb-safe pb-3">
                  {activeConvMeta.blockStatus?.isBlocked ? (
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-xs">
                        <Lock className="w-4 h-4 text-slate-500" />
                        {activeConvMeta.blockStatus?.blockedByMe
                          ? 'Bu kullanıcıyı engellediniz.'
                          : 'Bu kullanıcı tarafından engellendiniz.'}
                      </div>
                      {activeConvMeta.blockStatus?.blockedByMe && (
                        <button
                          onClick={handleToggleBlock}
                          disabled={blockLoading}
                          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          Engeli Kaldır
                        </button>
                      )}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Mesajınızı yazınız..."
                        value={inputText}
                        maxLength={1000}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          if (moderationError) setModerationError(null);
                        }}
                        className="flex-1 bg-slate-100 border-0 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
                      />
                      <button
                        type="submit"
                        disabled={sending || !inputText.trim()}
                        className="w-11 h-11 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition shadow-xs cursor-pointer shrink-0"
                        title="Gönder"
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              /* Loading State with guaranteed interactive back button */
              <div className="flex-1 flex flex-col h-full bg-white">
                <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleBackToList}
                    className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 md:hidden cursor-pointer"
                    title="Geri"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                  <div className="space-y-1">
                    <div className="w-28 h-3.5 bg-slate-200 rounded-md animate-pulse" />
                    <div className="w-16 h-2.5 bg-slate-100 rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">Sohbet yükleniyor...</span>
                </div>
              </div>
            )
          ) : (
            /* Desktop Empty State (NEVER rendered on mobile screen!) */
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl">
                💬
              </div>
              <h3 className="font-bold text-slate-700 text-base">Sohbet Seçin</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Sol menüden bir konuşma seçerek mesajlaşmaya başlayabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* REPORT CONVERSATION MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 text-rose-600">
                <Flag className="w-5 h-5" />
                Sohbeti Şikayet Et
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="bg-teal-50 border border-teal-200 text-teal-800 p-4 rounded-2xl text-xs font-semibold text-center">
                ✓ Şikayetiniz yöneticilere iletildi. İnceleme başlatılmıştır.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Şikayet Nedeni</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="DOLANDIRICILIK">Dolandırıcılık / Kapora Talebi</option>
                    <option value="HAKARET">Hakaret / Taciz / Uygunsuz Dil</option>
                    <option value="SPAM">Spam / İlgisiz Reklam</option>
                    <option value="PLATFORM_DISI">Platform Dışı İletişim / Güvensiz Talep</option>
                    <option value="DIGER">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Açıklama (Opsiyonel)</label>
                  <textarea
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Durumu kısaca açıklayınız..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50"
                  >
                    {submittingReport ? 'İletiliyor...' : 'Şikayet Et'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
