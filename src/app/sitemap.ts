import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (env.NEXT_PUBLIC_APP_URL || 'https://unilive.app').replace(/\/$/, '');

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore?category=HOUSE`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore?category=ROOMMATE`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore?category=FURNITURE`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, updatedAt: true },
      take: 200,
      orderBy: { updatedAt: 'desc' },
    });

    const listingPages: MetadataRoute.Sitemap = listings.map((l) => ({
      url: `${baseUrl}/listings/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    return [...staticPages, ...listingPages];
  } catch (err) {
    return staticPages;
  }
}

