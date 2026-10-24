'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle,
  Image as ImageIcon,
  MapPin,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  Trash2,
  Upload,
  AlertCircle,
  Lock,
  LogIn
} from 'lucide-react';
import dynamic from 'next/dynamic';
import ListingCard from '@/components/listing/ListingCard';
import { ISTANBUL_DISTRICTS, getDistrictByName } from '@/config/locations';
import { calculateDistance } from '@/lib/utils/distance';

const LocationPickerMap = dynamic(() => import('@/components/location/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 sm:h-72 w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">
      Harita yükleniyor...
    </div>
  ),
});

interface University {
  id: string;
  name: string;
  shortName: string;
  district: string;
  latitude: number;
  longitude: number;
}

const SAMPLE_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
];

export default function CreateListingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);

  // Form State
  const [category, setCategory] = useState<'HOUSE' | 'ROOM' | 'ROOMMATE' | 'FURNITURE' | 'HOUSE_PACKAGE'>('HOUSE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [district, setDistrict] = useState('Kadıköy');
  const [neighborhood, setNeighborhood] = useState('Moda / Caferağa');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState(40.9841);
  const [longitude, setLongitude] = useState(29.0267);
  const [universityId, setUniversityId] = useState('');
  const [condition, setCondition] = useState<'NEW' | 'GOOD' | 'USED'>('GOOD');
  const [allowPhoneCalls, setAllowPhoneCalls] = useState(false);
  const [images, setImages] = useState<string[]>([SAMPLE_MOCK_IMAGES[0]]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleDistrictChange = (newDistrictName: string) => {
    setDistrict(newDistrictName);
    const found = getDistrictByName(newDistrictName);
    if (found) {
      if (found.neighborhoods.length > 0) {
        setNeighborhood(found.neighborhoods[0].name);
        setLatitude(found.neighborhoods[0].lat);
        setLongitude(found.neighborhoods[0].lng);
      } else {
        setNeighborhood('');
        setLatitude(found.defaultLat);
        setLongitude(found.defaultLng);
      }
    }
  };

  const handleNeighborhoodChange = (newNeighborhoodName: string) => {
    setNeighborhood(newNeighborhoodName);
    const foundDistrict = getDistrictByName(district);
    const foundNeigh = foundDistrict?.neighborhoods.find((n) => n.name === newNeighborhoodName);
    if (foundNeigh) {
      setLatitude(foundNeigh.lat);
      setLongitude(foundNeigh.lng);
    }
  };

  useEffect(() => {
    checkAuthAndFetchUniversities();
  }, []);

  const checkAuthAndFetchUniversities = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authData.user) {
        setCheckingAuth(false);
        return;
      }
      setCurrentUser(authData.user);

      const res = await fetch('/api/universities');
      const data = await res.json();
      if (data.universities) {
        setUniversities(data.universities);
        const defaultUni = authData.user.universityId
          ? data.universities.find((u: any) => u.id === authData.user.universityId) || data.universities[0]
          : data.universities[0];
        if (defaultUni) {
          setUniversityId(defaultUni.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const validateStep2 = () => {
    if (!title.trim() || title.trim().length < 5) {
      setError('İlan başlığı en az 5 karakter olmalıdır.');
      return false;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Lütfen geçerli ve 0\'dan büyük bir fiyat giriniz.');
      return false;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError(`İlan açıklaması en az 10 karakter olmalıdır (Şu an: ${description.trim().length} karakter).`);
      return false;
    }
    setError('');
    return true;
  };

  const canGoToStep = (targetStep: number) => {
    if (targetStep <= step) {
      setError('');
      setStep(targetStep);
      return;
    }
    if (targetStep >= 3 && !validateStep2()) {
      return;
    }
    if (targetStep >= 4 && (!district.trim() || !universityId)) {
      setError('Lütfen ilçe ve kampüs bilgilerini doldurunuz.');
      return;
    }
    setError('');
    setStep(targetStep);
  };

  const handleAddImage = () => {
    const url = customImageUrl.trim();
    if (!url) return;
    if (images.length >= 10) {
      setError('En fazla 10 fotoğraf yükleyebilirsiniz.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Lütfen geçerli bir resim linki (http:// veya https://) giriniz.');
      return;
    }
    setImages([...images, url]);
    setCustomImageUrl('');
    setError('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      setError("Dosya boyutu 5 MB'tan büyük olamaz.");
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Fotoğraf yüklenemedi.');
      } else if (data.url) {
        setImages((prev) => [...prev, data.url]);
      }
    } catch (err) {
      setError('Görsel yüklenirken bağlantı hatası oluştu.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const selectedUni = universities.find((u) => u.id === universityId);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const combinedLocationText = [neighborhood, locationText].filter(Boolean).join(' • ');

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          description,
          price: Number(price),
          district,
          locationText: combinedLocationText || district,
          universityId,
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          condition: category === 'FURNITURE' || category === 'HOUSE_PACKAGE' ? condition : undefined,
          images: images.length > 0 ? images : [SAMPLE_MOCK_IMAGES[0]],
          allowPhoneCalls,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'İlan oluşturulurken hata oluştu.');
      } else {
        router.push(`/listings/${data.listing.id}`);
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Kullanıcı oturumu kontrol ediliyor...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-amber-200">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">İlan Vermek İçin Giriş Yapın</h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            Öğrencilere güvenli bir pazar yeri sunabilmek ve platform güvenliğini sağlamak için ilan oluşturmadan önce hesabınıza giriş yapmanız gerekmektedir.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/login?redirect=/create-listing"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Giriş Yap
          </Link>
          <Link
            href="/register?redirect=/create-listing"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-2xl text-sm transition"
          >
            Hesabın yok mu? Öğrenci Kaydı Ol
          </Link>
        </div>
      </div>
    );
  }

  const STEP_TITLES = [
    '',
    'Kategori Seçimi',
    'İlan Detayları',
    'Konum & Kampüs',
    'Fotoğraf Ekleme',
    'Önizleme & Yayınla',
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 pb-28 sm:pb-12 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-1.5 sm:space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ücretsiz İlan Ver</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Öğrenci İlanı Oluştur
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
          Evini, odanı veya eşyalarını doğrulanmış üniversite öğrencileriyle güvenle paylaş.
        </p>
      </div>

      {/* Mobile Step Progress Indicator (sm:hidden) */}
      <div className="sm:hidden bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              {step}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {STEP_TITLES[step]}
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Adım {step} / 5
          </span>
        </div>
        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Step Indicators (hidden sm:flex) */}
      <div className="hidden sm:flex items-center justify-between border-b border-slate-200 pb-4 text-xs font-bold text-slate-400 max-w-xl mx-auto">
        <button
          onClick={() => canGoToStep(1)}
          className={`flex items-center gap-1.5 transition-colors ${step >= 1 ? 'text-emerald-600' : 'hover:text-slate-600'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-emerald-600 text-white' : step > 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>1</span>
          Kategori
        </button>
        <span className="text-slate-300">—</span>
        <button
          onClick={() => canGoToStep(2)}
          className={`flex items-center gap-1.5 transition-colors ${step >= 2 ? 'text-emerald-600' : 'hover:text-slate-600'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-emerald-600 text-white' : step > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>2</span>
          Detaylar
        </button>
        <span className="text-slate-300">—</span>
        <button
          onClick={() => canGoToStep(3)}
          className={`flex items-center gap-1.5 transition-colors ${step >= 3 ? 'text-emerald-600' : 'hover:text-slate-600'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-emerald-600 text-white' : step > 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>3</span>
          Konum
        </button>
        <span className="text-slate-300">—</span>
        <button
          onClick={() => canGoToStep(4)}
          className={`flex items-center gap-1.5 transition-colors ${step >= 4 ? 'text-emerald-600' : 'hover:text-slate-600'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-emerald-600 text-white' : step > 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>4</span>
          Fotoğraflar
        </button>
        <span className="text-slate-300">—</span>
        <button
          onClick={() => canGoToStep(5)}
          className={`flex items-center gap-1.5 transition-colors ${step >= 5 ? 'text-emerald-600' : 'hover:text-slate-600'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>5</span>
          Önizleme
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 sm:p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CATEGORY */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">1. Kategori Seçiniz</h2>
            <p className="text-xs text-slate-500 mt-0.5">Paylaşmak istediğiniz ilanın türünü belirleyin.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { id: 'HOUSE', title: '🏠 Kiralık Ev', desc: '1+1, 2+1 veya komple öğrenci dairesi' },
              { id: 'ROOMMATE', title: '👥 Ev Arkadaşı', desc: 'Mevcut evine oda veya ev arkadaşı arayanlar' },
              { id: 'ROOM', title: '🛏️ Kiralık Oda', desc: 'Evdeki tek kişilik kiralık öğrenci odası' },
              { id: 'FURNITURE', title: '🛋️ İkinci El Eşya', desc: 'Masa, koltuk, yatak, beyaz eşya vs.' },
              { id: 'HOUSE_PACKAGE', title: '📦 Komple Ev Eşyası Paketi', desc: 'Mezun olan öğrenciden toplu ev eşyası' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id as any)}
                className={`p-4 sm:p-5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                  category === item.id
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/80 active:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-1 leading-snug">{item.desc}</div>
                </div>
                {category === item.id && (
                  <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Seçildi
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/30 transition"
            >
              Devam Et
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DETAILS */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">2. İlan Detayları</h2>
            <p className="text-xs text-slate-500 mt-0.5">İlan başlığı, fiyatı ve açıklamasını doldurun.</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="listing-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  İlan Başlığı *
                </label>
                <span className={`text-[11px] ${title.trim().length >= 5 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  {title.trim().length >= 5 ? '✓ Geçerli' : 'En az 5 karakter'} ({title.trim().length}/120)
                </span>
              </div>
              <input
                id="listing-title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                maxLength={120}
                placeholder="Örn: Kadıköy Moda'da Marmara'ya 10 Dk 2+1 Öğrenci Evi"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="listing-price" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fiyat (₺) *
                </label>
                <input
                  id="listing-price"
                  name="price"
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Örn: 18500"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              {(category === 'FURNITURE' || category === 'HOUSE_PACKAGE') && (
                <div>
                  <label htmlFor="listing-condition" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Eşya Durumu
                  </label>
                  <select
                    id="listing-condition"
                    name="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  >
                    <option value="NEW">Sıfır / Hiç Kullanılmamış</option>
                    <option value="GOOD">Çok İyi</option>
                    <option value="USED">İkinci El</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="listing-description" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Açıklama *
                </label>
                <span className={`text-[11px] font-semibold ${description.trim().length >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {description.trim().length >= 10
                    ? `✓ Geçerli (${description.trim().length} krk)`
                    : `En az 10 karakter (${description.trim().length}/10)`}
                </span>
              </div>
              <textarea
                id="listing-description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError('');
                }}
                maxLength={3000}
                placeholder="Ev, oda veya eşya hakkında detaylı bilgi verin (Isınma, faturalar, yürüme mesafeleri, kurallar vb.)..."
                className={`w-full bg-slate-50 border rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:ring-2 focus:outline-hidden ${
                  description.length > 0 && description.trim().length < 10
                    ? 'border-amber-300 focus:ring-amber-500/20'
                    : 'border-slate-200 focus:ring-emerald-500/20'
                }`}
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep(1);
              }}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={() => {
                if (!validateStep2()) return;
                setStep(3);
              }}
              className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/30 transition"
            >
              Devam Et
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION & UNIVERSITY */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">3. Konum & Kampüs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Öğrencilerin haritada ve mesafe filtrelerinde sizi bulmasını sağlayın.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="listing-university" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Yakın Olduğu Üniversite / Kampüs *
              </label>
              <select
                id="listing-university"
                name="universityId"
                value={universityId}
                onChange={(e) => {
                  setUniversityId(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName}) — {u.district}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="listing-district" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  İlçe *
                </label>
                <select
                  id="listing-district"
                  name="district"
                  value={district}
                  onChange={(e) => {
                    handleDistrictChange(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-medium"
                >
                  {ISTANBUL_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="listing-neighborhood" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Semt / Mahalle *
                </label>
                <select
                  id="listing-neighborhood"
                  name="neighborhood"
                  value={neighborhood}
                  onChange={(e) => {
                    handleNeighborhoodChange(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-medium"
                >
                  {getDistrictByName(district)?.neighborhoods.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="listing-location-text" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Açık Adres / Konum Detayı (İsteğe Bağlı)
              </label>
              <input
                id="listing-location-text"
                name="locationText"
                type="text"
                value={locationText}
                maxLength={200}
                onChange={(e) => {
                  setLocationText(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Örn: Moda caddesi, tramvaya 2 dk, market karşısı..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            {/* Interactive Google Maps Leaflet Layer with Pin & Live Campus Distance */}
            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              campusLat={selectedUni?.latitude}
              campusLng={selectedUni?.longitude}
              campusName={selectedUni?.shortName || selectedUni?.name}
              onChange={(newLat, newLng) => {
                setLatitude(newLat);
                setLongitude(newLng);
              }}
            />
          </div>

          <div className="hidden sm:flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep(2);
              }}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={() => {
                if (!district.trim()) {
                  setError('Lütfen ilçe bilgisini giriniz.');
                  return;
                }
                if (!universityId) {
                  setError('Lütfen ilgili kampüs / üniversiteyi seçiniz.');
                  return;
                }
                setError('');
                setStep(4);
              }}
              className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/30 transition"
            >
              Devam Et
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PHOTOS */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">4. Fotoğraf Ekleme</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fotoğraflı ilanlar öğrencilerden 5 kat daha hızlı dönüş alır.</p>
          </div>

          {/* Real File Upload (Cloudinary) */}
          <div className="border-2 border-dashed border-teal-300 bg-teal-50/60 hover:bg-teal-50 rounded-3xl p-5 sm:p-8 text-center transition">
            <input
              type="file"
              id="file-upload"
              name="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              disabled={uploading || images.length >= 10}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center cursor-pointer ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-3 shadow-xs">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>
              <span className="font-extrabold text-base sm:text-lg text-slate-900">
                {uploading ? 'Görsel Yükleniyor...' : 'Fotoğraf Seç veya Fotoğraf Çek'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                JPG, PNG veya WebP • Maks. 5 MB (En fazla 10 adet)
              </span>
            </label>
          </div>

          {/* Added photos grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Yüklenmiş Fotoğraflar ({images.length}/10)
              </span>
              {images.length > 0 && (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  İlk fotoğraf ana kapak görselidir
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-xs group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      Kapak
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    aria-label="Fotoğrafı sil"
                    className="absolute top-1.5 right-1.5 p-2 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 active:scale-95 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible / Optional Quick Mock Samples & URL */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Hızlı Örnek Fotoğraflar veya Link Ekle
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_MOCK_IMAGES.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (!images.includes(url)) setImages([...images, url]);
                  }}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 active:scale-95 transition"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <label htmlFor="custom-image-url" className="sr-only">
                Görsel Web Bağlantısı
              </label>
              <input
                id="custom-image-url"
                name="customImageUrl"
                type="text"
                placeholder="Görsel web adresi yapıştırın (https://...)"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-base sm:text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="bg-slate-900 text-white px-4 py-3 rounded-2xl font-bold text-xs hover:bg-slate-800 active:scale-95 transition shrink-0"
              >
                Ekle
              </button>
            </div>
          </div>

          <div className="hidden sm:flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/30 transition"
            >
              Önizlemeye Geç
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: PREVIEW & PUBLISH */}
      {step === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">5. İlan Önizlemesi</h2>
            <p className="text-xs text-slate-500 mt-0.5">İlanınız diğer öğrencilere tam olarak bu şekilde görünecektir.</p>
          </div>

          <div className="max-w-xs mx-auto py-2">
            <ListingCard
              listing={{
                id: 'preview',
                title: title || 'İlan Başlığı Önizleme',
                price: Number(price) || 0,
                category,
                district,
                locationText: [neighborhood, locationText].filter(Boolean).join(' • ') || district,
                status: 'ACTIVE',
                condition,
                featured: false,
                university: selectedUni ? { name: selectedUni.name, shortName: selectedUni.shortName } : null,
                user: { name: 'Siz (Öğrenci)', studentVerified: true },
                images: images.map((url) => ({ url })),
                distanceKm: (selectedUni && selectedUni.latitude && selectedUni.longitude && latitude && longitude)
                  ? calculateDistance(latitude, longitude, selectedUni.latitude, selectedUni.longitude)
                  : 1.2,
              }}
            />
          </div>

          {/* Phone call permission toggle */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <label htmlFor="allow-phone-calls" className="block text-sm font-bold text-slate-800 cursor-pointer">
                Beni Telefonla Arayabilsinler
              </label>
              <span className="block text-xs text-slate-500 mt-0.5">
                Açık olursa ilanınızda &quot;Telefonu Göster&quot; butonu yer alır. Kapalı tutarsanız öğrenciler yalnızca Gampüs üzerinden mesajlaşabilir.
              </span>
            </div>
            <label htmlFor="allow-phone-calls" className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="allow-phone-calls"
                name="allowPhoneCalls"
                type="checkbox"
                checked={allowPhoneCalls}
                onChange={(e) => setAllowPhoneCalls(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="hidden sm:flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-base shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-current" />
              {loading ? 'Yayınlanıyor...' : 'İlanı Hemen Yayınla'}
            </button>
          </div>
        </div>
      )}

      {/* Sticky Mobile Action Bar (sm:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              setError('');
              setStep(step - 1);
            }}
            className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
        ) : (
          <div />
        )}

        {step === 1 && (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition"
          >
            Devam Et
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              if (!validateStep2()) return;
              setStep(3);
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition"
          >
            Devam Et
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === 3 && (
          <button
            type="button"
            onClick={() => {
              if (!district.trim()) {
                setError('Lütfen ilçe bilgisini giriniz.');
                return;
              }
              if (!universityId) {
                setError('Lütfen ilgili kampüs / üniversiteyi seçiniz.');
                return;
              }
              setError('');
              setStep(4);
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition"
          >
            Devam Et
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === 4 && (
          <button
            type="button"
            onClick={() => setStep(5)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition"
          >
            Önizlemeye Geç
            <Eye className="w-4 h-4" />
          </button>
        )}

        {step === 5 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            {loading ? 'Yayınlanıyor...' : 'İlanı Hemen Yayınla'}
          </button>
        )}
      </div>
    </div>
  );
}
