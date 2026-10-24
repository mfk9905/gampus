import { prisma } from '@/lib/db/prisma';

export interface CreateNotificationParams {
  userId: string;
  type: 'SEARCH_MATCH' | 'FAVORITE_PRICE_DROP' | 'FAVORITE_STATUS_CHANGE' | 'CONTACT' | 'SYSTEM' | 'REVIEW';
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Check active saved searches and notify users if new listing matches their search criteria.
 */
export async function triggerSavedSearchNotifications(listingId: string) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { university: true },
    });

    if (!listing) return;

    // Find all active saved searches
    const savedSearches = await prisma.savedSearch.findMany({
      where: { isActive: true },
    });

    for (const search of savedSearches) {
      // Don't notify the user who posted the listing
      if (search.userId === listing.userId) continue;

      let match = true;

      if (search.category && search.category !== listing.category) match = false;
      if (search.universityId && search.universityId !== listing.universityId) match = false;
      if (search.district && search.district.toLowerCase() !== listing.district.toLowerCase()) match = false;
      if (search.minPrice !== null && search.minPrice !== undefined && listing.price < search.minPrice) match = false;
      if (search.maxPrice !== null && search.maxPrice !== undefined && listing.price > search.maxPrice) match = false;
      if (search.condition && search.condition !== listing.condition) match = false;

      if (match) {
        await createNotification({
          userId: search.userId,
          type: 'SEARCH_MATCH',
          title: '🔔 Aradığın ilan geldi!',
          message: `"${search.name}" aramana uygun yeni bir ilan yayınlandı: ${listing.title} (${listing.price.toLocaleString('tr-TR')} TL)`,
          link: `/listings/${listing.id}`,
        });
      }
    }
  } catch (error) {
    console.error('Trigger saved search notifications error:', error);
  }
}

/**
 * Notify users who favorited a listing when price drops or status changes.
 */
export async function notifyFavoritePriceDrop(listingId: string, oldPrice: number, newPrice: number) {
  if (newPrice >= oldPrice) return;

  try {
    const favorites = await prisma.favorite.findMany({
      where: { listingId },
      include: { listing: true },
    });

    for (const fav of favorites) {
      await createNotification({
        userId: fav.userId,
        type: 'FAVORITE_PRICE_DROP',
        title: '💰 Favorindeki ilanın fiyatı düştü!',
        message: `"${fav.listing.title}" fiyatı ${oldPrice.toLocaleString('tr-TR')} TL'den ${newPrice.toLocaleString('tr-TR')} TL'ye düştü.`,
        link: `/listings/${listingId}`,
      });
    }
  } catch (error) {
    console.error('Notify favorite price drop error:', error);
  }
}

export async function notifyFavoriteStatusChange(listingId: string, statusText: string) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { listingId },
      include: { listing: true },
    });

    for (const fav of favorites) {
      await createNotification({
        userId: fav.userId,
        type: 'FAVORITE_STATUS_CHANGE',
        title: 'ℹ️ Favorindeki ilanın durumu güncellendi',
        message: `"${fav.listing.title}" ilanı şu an "${statusText}" olarak işaretlendi.`,
        link: `/listings/${listingId}`,
      });
    }
  } catch (error) {
    console.error('Notify favorite status change error:', error);
  }
}
