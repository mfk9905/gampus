import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAdminDashboardStats, getAllReports } from '@/services/report-service';
import { getAllUniversities } from '@/services/university-service';
import { getListings } from '@/services/listing-service';
import { prisma } from '@/lib/db/prisma';
import AdminClient from './AdminClient';

export const revalidate = 0;

export default async function AdminPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const stats = await getAdminDashboardStats();
  const reports = await getAllReports();
  const universities = await getAllUniversities();
  const listings = await getListings({ limit: 100 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { university: true, _count: { select: { listings: true } } },
  });
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      admin: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return (
    <AdminClient
      stats={stats}
      reports={reports}
      universities={universities}
      listings={listings}
      users={users}
      auditLogs={auditLogs}
    />
  );
}
