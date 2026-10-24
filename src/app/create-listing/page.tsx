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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          <span>Ücretsiz İlan Ver</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Öğrenci İlanı Oluştur
        </h1>
        <p className="text-slate-500 text-sm">
          Evini, odanı veya eşyalarını doğrulanmış üniversite öğrencileriyle paylaş.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 text-xs font-bold text-slate-400 max-w-xl mx-auto">
        <button
          onClick={() => canGoToStep(1)}
          className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-600' : ''}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>1</span>
          Kategori
        </button>
        <span className="text-slate-300">—</span>
        <button
          onClick={() => canGoToStep(2)}
          className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-600' : ''}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>2</span>
          Detaylar
        </button>
        <span className="text-slate-300">—</span>
        <button
          onClick={() => canGoToStep(3)}
          className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-600' : ''}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>3</span>
          Konum
        </button>
        <span className="text-slate-300">—</span>
        <button
          onClick={() => canGoToStep(4)}
          className={`flex items-center gap-1.5 ${step >= 4 ? 'text-emerald-600' : ''}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>4</span>
          Fotoğraflar
        </button>
        <span className="text-slate-300">—</span>
        <button
          onClick={() => canGoToStep(5)}
          className={`flex items-center gap-1.5 ${step >= 5 ? 'text-emerald-600' : ''}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>5</span>
          Önizleme
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CATEGORY */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900">1. Kategori Seçiniz</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'HOUSE', title: '🏠 Kiralık Ev', desc: '1+1, 2+1 veya komple öğrenci dairesi' },
              { id: 'ROOMMATE', title: '👥 Ev Arkadaşı', desc: 'Mevcut evine oda veya ev arkadaşı arayanlar' },
              { id: 'ROOM', title: '🛏️ Kiralık Oda', desc: 'Evdeki tek kişil kiralık öğrenci odası' },
              { id: 'FURNITURE', title: '🛋️ İkinci El Eşya', desc: 'Masa, koltuk, yatak, beyaz eşya vs.' },
              { id: 'HOUSE_PACKAGE', title: '📦 Komple Ev Eşyası Paketi', desc: 'Mezun olan öğrenciden toplu ev eşyası' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id as any)}
                className={`p-5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                  category === item.id
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-extrabold text-slate-900 text-base">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
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

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/30"
            >
              Devam Et
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DETAILS */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900">2. İlan Detayları</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  İlan Başlığı *
                </label>
                <span className={`text-[11px] ${title.trim().length >= 5 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  {title.trim().length >= 5 ? '✓ Başlık geçerli' : 'En az 5 karakter'} ({title.trim().length}/120)
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                maxLength={120}
                placeholder="Örn: Kadıköy Moda'da Marmara'ya 10 Dk 2+1 Öğrenci Evi"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fiyat (₺) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Örn: 18500"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              {(category === 'FURNITURE' || category === 'HOUSE_PACKAGE') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Eşya Durumu
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  >
                    <option value="NEW">Sıfır / Hiç Kullanılmamış</option>
                    <option value="GOOD">Çok İyi</option>
                    <option value="USED">İkinci El</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Açıklama *
                </label>
                <span className={`text-[11px] font-semibold ${description.trim().length >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {description.trim().length >= 10
                    ? `✓ Açıklama geçerli (${description.trim().length} karakter)`
                    : `En az 10 karakter gerekli (Şu an: ${description.trim().length})`}
                </span>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError('');
                }}
                maxLength={3000}
                placeholder="Ev, oda veya eşya hakkında detaylı bilgi verin (Isınma, faturalar, yürüme mesafeleri vb.)..."
                className={`w-full bg-slate-50 border rounded-2xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:outline-hidden ${
                  description.length > 0 && description.trim().length < 10
                    ? 'border-amber-300 focus:ring-amber-500/20'
                    : 'border-slate-200 focus:ring-emerald-500/20'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => {
                setError('');
                setStep(1);
              }}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
              onClick={() => {
                if (!validateStep2()) return;
                setStep(3);
              }}
              className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/30"
            >
              Devam Et
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION & UNIVERSITY */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900">3. Konum & İlgili Üniversite</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Yakın Olduğu Üniversite / Kampüs *
              </label>
              <select
                value={universityId}
                onChange={(e) => {
                  setUniversityId(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  İlçe *
                </label>
                <select
                  value={district}
                  onChange={(e) => {
                    handleDistrictChange(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-medium"
                >
                  {ISTANBUL_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Semt / Mahalle *
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => {
                    handleNeighborhoodChange(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-medium"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Açık Adres / Konum Detayı (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={locationText}
                maxLength={200}
                onChange={(e) => {
                  setLocationText(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Örn: Moda caddesi, tramvaya 2 dk, market karşısı..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            {/* Interactive Leaflet Map with Pin & Live Campus Distance */}
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

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => {
                setError('');
                setStep(2);
              }}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
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
              className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/30"
            >
              Devam Et
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PHOTOS */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900">4. Fotoğraf Ekleme</h2>

          {/* Real File Upload (Cloudinary) */}
          <div className="border-2 border-dashed border-teal-200 bg-teal-50/50 hover:bg-teal-50 rounded-3xl p-6 text-center transition">
            <input
              type="file"
              id="file-upload"
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
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-slate-900">
                {uploading ? 'Görsel Yükleniyor...' : 'Cihazınızdan Fotoğraf Yükleyin'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                JPG, PNG veya WebP formatında, maksimum 5 MB (En fazla 10 adet)
              </span>
            </label>
          </div>

          {/* Quick Mock Sample Images */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hazır Örnek Fotoğraflardan Seç veya Bağlantı Ekle
            </label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_MOCK_IMAGES.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (!images.includes(url)) setImages([...images, url]);
                  }}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Add custom URL */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Görsel URL adresi yapıştırın (https://...)"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-800"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="bg-slate-900 text-white px-4 py-3 rounded-2xl font-bold text-xs hover:bg-slate-800"
            >
              Ekle
            </button>
          </div>

          {/* Added photos list */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase">Yüklenmiş Fotoğraflar ({images.length})</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
              onClick={() => setStep(5)}
              className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/30"
            >
              Önizlemeye Geç
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: PREVIEW & PUBLISH */}
      {step === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">5. İlan Önizlemesi</h2>
              <p className="text-xs text-slate-500">İlanınız diğer öğrencilere tam olarak bu şekilde görünecektir.</p>
            </div>
          </div>

          <div className="max-w-xs mx-auto">
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
              <span className="block text-sm font-bold text-slate-800">Beni Telefonla Arayabilsinler</span>
              <span className="block text-xs text-slate-500">
                Açık olursa ilanınızda &quot;Telefonu Göster&quot; butonu yer alır. Kapalı tutarsanız öğrenciler yalnızca Gampüs üzerinden mesajlaşabilir.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={allowPhoneCalls}
                onChange={(e) => setAllowPhoneCalls(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep(4)}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-base shadow-lg shadow-emerald-600/30 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-current" />
              {loading ? 'Yayınlanıyor...' : 'İlanı Hemen Yayınla'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
