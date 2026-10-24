import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateRoommateMatch } from '@/services/matchmaking-service';
import { roommateProfileSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId') || undefined;

    // Get current user's profile if logged in
    let myProfile = null;
    if (user) {
      myProfile = await prisma.roommateProfile.findUnique({
        where: { userId: user.id },
      });
    }

    const profiles = await prisma.roommateProfile.findMany({
      where: universityId ? { universityId } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            allowPhoneCalls: true,
            studentVerified: true,
            university: true,
          },
        },
      },
      take: 30,
    });

    const candidates = profiles
      .filter((p) => !user || p.userId !== user.id)
      .map((p) => {
        const match = myProfile ? calculateRoommateMatch(myProfile, p) : { matchPercentage: 85, details: ['Kampüs yaşam tarzı uyumlu'] };
        // Privacy protection: only expose phone if user explicitly allows phone calls
        const userSanitized = {
          ...p.user,
          phone: p.user.allowPhoneCalls ? p.user.phone : null,
        };

        return {
          ...p,
          user: userSanitized,
          match,
        };
      })
      .sort((a, b) => b.match.matchPercentage - a.match.matchPercentage);

    return NextResponse.json({ candidates, myProfile });
  } catch (error) {
    return NextResponse.json({ error: 'Ev arkadaşı profilleri getirilemedi.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Lütfen önce giriş yapınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `roommate:${user.id}:${ip}`,
      limit: 15,
      windowSeconds: 300,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok fazla istek yapıldı. Lütfen biraz bekleyiniz.' }, { status: 429 });
    }

    const body = await req.json();
    const result = roommateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    const profile = await prisma.roommateProfile.upsert({
      where: { userId: user.id },
      update: {
        universityId: data.universityId || user.universityId || null,
        budget: data.budget || null,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
        sleepSchedule: data.sleepSchedule || null,
        cleanliness: data.cleanliness || null,
        smoking: data.smoking || null,
        pets: data.pets || null,
        socialStyle: data.socialStyle || null,
        studyHabits: data.studyHabits || null,
        bio: data.bio || null,
      },
      create: {
        userId: user.id,
        universityId: data.universityId || user.universityId || null,
        budget: data.budget || null,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
        sleepSchedule: data.sleepSchedule || null,
        cleanliness: data.cleanliness || null,
        smoking: data.smoking || null,
        pets: data.pets || null,
        socialStyle: data.socialStyle || null,
        studyHabits: data.studyHabits || null,
        bio: data.bio || null,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Roommate profile save error:', error);
    return NextResponse.json({ error: 'Profil kaydedilemedi.' }, { status: 500 });
  }
}
