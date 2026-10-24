import { prisma } from '@/lib/db/prisma';
import { ListingCategory, ListingStatus, Condition, Prisma } from '@prisma/client';
import { calculateDistance } from '@/lib/utils/distance';
import { evaluateListingRisk } from '@/services/moderation-service';
import {
  triggerSavedSearchNotifications,
  notifyFavoritePriceDrop,
  notifyFavoriteStatusChange,
} from '@/services/notification-service';

export interface ListingFilterOptions {
  category?: ListingCategory;
  universityId?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: Condition;
  status?: ListingStatus;
  featured?: boolean;
  search?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'distance';
  limit?: number;
  offset?: number;
}

export async function getListings(filters: ListingFilterOptions = {}, currentUserId?: string) {
  const where: Prisma.ListingWhereInput = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.universityId) {
    where.universityId = filters.universityId;
  }

  if (filters.district) {
    where.district = {
      contains: filters.district,
      mode: 'insensitive',
    };
  }

  if (filters.status) {
    where.status = filters.status;
  } else {
    // Default to active unless specified
    where.status = ListingStatus.ACTIVE;
  }

  if (filters.featured !== undefined) {
    where.featured = filters.featured;
  }

  if (filters.condition) {
    where.condition = filters.condition;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { district: { contains: filters.search, mode: 'insensitive' } },
      { locationText: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };
  if (filters.sortBy === 'price_asc') {
    orderBy = { price: 'asc' };
  } else if (filters.sortBy === 'price_desc') {
    orderBy = { price: 'desc' };
  }

  // Mesafe sıralaması seçildiyse: tüm aday ilanları mesafelerine göre doğru sıralayıp sayfala
  if (filters.sortBy === 'distance') {
    const allCandidateListings = await prisma.listing.findMany({
      where,
      take: 1000,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            studentVerified: true,
            phoneVerified: true,
          },
        },
        university: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        packageItems: true,
        favorites: currentUserId ? { where: { userId: currentUserId } } : false,
        _count: {
          select: { favorites: true, contacts: true },
        },
      },
    });

    let targetUni = null;
    if (filters.universityId) {
      targetUni = await prisma.university.findUnique({ where: { id: filters.universityId } });
    }

    const formattedAll = allCandidateListings.map((item) => {
      const uniToUse = targetUni || item.university;
      let distanceKm: number | null = null;

      if (uniToUse && item.latitude && item.longitude) {
        distanceKm = calculateDistance(
          uniToUse.latitude,
          uniToUse.longitude,
          item.latitude,
          item.longitude
        );
      }

      return {
        ...item,
        distanceKm,
        isFavorited: currentUserId ? (item.favorites && item.favorites.length > 0) : false,
      };
    });

    formattedAll.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return formattedAll.slice(offset, offset + limit);
  }

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    take: filters.limit || 50,
    skip: filters.offset || 0,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          studentVerified: true,
          phoneVerified: true,
        },
      },
      university: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      packageItems: true,
      favorites: currentUserId ? { where: { userId: currentUserId } } : false,
      _count: {
        select: { favorites: true, contacts: true },
      },
    },
  });

  // Fetch target university for distance calculation if universityId supplied
  let targetUni = null;
  if (filters.universityId) {
    targetUni = await prisma.university.findUnique({ where: { id: filters.universityId } });
  }

  // Format with distance and favorite status
  const formatted = listings.map((item) => {
    const uniToUse = targetUni || item.university;
    let distanceKm: number | null = null;

    if (uniToUse && item.latitude && item.longitude) {
      distanceKm = calculateDistance(
        uniToUse.latitude,
        uniToUse.longitude,
        item.latitude,
        item.longitude
      );
    }

    return {
      ...item,
      distanceKm,
      isFavorited: currentUserId ? (item.favorites && item.favorites.length > 0) : false,
    };
  });

  return formatted;
}

export async function countListings(filters: ListingFilterOptions = {}) {
  const where: Prisma.ListingWhereInput = {};

  if (filters.category) where.category = filters.category;
  if (filters.universityId) where.universityId = filters.universityId;
  if (filters.district) {
    where.district = { contains: filters.district, mode: 'insensitive' };
  }
  where.status = filters.status || ListingStatus.ACTIVE;
  if (filters.featured !== undefined) where.featured = filters.featured;
  if (filters.condition) where.condition = filters.condition;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { district: { contains: filters.search, mode: 'insensitive' } },
      { locationText: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.listing.count({ where });
}

export async function getListingById(id: string, currentUserId?: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          studentVerified: true,
          phoneVerified: true,
          allowPhoneCalls: true,
          createdAt: true,
          university: true,
        },
      },
      university: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      packageItems: true,
      favorites: currentUserId ? { where: { userId: currentUserId } } : false,
      _count: {
        select: { favorites: true, contacts: true },
      },
    },
  });

  if (!listing) return null;

  let distanceKm: number | null = null;
  if (listing.university && listing.latitude && listing.longitude) {
    distanceKm = calculateDistance(
      listing.university.latitude,
      listing.university.longitude,
      listing.latitude,
      listing.longitude
    );
  }

  return {
    ...listing,
    distanceKm,
    isFavorited: currentUserId ? (listing.favorites && listing.favorites.length > 0) : false,
  };
}

export async function createListing(userId: string, data: {
  category: ListingCategory;
  title: string;
  description: string;
  price: number;
  district: string;
  locationText: string;
  universityId?: string;
  latitude: number;
  longitude: number;
  condition?: Condition;
  images: string[];
  monthlyRent?: number;
  deposit?: number;
  handoverDate?: string;
  roommatesCount?: number;
  lookingForCount?: number;
  landlordContractStatus?: string;
  furnitureIncluded?: boolean;
  furniturePrice?: number;
  allowPhoneCalls?: boolean;
  packageItems?: { name: string; description?: string; estimatedValue?: number }[];
}) {
  // Moderate listing risk score
  const { riskScore } = evaluateListingRisk(data.title, data.description);

  // If allowPhoneCalls not provided, check user's default setting
  let allowCalls = data.allowPhoneCalls;
  if (allowCalls === undefined) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { allowPhoneCalls: true } });
    allowCalls = user?.allowPhoneCalls || false;
  }

  const created = await prisma.listing.create({
    data: {
      userId,
      category: data.category,
      title: data.title,
      description: data.description,
      price: data.price,
      district: data.district,
      locationText: data.locationText,
      universityId: data.universityId || null,
      latitude: data.latitude,
      longitude: data.longitude,
      condition: data.condition || null,
      status: ListingStatus.ACTIVE,
      riskScore,
      monthlyRent: data.monthlyRent || null,
      deposit: data.deposit || null,
      handoverDate: data.handoverDate ? new Date(data.handoverDate) : null,
      roommatesCount: data.roommatesCount || null,
      lookingForCount: data.lookingForCount || null,
      landlordContractStatus: data.landlordContractStatus || null,
      furnitureIncluded: data.furnitureIncluded || false,
      furniturePrice: data.furniturePrice || null,
      allowPhoneCalls: allowCalls,
      images: {
        create: data.images.map((url, idx) => ({
          url,
          sortOrder: idx,
        })),
      },
      packageItems: data.packageItems ? {
        create: data.packageItems.map((item) => ({
          name: item.name,
          description: item.description || null,
          estimatedValue: item.estimatedValue || null,
        })),
      } : undefined,
    },
    include: {
      images: true,
      packageItems: true,
    },
  });

  // Trigger saved search alert notifications
  await triggerSavedSearchNotifications(created.id);

  return created;
}

export async function updateListing(
  listingId: string,
  userId: string,
  data: any,
  isAdmin = false
) {
  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });

  if (!existing) {
    throw new Error('İlan bulunamadı.');
  }

  if (existing.userId !== userId && !isAdmin) {
    throw new Error('Bu ilanı güncelleme yetkiniz yok.');
  }

  // Fiyat değişikliği varsa geçmişe kaydet
  if (data.price !== undefined && data.price !== existing.price) {
    await prisma.listingPriceHistory.create({
      data: {
        listingId,
        oldPrice: existing.price,
        newPrice: data.price,
      },
    });
  }

  // Başlık veya açıklama değiştiyse risk skorunu tekrar hesapla
  let newRiskScore = existing.riskScore;
  if (data.title || data.description) {
    const { riskScore } = evaluateListingRisk(
      data.title || existing.title,
      data.description || existing.description
    );
    newRiskScore = riskScore;
  }

  // Görseller güncellendiyse eski kayıtları yenile
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    await prisma.listingImage.deleteMany({
      where: { listingId },
    });
    await prisma.listingImage.createMany({
      data: data.images.map((url: string, idx: number) => ({
        listingId,
        url,
        sortOrder: idx,
      })),
    });
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      price: data.price ?? existing.price,
      district: data.district ?? existing.district,
      locationText: data.locationText ?? existing.locationText,
      universityId: data.universityId !== undefined ? data.universityId : existing.universityId,
      latitude: data.latitude ?? existing.latitude,
      longitude: data.longitude ?? existing.longitude,
      condition: data.condition !== undefined ? data.condition : existing.condition,
      monthlyRent: data.monthlyRent !== undefined ? data.monthlyRent : existing.monthlyRent,
      deposit: data.deposit !== undefined ? data.deposit : existing.deposit,
      roommatesCount: data.roommatesCount !== undefined ? data.roommatesCount : existing.roommatesCount,
      lookingForCount: data.lookingForCount !== undefined ? data.lookingForCount : existing.lookingForCount,
      furnitureIncluded: data.furnitureIncluded !== undefined ? data.furnitureIncluded : existing.furnitureIncluded,
      furniturePrice: data.furniturePrice !== undefined ? data.furniturePrice : existing.furniturePrice,
      allowPhoneCalls: data.allowPhoneCalls !== undefined ? data.allowPhoneCalls : existing.allowPhoneCalls,
      riskScore: newRiskScore,
    },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      university: true,
      user: {
        select: {
          id: true,
          name: true,
          studentVerified: true,
          phoneVerified: true,
        },
      },
    },
  });

  return updated;
}

export async function toggleFavorite(userId: string, listingId: string) {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_listingId: {
        userId,
        listingId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
    return { favorited: false };
  } else {
    await prisma.favorite.create({
      data: { userId, listingId },
    });
    return { favorited: true };
  }
}

export async function recordContactLead(listingId: string, contactType: 'MESSAGE' | 'PHONE', viewerUserId?: string) {
  const lead = await prisma.contactLead.create({
    data: {
      listingId,
      contactType,
      viewerUserId: viewerUserId || null,
    },
  });

  // Track analytics event
  await prisma.analyticsEvent.create({
    data: {
      userId: viewerUserId || null,
      eventType: 'CONTACT_CLICK',
      listingId,
      metadata: JSON.stringify({ contactType }),
    },
  }).catch(() => {});

  return lead;
}

export async function updateListingPrice(listingId: string, userId: string, newPrice: number) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error('İlan bulunamadı');
  if (listing.userId !== userId) throw new Error('Bu işlem için yetkiniz yok');

  const oldPrice = listing.price;
  if (oldPrice === newPrice) return listing;

  // Record price history
  await prisma.listingPriceHistory.create({
    data: {
      listingId,
      oldPrice,
      newPrice,
    },
  });

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { price: newPrice },
  });

  // Notify favorite users if price dropped
  if (newPrice < oldPrice) {
    await notifyFavoritePriceDrop(listingId, oldPrice, newPrice);
  }

  return updated;
}

export async function updateListingStatus(listingId: string, userId: string, status: ListingStatus) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error('İlan bulunamadı');
  if (listing.userId !== userId) throw new Error('Bu işlem için yetkiniz yok');

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { status },
  });

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktif',
    SOLD: 'Satıldı',
    RENTED: 'Kiralandı',
    PASSIVE: 'Pasif',
  };

  await notifyFavoriteStatusChange(listingId, statusLabels[status] || status);

  return updated;
}

