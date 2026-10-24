'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Compass,
  PlusCircle,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Bell,
  MessageSquare,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { playNotificationSound } from '@/lib/audio/sound';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification Center State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  // Real-time notifications and message badges via Server-Sent Events (SSE)
  useEffect(() => {
    if (!currentUser) return;

    fetchNotifications();
    fetchUnreadMessages();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');
      eventSource.addEventListener('user-event', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'MESSAGE') {
            fetchUnreadMessages();
            // If user is not on messages page, play chime
            if (!pathname.startsWith('/messages')) {
              playNotificationSound();
            }
          } else {
            fetchNotifications();
            playNotificationSound();
          }
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
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [currentUser, pathname]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchNotifications();
      fetchUnreadMessages();
    };
    window.addEventListener('gampus:refresh-unread', handleRefresh);
    window.addEventListener('unilive:refresh-unread', handleRefresh);
    return () => {
      window.removeEventListener('gampus:refresh-unread', handleRefresh);
      window.removeEventListener('unilive:refresh-unread', handleRefresh);
    };
  }, []);

  const handleNotificationClick = async (notif: any) => {
    setNotifOpen(false);
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await fetch(`/api/notifications?id=${notif.id}`, { method: 'PATCH' });
      } catch (err) {
        // silent
      }
    }
  };

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const res = await fetch('/api/messages/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.unreadCount || 0);
      }
    } catch (e) {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/');
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-xl shadow-sm tracking-tighter">
                G
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1">
                  GAMPÜS
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium -mt-1 tracking-wide uppercase">
                  Kampüs Pazaryeri
                </span>
              </div>
            </Link>

            {/* Desktop Links */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
              <Link
                href="/explore"
                className={`transition-colors hover:text-teal-600 ${
                  isActive('/explore') ? 'text-teal-600 font-semibold' : ''
                }`}
              >
                Keşfet
              </Link>
              <Link
                href="/explore?category=HOUSE"
                className={`transition-colors hover:text-teal-600 ${
                  pathname.includes('category=HOUSE') ? 'text-teal-600 font-semibold' : ''
                }`}
              >
                Kiralık Ev
              </Link>
              <Link
                href="/explore?category=ROOMMATE"
                className={`transition-colors hover:text-teal-600 ${
                  pathname.includes('category=ROOMMATE') ? 'text-teal-600 font-semibold' : ''
                }`}
              >
                Ev Arkadaşı
              </Link>
              <Link
                href="/explore?category=FURNITURE"
                className={`transition-colors hover:text-teal-600 ${
                  pathname.includes('category=FURNITURE') ? 'text-teal-600 font-semibold' : ''
                }`}
              >
                2. El Eşya
              </Link>
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href={currentUser ? '/create-listing' : '/login?redirect=/create-listing'}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-sm font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                İlan Ver
              </Link>

              {currentUser ? (
                <div className="flex items-center space-x-2">
                  {/* NOTIFICATION CENTER DROPDOWN */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition relative"
                      title="Bildirimler"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <Bell className="w-4 h-4 text-teal-600" />
                            Bildirimler
                          </h4>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs text-teal-600 hover:underline font-semibold"
                            >
                              Tümünü Okundu İşaretle
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">
                              Henüz bildiriminiz yok.
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <Link
                                key={n.id}
                                href={n.link || '/profile'}
                                onClick={() => handleNotificationClick(n)}
                                className={`block px-4 py-3 hover:bg-slate-50 transition ${
                                  !n.isRead ? 'bg-teal-50/50 font-medium' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900">{n.title}</span>
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                    {new Date(n.createdAt).toLocaleDateString('tr-TR')}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MESSAGES BUTTON */}
                  <Link
                    href="/messages"
                    className={`p-2 rounded-xl transition relative ${
                      isActive('/messages')
                        ? 'text-teal-600 bg-teal-50'
                        : 'text-slate-600 hover:text-teal-600 hover:bg-slate-100'
                    }`}
                    title="Mesajlar"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/dashboard?tab=favorites"
                    className="p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition"
                    title="Favorilerim"
                  >
                    <Heart className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  </Link>

                  {currentUser.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Admin
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="text-slate-700 hover:text-teal-600 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-slate-100 transition"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/register"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-semibold rounded-xl transition shadow-xs"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Header Toggle */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link
                href={currentUser ? '/create-listing' : '/login?redirect=/create-listing'}
                className="bg-teal-600 text-white p-2 rounded-lg font-medium text-xs flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" />
                İlan
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 rounded-lg hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm"
            >
              <Compass className="w-4 h-4 text-teal-600" />
              Tüm İlanlar
            </Link>
            <Link
              href="/explore?category=HOUSE"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm"
            >
              🏠 Kiralık Ev
            </Link>
            <Link
              href="/explore?category=ROOMMATE"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm"
            >
              👥 Ev Arkadaşı
            </Link>
            <Link
              href="/explore?category=FURNITURE"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm"
            >
              🛋️ 2. El Eşya
            </Link>

            <div className="border-t border-slate-100 pt-3">
              {currentUser ? (
                <div className="space-y-2 text-sm">
                  <div className="px-3 py-1 font-semibold text-slate-900 flex items-center justify-between">
                    <span>{currentUser.name}</span>
                    {currentUser.studentVerified && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Öğrenci
                      </span>
                    )}
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
                  >
                    Profilim & Kaydedilen Aramalar
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-teal-600" />
                      <span>Mesajlarım</span>
                    </div>
                    {unreadMessages > 0 && (
                      <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadMessages}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
                  >
                    İlanlarım & Favorilerim
                  </Link>
                  {currentUser.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-amber-800 bg-amber-50 font-bold"
                    >
                      Admin Paneli
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 font-medium rounded-lg hover:bg-rose-50"
                  >
                    Çıkış Yap
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 bg-slate-100 text-slate-800 rounded-xl font-semibold text-sm"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 bg-teal-600 text-white rounded-xl font-semibold text-sm shadow-xs"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile App Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-1.5 px-3 shadow-lg">
        <div className="grid grid-cols-5 gap-1 text-center">
          <Link
            href="/"
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              pathname === '/' ? 'text-teal-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Ana Sayfa</span>
          </Link>

          <Link
            href="/explore"
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              pathname === '/explore' ? 'text-teal-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Keşfet</span>
          </Link>

          <Link
            href={currentUser ? '/create-listing' : '/login?redirect=/create-listing'}
            className="flex flex-col items-center justify-center -mt-4"
          >
            <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold text-teal-700 mt-0.5">İlan Ver</span>
          </Link>

          <Link
            href={currentUser ? '/messages' : '/login'}
            className={`flex flex-col items-center py-1 rounded-xl transition relative ${
              pathname === '/messages' ? 'text-teal-600 font-bold' : 'text-slate-500'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadMessages > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 bg-teal-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
            <span className="text-[10px] mt-0.5">Mesajlar</span>
          </Link>

          <Link
            href={currentUser ? '/profile' : '/login'}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              pathname === '/profile' || pathname === '/login' ? 'text-teal-600 font-bold' : 'text-slate-500'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{currentUser ? 'Profil' : 'Giriş'}</span>
          </Link>
        </div>
      </div>
    </>
  );
}

