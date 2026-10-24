import ExploreFilters from '@/components/filters/ExploreFilters';
import ListingGrid from '@/components/listing/ListingGrid';
import { getListings, countListings } from '@/services/listing-service';
import { getAllUniversities } from '@/services/university-service';
import { getCurrentUser } from '@/lib/auth';
import { ListingCategory, Condition, ListingStatus } from '@prisma/client';
import { Compass, Filter, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

const PAGE_SIZE = 24;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    universityId?: string;
    district?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    sortBy?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await getCurrentUser();

  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const [universities, totalListingsCount, listings] = await Promise.all([
    getAllUniversities(),
    countListings({
      category: params.category as ListingCategory,
      universityId: params.universityId,
      district: params.district,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      condition: params.condition as Condition,
      search: params.search,
      status: ListingStatus.ACTIVE,
    }),
    getListings(
      {
        category: params.category as ListingCategory,
        universityId: params.universityId,
        district: params.district,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        condition: params.condition as Condition,
        sortBy: params.sortBy as any,
        search: params.search,
        status: ListingStatus.ACTIVE,
        limit: PAGE_SIZE,
        offset,
      },
      session?.id
    ),
  ]);

  const totalPages = Math.ceil(totalListingsCount / PAGE_SIZE) || 1;

  const selectedUni = params.universityId
    ? universities.find((u) => u.id === params.universityId)
    : null;

  const getPageUrl = (pageNumber: number) => {
    const sp = new URLSearchParams();
    if (params.category) sp.set('category', params.category);
    if (params.universityId) sp.set('universityId', params.universityId);
    if (params.district) sp.set('district', params.district);
    if (params.minPrice) sp.set('minPrice', params.minPrice);
    if (params.maxPrice) sp.set('maxPrice', params.maxPrice);
    if (params.condition) sp.set('condition', params.condition);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.search) sp.set('search', params.search);
    if (pageNumber > 1) sp.set('page', String(pageNumber));
    return `/explore${sp.toString() ? `?${sp.toString()}` : ''}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Öğrenci Pazar Yeri
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {selectedUni ? `${selectedUni.name} İlanları` : 'Kampüs İlanlarını Keşfet'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Toplam <span className="font-bold text-emerald-400">{totalListingsCount}</span> doğrulanmış öğrenci ilanı bulunuyor.
          </p>
        </div>

        {/* Quick Category Tabs */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/explore"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !params.category ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tümü
          </Link>
          <Link
            href="/explore?category=HOUSE"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              params.category === 'HOUSE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏠 Ev
          </Link>
          <Link
            href="/explore?category=ROOMMATE"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              params.category === 'ROOMMATE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            👥 Ev Arkadaşı
          </Link>
          <Link
            href="/explore?category=FURNITURE"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              params.category === 'FURNITURE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🛋️ Eşya
          </Link>
          <Link
            href="/explore?category=HOUSE_PACKAGE"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              params.category === 'HOUSE_PACKAGE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📦 Ev Paketi
          </Link>
        </div>
      </div>

      {/* Main Grid & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <ExploreFilters universities={universities} />
          </div>
        </div>

        {/* Listings Display */}
        <div className="lg:col-span-3 space-y-6">
          <ListingGrid
            listings={listings}
            emptyTitle="Kriterlere Uygun İlan Bulunamadı"
            emptySubtitle="Filtreleme kriterlerinizi değiştirerek daha fazla seçeneğe ulaşabilirsiniz."
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs text-xs text-slate-600">
              <div>
                Toplam <strong className="text-slate-900 font-bold">{totalListingsCount}</strong> ilandan{' '}
                <strong className="text-slate-900 font-bold">{offset + 1} - {Math.min(offset + PAGE_SIZE, totalListingsCount)}</strong> arası gösteriliyor
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={getPageUrl(currentPage - 1)}
                  aria-disabled={currentPage <= 1}
                  className={`px-3 py-2 rounded-xl border border-slate-200 font-bold flex items-center gap-1 transition ${
                    currentPage <= 1
                      ? 'opacity-40 pointer-events-none bg-slate-50 text-slate-400'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Önceki
                </Link>

                <span className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                  {currentPage} / {totalPages}
                </span>

                <Link
                  href={getPageUrl(currentPage + 1)}
                  aria-disabled={currentPage >= totalPages}
                  className={`px-3 py-2 rounded-xl border border-slate-200 font-bold flex items-center gap-1 transition ${
                    currentPage >= totalPages
                      ? 'opacity-40 pointer-events-none bg-slate-50 text-slate-400'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Sonraki
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
