'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, GraduationCap, ShieldCheck, Sparkles, Navigation } from 'lucide-react';
import { formatDistance } from '@/lib/utils/distance';

export interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    category: string;
    district: string;
    locationText: string;
    status: string;
    condition?: string | null;
    featured?: boolean;
    distanceKm?: number | null;
    isFavorited?: boolean;
    university?: {
      name: string;
      shortName: string;
    } | null;
    user?: {
      name: string;
      studentVerified?: boolean;
      phoneVerified?: boolean;
    } | null;
    images?: Array<{ url: string }>;
  };
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  HOUSE: { label: 'Ev', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  ROOM: { label: 'Oda', bg: 'bg-blue-100', text: 'text-blue-800' },
  ROOMMATE: { label: 'Ev Arkadaşı', bg: 'bg-purple-100', text: 'text-purple-800' },
  FURNITURE: { label: 'Eşya', bg: 'bg-amber-100', text: 'text-amber-800' },
  HOUSE_PACKAGE: { label: 'Ev Paketi', bg: 'bg-teal-100', text: 'text-teal-800' },
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Sıfır',
  GOOD: 'Çok İyi',
  USED: 'İkinci El',
};

export default function ListingCard({ listing, onFavoriteToggle }: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(listing.isFavorited || false);
  const [loadingFav, setLoadingFav] = useState(false);

  const mainImage = listing.images && listing.images.length > 0
    ? listing.images[0].url
    : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80';

  const categoryMeta = CATEGORY_LABELS[listing.category] || { label: listing.category, bg: 'bg-slate-100', text: 'text-slate-800' };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingFav) return;

    setLoadingFav(true);
    const prev = isFavorited;
    setIsFavorited(!prev); // Optimistic UI

    try {
      const res = await fetch(`/api/listings/${listing.id}/favorite`, { method: 'POST' });
      if (!res.ok) {
        setIsFavorited(prev); // Revert on failure
        if (res.status === 401) {
          alert('Favorilere eklemek için lütfen önce giriş yapınız.');
        }
      } else {
        const data = await res.json();
        setIsFavorited(data.favorited);
        if (onFavoriteToggle) onFavoriteToggle(listing.id, data.favorited);
      }
    } catch (err) {
      setIsFavorited(prev);
    } finally {
      setLoadingFav(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(listing.price);

  const isRentable = listing.category === 'HOUSE' || listing.category === 'ROOM';

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs card-hover flex flex-col h-full relative">
      {/* Image Container */}
      <Link href={`/listings/${listing.id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 block">
        <img
          src={mainImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center z-10">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-md ${categoryMeta.bg} ${categoryMeta.text}`}>
            {categoryMeta.label}
          </span>
          {listing.featured && (
            <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-1 rounded-lg shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" />
              Öne Çıkan
            </span>
          )}
          {listing.condition && (
            <span className="text-[10px] font-semibold bg-slate-900/80 text-white px-2 py-0.5 rounded-lg backdrop-blur-md">
              {CONDITION_LABELS[listing.condition] || listing.condition}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isFavorited
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
              : 'bg-white/90 text-slate-600 hover:bg-white hover:text-rose-500 hover:scale-110 shadow-sm'
          }`}
          aria-label="Favorilere Ekle"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Status Overlay if not active */}
        {listing.status !== 'ACTIVE' && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-20">
            <span className="text-white font-extrabold text-sm uppercase tracking-wider bg-rose-600 px-4 py-1.5 rounded-xl shadow-lg">
              {listing.status === 'RENTED' ? 'Kiralandı' : listing.status === 'SOLD' ? 'Satıldı' : 'Pasif'}
            </span>
          </div>
        )}
      </Link>

      {/* Details Body */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Price */}
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formattedPrice}
              {isRentable && <span className="text-xs font-normal text-slate-500"> / ay</span>}
            </span>
            {listing.user?.studentVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Doğrulanmış
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/listings/${listing.id}`}>
            <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors mb-2.5">
              {listing.title}
            </h3>
          </Link>
        </div>

        {/* Footer Meta */}
        <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{listing.district}, İstanbul</span>
          </div>

          <div className="flex items-center justify-between">
            {listing.university ? (
              <div className="flex items-center gap-1.5 text-slate-600">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-semibold">{listing.university.shortName}</span>
              </div>
            ) : (
              <div></div>
            )}

            {listing.distanceKm !== undefined && listing.distanceKm !== null && (
              <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-md text-[11px]">
                <Navigation className="w-3 h-3 text-emerald-600" />
                <span>Kampüse {formatDistance(listing.distanceKm)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
