import { prisma } from '@/lib/db/prisma';
import { ReportStatus } from '@prisma/client';

export async function createReport(data: {
  listingId: string;
  reason: string;
  description?: string;
  reporterUserId?: string;
}) {
  const listing = await prisma.listing.findUnique({ where: { id: data.listingId } });

  return await prisma.report.create({
    data: {
      listingId: data.listingId,
      reportedUserId: listing?.userId || null,
      reason: data.reason,
      description: data.description || null,
      reporterUserId: data.reporterUserId || null,
    },
  });
}

export async function getAdminDashboardStats() {
  const totalUsers = await prisma.user.count();
  const totalListings = await prisma.listing.count();
  const activeListings = await prisma.listing.count({ where: { status: 'ACTIVE' } });
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const newTodayListings = await prisma.listing.count({
    where: { createdAt: { gte: startOfDay } },
  });

  const verifiedStudents = await prisma.user.count({
    where: { studentVerified: true },
  });

  const pendingReports = await prisma.report.count({
    where: { status: 'PENDING' },
  });

  const riskyListingsCount = await prisma.listing.count({
    where: { riskScore: { gte: 50 } },
  });

  const premiumListingsCount = await prisma.listing.count({
    where: { featured: true },
  });

  const successfulPayments = await prisma.payment.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    totalUsers,
    totalListings,
    activeListings,
    newTodayListings,
    verifiedStudents,
    pendingReports,
    riskyListingsCount,
    premiumListingsCount,
    totalRevenue: successfulPayments._sum.amount || 0,
    paymentCount: successfulPayments._count.id || 0,
  };
}

export async function getAllReports() {
  return await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        include: {
          user: true,
          images: true,
        },
      },
      reporter: true,
      reported: true,
      conversation: {
        include: {
          listing: true,
        },
      },
    },
  });
}

export async function updateReportStatus(reportId: string, status: ReportStatus, adminId?: string) {
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      resolvedAt: new Date(),
      resolvedBy: adminId || null,
    },
  });

  if (adminId) {
    await prisma.auditLog.create({
      data: {
        adminId,
        action: `REPORT_${status}`,
        targetType: 'REPORT',
        targetId: reportId,
        metadata: JSON.stringify({ status }),
      },
    });
  }

  return updated;
}

