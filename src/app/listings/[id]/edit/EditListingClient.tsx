'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  PlusCircle,
  Upload,
  Save
} from 'lucide-react';

interface University {
  id: string;
  name: string;
  shortName: string;
  district: string;
}

interface EditListingClientProps {
  listing: any;
  universities: University[];
}

export default function EditListingClient({ listing, universities }: EditListingClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states initialized with existing listing data
  const [title, setTitle] = useState(listing.title || '');
  const [description, setDescription] = useState(listing.description || '');
  const [price, setPrice] = useState(String(listing.price || ''));
  const [district, setDistrict] = useState(listing.district || 'Kadıköy');
  const [locationText, setLocationText] = useState(listing.locationText || '');
  const [universityId, setUniversityId] = useState(listing.universityId || '');
  const [condition, setCondition] = useState<'NEW' | 'GOOD' | 'USED'>(listing.condition || 'GOOD');
  const [allowPhoneCalls, setAllowPhoneCalls] = useState(listing.allowPhoneCalls || false);
  const [images, setImages] = useState<string[]>(
    listing.images && listing.images.length > 0
      ? listing.images.map((img: any) => img.url)
      : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80']
  );
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleAddCustomImage = () => {
    if (!customImageUrl.trim()) return;
    if (!customImageUrl.startsWith('http://') && !customImageUrl.startsWith('https://')) {
      setError('Geçerli bir görsel URL\'si giriniz (http:// veya https:// ile başlamalıdır).');
      return;
    }
    if (images.length >= 10) {
      setError('En fazla 10 görsel ekleyebilirsiniz.');
      return;
    }
    setImages([...images, customImageUrl.trim()]);
    setCustomImageUrl('');
    setError('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 10) {
      setError('En fazla 10 adet görsel yükleyebilirsiniz.');
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
        setError(data.error || 'Görsel yüklenemedi.');
      } else if (data.url) {
        setImages([...images, data.url]);
      }
    } catch (err) {
      setError('Görsel yükleme sırasında bağlantı hatası oluştu.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      setError('İlanda en az 1 görsel bulunmalıdır.');
      return;
    }
    setImages(images.filter((_, i) => i !== index));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (title.trim().length < 5) {
      setError('Başlık en az 5 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    if (description.trim().length < 10) {
      setError('Açıklama en az 10 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    const numPrice = Number(price);
    if (!numPrice || numPrice <= 0) {
      setError('Lütfen geçerli bir fiyat giriniz.');
      setLoading(false);
      return;
    }

    if (images.length === 0) {
      setError('En az 1 görsel gereklidir.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: numPrice,
          district: district.trim(),
          locationText: locationText.trim(),
          universityId: universityId || undefined,
          condition: listing.category === 'FURNITURE' ? condition : undefined,
          allowPhoneCalls,
          images,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'İlan güncellenirken bir hata oluştu.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/listings/${listing.id}`);
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          İlana Geri Dön
        </Link>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
          İlan ID: {listing.id}
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-600" />
            İlanı Düzenle
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            İlanınızın başlığını, fiyatını, açıklamasını ve görsellerini güncelleyebilirsiniz.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>İlan başarıyla güncellendi! İlan sayfasına yönlendiriliyorsunuz...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                İlan Başlığı *
              </label>
              <span className={`text-[10px] ${title.length >= 5 ? 'text-slate-500' : 'text-rose-500'}`}>
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              required
              minLength={5}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
              placeholder="Örn: Kadıköy Rıhtım 5 dk Ferah 2+1 Öğrenci Evi"
            />
          </div>

          {/* Price & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Fiyat (TL) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={1000000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                placeholder="Örn: 18500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                İlçe *
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                placeholder="Örn: Kadıköy, Beşiktaş"
              />
            </div>
          </div>

          {/* Location Text */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Konum Detayı / Mahalle *
              </label>
              <span className="text-[10px] text-slate-400">{locationText.length}/200</span>
            </div>
            <input
              type="text"
              required
              maxLength={200}
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
              placeholder="Örn: Caferağa Mah. Moda Tramvay Durağı yanı"
            />
          </div>

          {/* University Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              İlişkili Üniversite / Kampüs (Opsiyonel)
            </label>
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
            >
              <option value="">Üniversite Seçilmedi</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name} ({uni.shortName}) - {uni.district}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Açıklama *
              </label>
              <span className={`text-[10px] ${description.length >= 10 ? 'text-slate-500' : 'text-rose-500'}`}>
                {description.length}/3000
              </span>
            </div>
            <textarea
              required
              minLength={10}
              maxLength={3000}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
              placeholder="İlan hakkında detaylı bilgi, şartlar, eşya durumu veya ev kuralları..."
            />
          </div>

          {/* Category-specific: Condition for FURNITURE */}
          {listing.category === 'FURNITURE' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Eşya Durumu
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
              >
                <option value="NEW">Sıfır / Hiç Kullanılmamış</option>
                <option value="GOOD">Çok İyi / Az Kullanılmış</option>
                <option value="USED">Kullanılmış / Temiz</option>
              </select>
            </div>
          )}

          {/* Communication Preferences */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-slate-800">Telefon Numarası Görünsün</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Açık olduğunda telefon numaranız ilanda gösterilir.
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

          {/* Image Gallery Management */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                İlan Fotoğrafları ({images.length}/10)
              </label>
              <span className="text-[11px] text-slate-400">En az 1, en fazla 10 fotoğraf</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((imgUrl, index) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                  <img src={imgUrl} alt={`Fotoğraf ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-lg opacity-80 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                    title="Fotoğrafı Kaldır"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      Kapak
                    </span>
                  )}
                </div>
              ))}
            </div>

            {images.length < 10 && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <div className="flex-1 flex gap-2">
                  <input
                    type="url"
                    placeholder="Görsel URL'si ekle (https://...)"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomImage}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>

                <label className="inline-flex items-center justify-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Yükleniyor...' : 'Cihazdan Yükle'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href={`/listings/${listing.id}`}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
            >
              Vazgeç
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-7 py-3 rounded-2xl text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

