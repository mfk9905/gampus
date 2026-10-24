import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';

export const getAllUniversities = cache(async () => {
  return await prisma.university.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { listings: true },
      },
    },
  });
});

export const getUniversityById = cache(async (id: string) => {
  return await prisma.university.findUnique({
    where: { id },
  });
});
