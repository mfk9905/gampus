import { NextResponse } from 'next/server';
import { getAllUniversities } from '@/services/university-service';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, logAdminAction } from '@/lib/auth/admin';

export async function GET() {
  try {
    const universities = await getAllUniversities();
    return NextResponse.json({ success: true, universities });
  } catch (error: any) {
    return NextResponse.json({ error: 'Üniversiteler yüklenemedi.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const { name, shortName, city, district, latitude, longitude, logo } = body;

    if (!name || !shortName || !city || !district) {
      return NextResponse.json({ error: 'Lütfen tüm alanları doldurunuz.' }, { status: 400 });
    }

    const uni = await prisma.university.create({
      data: {
        name,
        shortName,
        city,
        district,
        latitude: Number(latitude) || 41.0082,
        longitude: Number(longitude) || 28.9784,
        logo: logo || null,
      },
    });

    await logAdminAction(admin.id, 'CREATE_UNIVERSITY', 'UNIVERSITY', uni.id, { name, shortName });

    return NextResponse.json({ success: true, university: uni });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Üniversite eklenemedi.' }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const { id, name, shortName, city, district, latitude, longitude, logo } = body;

    if (!id) {
      return NextResponse.json({ error: 'Üniversite ID zorunludur.' }, { status: 400 });
    }

    const updated = await prisma.university.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(shortName && { shortName: shortName.trim().toUpperCase() }),
        ...(city && { city: city.trim() }),
        ...(district && { district: district.trim() }),
        ...(latitude !== undefined && { latitude: Number(latitude) }),
        ...(longitude !== undefined && { longitude: Number(longitude) }),
        ...(logo !== undefined && { logo: logo ? logo.trim() : null }),
      },
    });

    await logAdminAction(admin.id, 'UPDATE_UNIVERSITY', 'UNIVERSITY', id, { name, shortName });

    return NextResponse.json({ success: true, university: updated });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Üniversite güncellenemedi.' }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Üniversite ID zorunludur.' }, { status: 400 });
    }

    const existing = await prisma.university.findUnique({
      where: { id },
      select: { name: true, shortName: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Üniversite bulunamadı.' }, { status: 404 });
    }

    await prisma.university.delete({ where: { id } });

    await logAdminAction(admin.id, 'DELETE_UNIVERSITY', 'UNIVERSITY', id, {
      name: existing.name,
      shortName: existing.shortName,
    });

    return NextResponse.json({ success: true, message: 'Üniversite başarıyla silindi.' });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Üniversite silinemedi.' }, { status });
  }
}
