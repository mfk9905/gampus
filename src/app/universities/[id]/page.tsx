import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import ListingCard from '@/components/listing/ListingCard';
import { getListings } from '@/services/listing-service';
import { getCurrentUser } from '@/lib/auth';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; sortBy?: string }>;
}

export default async function CampusDiscoveryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { category, sortBy } = await searchParams;
  const currentUser = await getCurrentUser();

  const university = await prisma.university.findFirst({
    where: {
      OR: [
        { id },
        { shortName: id.toUpperCase() },
      ],
    },
  });

  if (!university) {
    notFound();
  }

  // Count stats
  const totalListings = await prisma.listing.count({
    where: { universityId: university.id, status: 'ACTIVE' },
  });
  const houseCount = await prisma.listing.count({
    where: { universityId: university.id, category: 'HOUSE', status: 'ACTIVE' },
  });
  const roomCount = await prisma.listing.count({
    where: { universityId: university.id, category: 'ROOM', status: 'ACTIVE' },
  });
  const furnitureCount = await prisma.listing.count({
    where: { universityId: university.id, category: 'FURNITURE', status: 'ACTIVE' },
  });

  const listings = await getListings(
    {
      universityId: university.id,
      category: (category as any) || undefined,
      sortBy: (sortBy as any) || 'distance',
      limit: 30,
    },
    currentUser?.id
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-slate-900">

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Campus Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-2xl">
                {university.shortName}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {university.name}
                </h1>
                <p className="text-slate-500 mt-1 flex items-center gap-1.5 text-sm">
                  <span>📍</span> {university.district}, {university.city} Kampüs Çevresi
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div className="text-xl font-semibold text-teal-600">{totalListings}</div>
                <div className="text-xs text-slate-500">Aktif İlan</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div className="text-xl font-semibold text-slate-800">{houseCount}</div>
                <div className="text-xs text-slate-500">Ev / Oda</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div className="text-xl font-semibold text-slate-800">{furnitureCount}</div>
                <div className="text-xs text-slate-500">2. El Eşya</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Category Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Link
              href={`/universities/${university.shortName.toLowerCase()}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !category
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tüm İlanlar
            </Link>
            <Link
              href={`/universities/${university.shortName.toLowerCase()}?category=HOUSE`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                category === 'HOUSE'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🏠 Kiralık Ev
            </Link>
            <Link
              href={`/universities/${university.shortName.toLowerCase()}?category=ROOMMATE`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                category === 'ROOMMATE'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              👥 Ev Arkadaşı
            </Link>
            <Link
              href={`/universities/${university.shortName.toLowerCase()}?category=FURNITURE`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                category === 'FURNITURE'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🛋️ 2. El Eşya
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Sırala:</span>
            <Link
              href={`/universities/${university.shortName.toLowerCase()}?sortBy=distance${category ? `&category=${category}` : ''}`}
              className={`px-3 py-1.5 rounded text-xs font-medium border ${
                sortBy === 'distance' || !sortBy
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Kampüse En Yakın
            </Link>
            <Link
              href={`/universities/${university.shortName.toLowerCase()}?sortBy=price_asc${category ? `&category=${category}` : ''}`}
              className={`px-3 py-1.5 rounded text-xs font-medium border ${
                sortBy === 'price_asc'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              En Ucuz
            </Link>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item: any) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="text-4xl mb-3">😕</div>
            <h3 className="text-lg font-semibold text-slate-800">
              Aradığınız kriterlerde henüz ilan bulunmuyor
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Yeni ilanlar eklendiğinde anında haberdar olmak için aramayı kaydedebilir veya yeni bir ilan verebilirsiniz.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/create-listing"
                className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
              >
                İlan Ver
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
