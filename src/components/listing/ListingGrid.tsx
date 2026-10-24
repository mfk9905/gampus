'use client';

import ListingCard, { ListingCardProps } from './ListingCard';
import { PackageX, Bell } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface ListingGridProps {
  listings: any[];
  loading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
}

export default function ListingGrid({
  listings,
  loading = false,
  emptyTitle = 'İlan Bulunamadı',
  emptySubtitle = 'Aradığınız kriterlere uygun ilan bulunamadı.',
  onFavoriteToggle,
}: ListingGridProps) {
  const searchParams = useSearchParams();
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveCurrentSearch = async () => {
    setSaveLoading(true);
    setSaveMsg('');

    const category = searchParams.get('category') || null;
    const universityId = searchParams.get('universityId') || null;
    const district = searchParams.get('district') || null;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
    const condition = searchParams.get('condition') || null;
    const search = searchParams.get('search') || null;

    const nameParts = [];
    if (category) nameParts.push(category);
    if (district) nameParts.push(district);
    if (search) nameParts.push(`"${search}"`);
    const name = nameParts.length > 0 ? nameParts.join(' - ') : 'Özel Kampüs Araması';

    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          universityId,
          district,
          minPrice,
          maxPrice,
          condition,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          alert('Aramayı kaydetmek için lütfen giriş yapınız.');
        } else {
          setSaveMsg(data.error || 'Arama kaydedilemedi.');
        }
      } else {
        setSaveMsg('🔔 Arama başarıyla kaydedildi! Yeni ilan gelince haber vereceğiz.');
      }
    } catch (e) {
      setSaveMsg('Bağlantı hatası.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
            <div className="aspect-[4/3] bg-slate-200 rounded-xl"></div>
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs my-8 space-y-4">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
          <PackageX className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">{emptyTitle}</h3>
        <p className="text-slate-500 text-xs leading-relaxed">{emptySubtitle}</p>

        {saveMsg ? (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 p-3 rounded-2xl text-xs font-bold">
            {saveMsg}
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={handleSaveCurrentSearch}
              disabled={saveLoading}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 mx-auto"
            >
              <Bell className="w-4 h-4" />
              {saveLoading ? 'Kaydediliyor...' : '🔔 Bu Aramayı Kaydet (Yeni İlan Alarmı)'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {listings.map((item) => (
        <ListingCard key={item.id} listing={item} onFavoriteToggle={onFavoriteToggle} />
      ))}
    </div>
  );
}

