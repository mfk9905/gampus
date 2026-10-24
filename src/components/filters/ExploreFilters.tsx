'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, RotateCcw, Search, Check } from 'lucide-react';

interface University {
  id: string;
  name: string;
  shortName: string;
}

interface ExploreFiltersProps {
  universities: University[];
  className?: string;
  onFilterChange?: () => void;
}

export default function ExploreFilters({ universities, className = '', onFilterChange }: ExploreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [universityId, setUniversityId] = useState(searchParams.get('universityId') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (universityId) params.set('universityId', universityId);
    if (district) params.set('district', district);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (condition) params.set('condition', condition);
    if (sortBy) params.set('sortBy', sortBy);
    if (search) params.set('search', search);

    router.push(`/explore?${params.toString()}`);
    if (onFilterChange) onFilterChange();
  };

  const resetFilters = () => {
    setCategory('');
    setUniversityId('');
    setDistrict('');
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setSortBy('newest');
    setSearch('');
    router.push('/explore');
    if (onFilterChange) onFilterChange();
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base">
          <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
          <span>Filtreler</span>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Sıfırla
        </button>
      </div>

      {/* Arama Metni */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Kelime Ara
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Başlık veya açıklama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Kategori */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Kategori
        </label>
        <div className="space-y-1.5">
          {[
            { value: '', label: 'Tümü' },
            { value: 'HOUSE', label: '🏠 Kiralık Ev' },
            { value: 'ROOMMATE', label: '👥 Ev Arkadaşı' },
            { value: 'ROOM', label: '🛏️ Kiralık Oda' },
            { value: 'FURNITURE', label: '🛋️ İkinci El Eşya' },
            { value: 'HOUSE_PACKAGE', label: '📦 Ev Eşyası Paketi' },
          ].map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                category === cat.value
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              {category === cat.value && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Sıralama */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Sıralama
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
        >
          <option value="newest">En Yeni İlanlar</option>
          <option value="price_asc">En Ucuz Fiyat</option>
          <option value="price_desc">En Pahalı Fiyat</option>
          <option value="distance">Kampüse En Yakın</option>
        </select>
      </div>

      {/* Üniversite / Kampüs */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Üniversite
        </label>
        <select
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
        >
          <option value="">Tüm Üniversiteler</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.shortName})
            </option>
          ))}
        </select>
      </div>

      {/* İlçe */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          İlçe
        </label>
        <input
          type="text"
          placeholder="Örn: Kadıköy, Maslak..."
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
        />
      </div>

      {/* Fiyat Aralığı */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Fiyat Aralığı (₺)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min ₺"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
          />
          <input
            type="number"
            placeholder="Maks ₺"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Durum */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Eşya Durumu
        </label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
        >
          <option value="">Fark Etmez</option>
          <option value="NEW">Sıfır</option>
          <option value="GOOD">Çok İyi</option>
          <option value="USED">İkinci El</option>
        </select>
      </div>

      <button
        onClick={applyFilters}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs shadow-md shadow-emerald-600/30 transition-all active:scale-95"
      >
        Filtreleri Uygula
      </button>
    </div>
  );
}
