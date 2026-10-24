'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, MapPin, Search, Check, ChevronDown } from 'lucide-react';

interface University {
  id: string;
  name: string;
  shortName: string;
  district: string;
  _count?: { listings: number };
}

interface CampusSelectorProps {
  selectedUniversityId?: string;
  onSelectUniversity?: (uniId: string, uniName?: string) => void;
  className?: string;
}

export default function CampusSelector({
  selectedUniversityId = '',
  onSelectUniversity,
  className = '',
}: CampusSelectorProps) {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const fetchUniversities = async () => {
    try {
      const res = await fetch('/api/universities');
      const data = await res.json();
      if (data.universities) {
        setUniversities(data.universities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedUni = universities.find((u) => u.id === selectedUniversityId);

  const handleSelection = (uniId: string, uniShort?: string) => {
    if (onSelectUniversity) {
      onSelectUniversity(uniId, uniShort);
    } else {
      // Default navigation for homepage & server components
      if (uniId) {
        router.push(`/?uniId=${uniId}`);
      } else {
        router.push('/');
      }
    }
    setIsOpen(false);
  };

  const filteredUniversities = universities.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.shortName.toLowerCase().includes(search.toLowerCase()) ||
      u.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-3.5 flex items-center justify-between text-left shadow-xs transition-all focus:ring-2 focus:ring-emerald-500/20"
      >
        <div className="flex items-center space-x-3 truncate">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Kampüsünü Seç
            </div>
            <div className="font-semibold text-slate-800 text-sm truncate">
              {selectedUni ? `${selectedUni.name} (${selectedUni.shortName})` : 'Tüm Üniversiteler / Kampüsler'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Üniversite veya ilçe ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-hidden text-slate-800 placeholder-slate-400"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => handleSelection('', 'Tüm Kampüsler')}
              className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                !selectedUniversityId ? 'bg-emerald-50/70 font-semibold text-emerald-800' : 'text-slate-700'
              }`}
            >
              <span>Tüm Üniversite ve Kampüsler</span>
              {!selectedUniversityId && <Check className="w-4 h-4 text-emerald-600" />}
            </button>

            {filteredUniversities.map((uni) => (
              <button
                key={uni.id}
                type="button"
                onClick={() => handleSelection(uni.id, uni.shortName)}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  selectedUniversityId === uni.id ? 'bg-emerald-50/70 font-semibold text-emerald-800' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold">{uni.name} ({uni.shortName})</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {uni.district}, İstanbul
                  </div>
                </div>
                {selectedUniversityId === uni.id && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            ))}

            {filteredUniversities.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">Sonuç bulunamadı</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
