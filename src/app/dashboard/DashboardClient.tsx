'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  List,
  Heart,
  MessageSquare,
  PlusCircle,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Edit3
} from 'lucide-react';
import ListingGrid from '@/components/listing/ListingGrid';

interface DashboardClientProps {
  user: any;
  initialTab?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  HOUSE: 'Kiralık Ev',
  ROOM: 'Kiralık Oda',
  ROOMMATE: 'Ev Arkadaşı',
  FURNITURE: '2. El Eşya',
  HOUSE_PACKAGE: 'Ev Paketi',
};

export default function DashboardClient({ user, initialTab }: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'listings' | 'favorites' | 'leads'>(
    initialTab === 'favorites' || initialTab === 'leads' ? initialTab : 'listings'
  );
  const [listings, setListings] = useState(user.listings || []);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab === 'favorites' || initialTab === 'leads' || initialTab === 'listings') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const switchTab = (tab: 'listings' | 'favorites' | 'leads') => {
    setActiveTab(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  };

  const handleStatusChange = async (listingId: string, status: string) => {
    setUpdatingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setListings((prev: any[]) =>
          prev.map((l) => (l.id === listingId ? { ...l, status } : l))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('İlanı silmek istediğinize emin misiniz?')) return;
    setUpdatingId(listingId);

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setListings((prev: any[]) => prev.filter((l) => l.id !== listingId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Kullanıcı Paneli</h1>
          <p className="text-xs text-slate-500 mt-1">
            Yayınladığınız ilanları yönetin, durumlarını değiştirin ve favorilerinizi takip edin.
          </p>
        </div>

        <Link
          href="/create-listing"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Yeni İlan Oluştur
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => switchTab('listings')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'listings'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <List className="w-4 h-4" />
          İlanlarım ({listings.length})
        </button>

        <button
          onClick={() => switchTab('favorites')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'favorites'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          Favorilerim ({user.favorites.length})
        </button>

        <button
          onClick={() => switchTab('leads')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'leads'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          İletişim Talepleri
        </button>
      </div>

      {/* TAB 1: LISTINGS MANAGEMENT */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {listings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">Henüz İlanınız Yok</h3>
              <p className="text-xs text-slate-500">
                Evini, odanı veya satmak istediğin eşyalarını saniyeler içinde yayına alabilirsin.
              </p>
              <Link
                href="/create-listing"
                className="inline-block bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
              >
                İlk İlanını Ver
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      <img
                        src={item.images && item.images.length > 0 ? item.images[0].url : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-500 text-white'
                              : item.status === 'RENTED'
                              ? 'bg-purple-600 text-white'
                              : item.status === 'SOLD'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-400 text-white'
                          }`}
                        >
                          {item.status === 'ACTIVE' ? 'Aktif' : item.status === 'RENTED' ? 'Kiralandı' : item.status === 'SOLD' ? 'Satıldı' : 'Pasif'}
                        </span>
                      </div>
                      <Link href={`/listings/${item.id}`} className="font-bold text-slate-900 hover:text-emerald-600 text-sm mt-1 block">
                        {item.title}
                      </Link>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(item.price)}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Switcher */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden"
                    >
                      <option value="ACTIVE">Aktif Yap</option>
                      <option value="RENTED">Kiralandı Olarak İşaretle</option>
                      <option value="SOLD">Satıldı Olarak İşaretle</option>
                      <option value="PASSIVE">Pasife Al</option>
                    </select>

                    <Link
                      href={`/listings/${item.id}/edit`}
                      className="p-2 text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="İlanı Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/listings/${item.id}`}
                      className="p-2 text-slate-600 hover:text-emerald-600 bg-slate-100 rounded-xl transition-colors"
                      title="İlanı Görüntüle"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      disabled={updatingId === item.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="İlanı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FAVORITES */}
      {activeTab === 'favorites' && (
        <div>
          {user.favorites.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <h3 className="font-bold text-slate-900">Henüz Favoriniz Yok</h3>
              <p className="text-xs text-slate-500">
                Beğendiğiniz ilanları favorilere ekleyerek takip edebilirsiniz.
              </p>
              <Link href="/explore" className="inline-block bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs">
                İlanları Keşfet
              </Link>
            </div>
          ) : (
            <ListingGrid listings={user.favorites.map((f: any) => f.listing)} />
          )}
        </div>
      )}

      {/* TAB 3: LEADS STATS */}
      {activeTab === 'leads' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Gelen İletişim İstatistikleri</h3>
            <p className="text-xs text-slate-500 mt-1">
              İlanlarınıza tıklayan öğrencilerin Mesaj ve Telefon iletişim etkileşimleri
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {listings.map((item: any) => (
              <div key={item.id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                  <div className="text-xs text-slate-400">
                    Kategori: {CATEGORY_LABELS[item.category] || item.category} • İlçe: {item.district}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-bold">
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200">
                    💬 {item._count?.contacts || 0} İletişim Tıklaması
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
