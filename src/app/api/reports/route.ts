import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdmin } from '@/lib/auth/admin';
import { createReport, getAllReports, updateReportStatus } from '@/services/report-service';
import { reportSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { ReportStatus } from '@prisma/client';

export async function GET() {
  try {
    await requireAdmin();
    const reports = await getAllReports();
    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Şikayetler yüklenemedi.' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    const ip = getClientIp(req);

    const rateLimit = await checkRateLimit({
      key: `report:${session?.id || ip}`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok fazla şikayet gönderildi. Lütfen daha sonra tekrar deneyiniz.' }, { status: 429 });
    }

    const body = await req.json();
    const result = reportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const report = await createReport({
      listingId: result.data.listingId,
      reason: result.data.reason,
      description: result.data.description,
      reporterUserId: session?.id,
    });

    return NextResponse.json({
      success: true,
      report,
      message: 'Şikayetiniz yöneticilere iletildi. İncelenecektir.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Şikayet gönderilemedi.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await req.json();
    const { reportId, status } = body;

    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json({ error: 'Geçersiz şikayet ID.' }, { status: 400 });
    }

    const validStatuses: ReportStatus[] = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz şikayet durumu.' }, { status: 400 });
    }

    const updated = await updateReportStatus(reportId, status, adminUser.id);
    return NextResponse.json({ success: true, report: updated });
  } catch (error: any) {
    const code = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Şikayet güncellenemedi.' }, { status: code });
  }
}
