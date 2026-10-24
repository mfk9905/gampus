import { notFound } from 'next/navigation';
import { getListingById } from '@/services/listing-service';
import { getCurrentUser } from '@/lib/auth';
import ListingDetailClient from './ListingDetailClient';
import type { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return {
      title: 'İlan Bulunamadı — UNILIVE',
    };
  }

  const priceText = `${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(listing.price)}`;

  return {
    title: `${listing.title} (${priceText}) | UNILIVE Öğrenci İlanı`,
    description: `${listing.district}, İstanbul'da ${listing.title}. Kampüs yakınında doğrulanmış öğrenci ilanı.`,
    openGraph: {
      title: `${listing.title} — UNILIVE`,
      description: `${listing.district}'de ${priceText} fiyatıyla öğrenci ilanı.`,
      images: listing.images && listing.images.length > 0 ? [listing.images[0].url] : [],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentUser();
  const listing = await getListingById(id, session?.id);

  if (!listing) {
    notFound();
  }

  return <ListingDetailClient listing={listing} currentUserId={session?.id} />;
}
