import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile } from '@/services/user-service';
import ProfileClient from './ProfileClient';

export const revalidate = 0;

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect('/login');
  }

  const profile = await getUserProfile(session.id);
  if (!profile) {
    redirect('/login');
  }

  return <ProfileClient user={profile} />;
}
