import Link from 'next/link';
import Image from 'next/image';
import CampusSelector from '@/components/campus/CampusSelector';
import ListingGrid from '@/components/listing/ListingGrid';
import { getListings } from '@/services/listing-service';
import { getAllUniversities } from '@/services/university-service';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import {
  Home as HomeIcon,
  Users,
  Armchair,
  Package,
  ShieldCheck,
  Smartphone,
  Navigation,
  Star,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  MapPin,
  Compass
} from 'lucide-react';

export const revalidate = 0; // Dynamic server rendering

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ uniId?: string }>;
}) {
  const { uniId } = await searchParams;
  const session = await getCurrentUser();

  const [universities, totalActiveListingsCount, totalUniversitiesCount] = await Promise.all([
    getAllUniversities(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.university.count(),
  ]);

  const selectedUni = uniId ? universities.find((u) => u.id === uniId) : universities[0];

  // Fetch featured listings
  const featuredListings = await getListings({ featured: true, limit: 8 }, session?.id);

  // Fetch campus-specific listings
  const campusListings = await getListings(
    { universityId: selectedUni?.id, limit: 8 },
    session?.id
  );

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Glowing Background Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Öğrenciden Öğrenciye Güvenli Kampüs Pazaryeri</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Öğrenci hayatını <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
              biraz daha kolaylaştır.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Evini bul. Ev arkadaşını seç. İkinci el eşyalarını komisyonsuz, güvenle al ve sat.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/explore?category=HOUSE"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <HomeIcon className="w-5 h-5" />
              Ev Ara
            </Link>
            <Link
              href="/explore?category=FURNITURE"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-2xl border border-slate-700 hover:border-emerald-500/50 hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <Armchair className="w-5 h-5 text-emerald-400" />
              Eşya Ara
            </Link>
            <Link
              href="/explore?category=ROOMMATE"
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md shadow-teal-600/30 hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <Users className="w-5 h-5" />
              Ev Arkadaşı Ara
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-slate-800/80 text-left">
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                {totalUniversitiesCount > 0 ? `${totalUniversitiesCount}+` : '10+'}
              </div>
              <div className="text-xs text-slate-400">İstanbul Kampüsü</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                {totalActiveListingsCount > 0 ? `${totalActiveListingsCount}` : '0'}
              </div>
              <div className="text-xs text-slate-400">Aktif Öğrenci İlanı</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">%100</div>
              <div className="text-xs text-slate-400">.edu.tr Doğrulama</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">0 TL</div>
              <div className="text-xs text-slate-400">Komisyon / Ücret</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* CAMPUS SELECTION SECTION */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Konum Bazlı Arama
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Kampüsünü Seç
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Üniversiteni seç, yurt ve dersliklerine yürüme mesafesindeki ev ve eşyaları anında listele.
              </p>
            </div>

            {/* Quick Campus Filter Links */}
            <div className="w-full md:w-80">
              <CampusSelector selectedUniversityId={selectedUni?.id} />
            </div>
          </div>

          {/* Quick Uni Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {universities.map((u) => (
              <Link
                key={u.id}
                href={`/?uniId=${u.id}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedUni?.id === u.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}
              >
                🎓 {u.shortName} ({u.district})
              </Link>
            ))}
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ne Aramıştın?
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              İhtiyacına uygun kategoriyi seç, doğrudan doğrulanmış ilan sahipleriyle iletişime geç.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/explore?category=HOUSE"
              className="group bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-500 card-hover flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🏠
              </div>
              <div className="mt-6">
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">
                  Kiralık Ev
                </h3>
                <p className="text-xs text-slate-500 mt-1">1+1, 2+1 ve kampüse yakın kiralık öğrenci evleri</p>
              </div>
            </Link>

            <Link
              href="/explore?category=ROOMMATE"
              className="group bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-teal-500 card-hover flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                👥
              </div>
              <div className="mt-6">
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-teal-600 transition-colors">
                  Ev Arkadaşı
                </h3>
                <p className="text-xs text-slate-500 mt-1">Mevcut evine arkadaş ara veya odaya yerleş</p>
              </div>
            </Link>

            <Link
              href="/explore?category=FURNITURE"
              className="group bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-amber-500 card-hover flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🛋️
              </div>
              <div className="mt-6">
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">
                  İkinci El Eşya
                </h3>
                <p className="text-xs text-slate-500 mt-1">Çalışma masası, koltuk, beyaz eşya & yatak</p>
              </div>
            </Link>

            <Link
              href="/explore?category=HOUSE_PACKAGE"
              className="group bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-purple-500 card-hover flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📦
              </div>
              <div className="mt-6">
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-purple-600 transition-colors">
                  Ev Eşyası Paketi
                </h3>
                <p className="text-xs text-slate-500 mt-1">Mezun olan öğrenciden komple ev eşyaları</p>
              </div>
            </Link>
          </div>
        </section>

        {/* CAMPUS VICINITY LISTINGS */}
        {selectedUni && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {selectedUni.name} Çevresindeki İlanlar
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {selectedUni.shortName} ({selectedUni.district}) yakınında kiralık ev, ev arkadaşı ve eşya ilanları
                </p>
              </div>

              <Link
                href={`/explore?universityId=${selectedUni.id}`}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group shrink-0"
              >
                Tüm Kampüs İlanlarını Gör
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <ListingGrid listings={campusListings} />
          </section>
        )}

        {/* FEATURED LISTINGS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 fill-current" />
                Öne Çıkan Öğrenci İlanları
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                En popüler ve hızlı devredilen fırsat ilanları
              </p>
            </div>

            <Link
              href="/explore"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              Hepsini İncele
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <ListingGrid listings={featuredListings} />
        </section>

        {/* UNILIVE TRUST SYSTEM SECTION (Requirement #14) */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              UNILIVE Güven Sistemi
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Öğrencilerin güvenliğini ve şeffaflığı ön planda tutan altyapı
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">🟢 Öğrenci Doğrulama</h4>
              <p className="text-[11px] text-slate-500 mt-1">.edu.tr e-posta kontrolü ile gerçek öğrenci rozeti</p>
            </div>

            <div className="text-center p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
              <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">📱 Telefon Doğrulama</h4>
              <p className="text-[11px] text-slate-500 mt-1">Onaylı iletişim numarası bilgisi</p>
            </div>

            <div className="text-center p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">⭐ Kullanıcı Puanları</h4>
              <p className="text-[11px] text-slate-500 mt-1">Şeffaf kullanıcı profilleri ve şikayet kontrolü</p>
            </div>

            <div className="text-center p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3">
                <Navigation className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">📍 Kampüs Mesafesi</h4>
              <p className="text-[11px] text-slate-500 mt-1">Üniversiteye hassas uzaklık hesabı</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
