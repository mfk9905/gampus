import { prisma } from '@/lib/db/prisma';

export async function getAllUniversities() {
  return await prisma.university.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { listings: true }
      }
    }
  });
}

export async function getUniversityById(id: string) {
  return await prisma.university.findUnique({
    where: { id },
  });
}
