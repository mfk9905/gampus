'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Share2,
  AlertTriangle,
  GraduationCap,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Navigation,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  Rocket,
  CheckCircle2,
  Package,
  Edit3
} from 'lucide-react';
import ReportModal from '@/components/report/ReportModal';
import { formatDistance } from '@/lib/utils/distance';
import { PREMIUM_TIERS } from '@/config/constants';

interface ListingDetailClientProps {
  listing: any;
  currentUserId?: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  HOUSE: '🏠 Kiralık Ev',
  ROOM: '🛏️ Kiralık Oda',
  ROOMMATE: '👥 Ev Arkadaşı',
  FURNITURE: '🛋️ İkinci El Eşya',
  HOUSE_PACKAGE: '📦 Ev Paketi',
};

const CONDITION_NAMES: Record<string, string> = {
  NEW: 'Sıfır / Hiç Kullanılmamış',
  GOOD: 'Çok İyi Durumda',
  USED: 'Kullanılmış',
};

export default function ListingDetailClient({ listing, currentUserId }: ListingDetailClientProps) {
  const router = useRouter();
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(listing.isFavorited || false);
  const [showPhone, setShowPhone] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Premium Boost Modal State
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [selectedTierDays, setSelectedTierDays] = useState(7);
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostMessage, setBoostMessage] = useState('');

  const isOwner = Boolean(currentUserId && listing.userId === currentUserId);
  const allowsPhone = Boolean(listing.allowPhoneCalls ?? listing.user?.allowPhoneCalls);
  const isInactive = listing.status !== 'ACTIVE';

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80' }];

  const formattedPrice = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(listing.price);

  const isRentable = listing.category === 'HOUSE' || listing.category === 'ROOM';

  const handleContactClick = async (type: 'MESSAGE' | 'PHONE') => {
    try {
      await fetch('/api/contact-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          contactType: type,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartChat = async () => {
    if (!currentUserId) {
      router.push(`/login?redirect=${encodeURIComponent(`/listings/${listing.id}`)}`);
      return;
    }

    if (isOwner) {
      alert('Kendi ilanınıza mesaj gönderemezsiniz.');
      return;
    }

    if (isInactive) {
      alert('Bu ilan artık aktif olmadığı için sohbet başlatılamaz.');
      return;
    }

    setStartingChat(true);
    try {
      await handleContactClick('MESSAGE');
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Sohbet başlatılamadı.');
        return;
      }

      router.push(`/messages?id=${data.conversation.id}`);
    } catch (e) {
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setStartingChat(false);
    }
  };

  const handleFavoriteToggle = async () => {
    const prev = isFavorited;
    setIsFavorited(!prev);

    try {
      const res = await fetch(`/api/listings/${listing.id}/favorite`, { method: 'POST' });
      if (!res.ok) {
        setIsFavorited(prev);
        if (res.status === 401) {
          alert('Favorilere eklemek için lütfen giriş yapınız.');
        }
      }
    } catch (e) {
      setIsFavorited(prev);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleBoostListing = async () => {
    setBoostLoading(true);
    setBoostMessage('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          durationDays: selectedTierDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBoostMessage(data.error || 'İşlem gerçekleştirilemedi.');
      } else {
        setBoostMessage('🚀 Harika! İlanınız öne çıkarıldı.');
        setTimeout(() => {
          setIsBoostModalOpen(false);
          window.location.reload();
        }, 1500);
      }
    } catch (e) {
      setBoostMessage('Ödeme bağlantı hatası.');
    } finally {
      setBoostLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-teal-600">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/explore" className="hover:text-teal-600">İlanlar</Link>
        <span>/</span>
        <span className="text-slate-800 line-clamp-1">{listing.title}</span>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gallery & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photo Gallery */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 group">
              <img
                src={images[selectedImgIndex].url}
                alt={listing.title}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {listing.featured && (
                <div className="absolute top-4 left-4 bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🔥 ÖNE ÇIKAN İLAN</span>
                </div>
              )}

              {/* Status Banner */}
              {listing.status !== 'ACTIVE' && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center">
                  <span className="text-white font-extrabold text-xl uppercase tracking-widest bg-rose-600 px-6 py-2 rounded-2xl shadow-xl">
                    {listing.status === 'RENTED' ? 'Kiralandı' : listing.status === 'SOLD' ? 'Satıldı' : 'Pasif İlan'}
                  </span>
                </div>
              )}

              {/* Gallery Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSelectedImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: any, idx: number) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`relative aspect-square w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImgIndex === idx ? 'border-teal-600 ring-2 ring-teal-500/20' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-teal-100 text-teal-800">
                {CATEGORY_NAMES[listing.category] || listing.category}
              </span>
              {listing.condition && (
                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
                  {CONDITION_NAMES[listing.condition] || listing.condition}
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                İlan Tarihi: {new Date(listing.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {listing.title}
            </h1>

            <div className="border-t border-b border-slate-100 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">Konum / İlçe</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  {listing.district}, İstanbul
                </span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">İlgili Üniversite</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  {listing.university?.shortName || 'Tüm Kampüsler'}
                </span>
              </div>
              {listing.distanceKm !== null && listing.distanceKm !== undefined && (
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block">Kampüse Mesafe</span>
                  <span className="font-bold text-teal-700 flex items-center gap-1 mt-0.5">
                    <Navigation className="w-4 h-4 text-teal-600" />
                    {formatDistance(listing.distanceKm)}
                  </span>
                </div>
              )}
            </div>

            {/* Package Items Section if present */}
            {listing.packageItems && listing.packageItems.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  Paket İçerisindeki Eşyalar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listing.packageItems.map((item: any) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.description && <div className="text-slate-500">{item.description}</div>}
                      {item.estimatedValue && <div className="text-teal-700 font-semibold">Tahmini Değer: {item.estimatedValue} TL</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description Text */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-lg">İlan Açıklaması</h3>
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {listing.description}
              </div>
            </div>

            {/* Safe Shopping Box */}
            <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
                <Shield className="w-4 h-4 text-teal-700" />
                <span>🛡️ Güvenli Alışveriş İpuçları</span>
              </div>
              <ul className="text-xs text-teal-800 space-y-1 list-disc pl-4 font-medium">
                <li>Evi veya eşyayı canlı görmeden kesinlikle kapora/ön ödeme göndermeyiniz.</li>
                <li>Şüpheli ödeme ve IBAN taleplerini derhal Gampüs ekibine bildirin.</li>
                <li>Elden teslim veya kiralama süreçlerinde satıcı/ev sahibiyle doğrudan iletişime geçiniz.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Price & Lead Contact Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm sticky top-24">
            {/* Price Header */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Fiyat
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {formattedPrice}
                {isRentable && <span className="text-sm font-normal text-slate-500"> / ay</span>}
              </div>
            </div>

            {/* Owner Actions if currentUser is owner */}
            {isOwner && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Bu İlanın Sahibisiniz
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                    İlanı Düzenle
                  </Link>
                  {!isInactive && (
                    <button
                      onClick={() => setIsBoostModalOpen(true)}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      Öne Çıkar
                    </button>
                  )}
                </div>
                {isInactive && (
                  <div className="text-xs text-amber-800 bg-amber-100/70 p-2.5 rounded-xl text-center font-medium">
                    {listing.status === 'SOLD'
                      ? 'İlan satıldığı için öne çıkarma kapalıdır.'
                      : listing.status === 'RENTED'
                      ? 'İlan kiralandığı için öne çıkarma kapalıdır.'
                      : 'İlan pasif durumda olduğu için öne çıkarma kapalıdır.'}
                  </div>
                )}
              </div>
            )}

            {/* User Profile Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  {listing.user?.name ? listing.user.name.substring(0, 2).toUpperCase() : 'ÖK'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{listing.user?.name}</h4>
                  <div className="text-xs text-slate-500">
                    {listing.user?.university?.shortName || 'Üniversite Öğrencisi'}
                  </div>
                </div>
              </div>

              {/* Verification Badges */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                {listing.user?.studentVerified && (
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-100/70 border border-teal-300 px-3 py-1.5 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>🟢 Öğrenci Doğrulandı (.edu.tr)</span>
                  </div>
                )}
                {listing.user?.phoneVerified && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
                    <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>📱 Telefon Doğrulandı</span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              {isInactive ? (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center space-y-1.5">
                  <div className="text-sm font-bold text-slate-800 flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                    {listing.status === 'SOLD'
                      ? 'Bu İlan Satılmıştır'
                      : listing.status === 'RENTED'
                      ? 'Bu İlan Kiralanmıştır'
                      : 'Bu İlan Artık Aktif Değildir'}
                  </div>
                  <p className="text-xs text-slate-500">
                    Bu ilan için mesaj gönderimi ve iletişim kapalıdır.
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleStartChat}
                    disabled={startingChat || isOwner}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all text-sm cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5 fill-current" />
                    {startingChat ? 'Sohbet Başlatılıyor...' : isOwner ? 'Sizin İlanınız' : 'Uygulama İçi Mesaj Gönder'}
                  </button>

                  {allowsPhone && listing.user?.phone ? (
                    showPhone ? (
                      <div className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-2xl text-center text-sm border border-slate-800 flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <a href={`tel:${listing.user.phone}`} className="hover:underline">
                          {listing.user.phone}
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowPhone(true);
                          handleContactClick('PHONE');
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-slate-600" />
                        Telefon Numarasını Göster
                      </button>
                    )
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-center">
                      <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                        İlan sahibi yalnızca uygulama içi mesajlaşmayı tercih ediyor.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleFavoriteToggle}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  isFavorited
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-rose-600' : ''}`} />
                {isFavorited ? 'Favorilerimde' : 'Favorilere Ekle'}
              </button>

              <button
                onClick={handleShare}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-4 h-4" />
                {copiedLink ? 'Kopyalandı!' : 'Paylaş'}
              </button>
            </div>

            {/* Report Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full text-center text-xs text-rose-600 hover:underline font-semibold flex items-center justify-center gap-1 pt-2"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              İlanı Şikayet Et / Hatalı Bilgi
            </button>
          </div>
        </div>
      </div>

      {/* Boost Modal */}
      {isBoostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-500" />
                İlanını Öne Çıkar (Boost)
              </h3>
              <button onClick={() => setIsBoostModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {boostMessage && (
              <div className="bg-teal-50 border border-teal-200 text-teal-800 p-3 rounded-2xl text-xs font-bold">
                {boostMessage}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">Paket Seçin</label>
              {PREMIUM_TIERS.map((tier) => (
                <label
                  key={tier.days}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    selectedTierDays === tier.days
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tier"
                      checked={selectedTierDays === tier.days}
                      onChange={() => setSelectedTierDays(tier.days)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900">{tier.label}</div>
                      <div className="text-xs text-slate-500">{tier.days} gün boyunca en üstte sergilenir</div>
                    </div>
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm">{tier.price} TL</div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBoostModalOpen(false)}
                className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={boostLoading}
                onClick={handleBoostListing}
                className="w-1/2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs shadow-md shadow-amber-500/30"
              >
                {boostLoading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        listingId={listing.id}
        listingTitle={listing.title}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

