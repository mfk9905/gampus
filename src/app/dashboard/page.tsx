import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile } from '@/services/user-service';
import DashboardClient from './DashboardClient';

export const revalidate = 0;

interface DashboardPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getCurrentUser();
  if (!session) {
    redirect('/login');
  }

  const profile = await getUserProfile(session.id);
  if (!profile) {
    redirect('/login');
  }

  const { tab } = await searchParams;

  return <DashboardClient user={profile} initialTab={tab} />;
}
