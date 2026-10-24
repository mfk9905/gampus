import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getListingById } from '@/services/listing-service';
import { getAllUniversities } from '@/services/university-service';
import EditListingClient from './EditListingClient';

export const revalidate = 0;

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const session = await getCurrentUser();

  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(`/listings/${id}/edit`)}`);
  }

  const listing = await getListingById(id, session.id);
  if (!listing) {
    notFound();
  }

  const isOwner = listing.userId === session.id;
  const isAdmin = session.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    redirect(`/listings/${id}`);
  }

  const universities = await getAllUniversities();

  return <EditListingClient listing={listing} universities={universities} />;
}

