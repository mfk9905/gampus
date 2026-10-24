import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminDashboardStats } from '@/services/report-service';

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getAdminDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'İstatistikler yüklenemedi.' }, { status });
  }
}
