import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserConversations } from '@/services/chat-service';
import MessagesClient from './MessagesClient';

export const revalidate = 0;

interface MessagesPageProps {
  searchParams: Promise<{ id?: string; listingId?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await getCurrentUser();
  if (!session) {
    redirect('/login?redirect=/messages');
  }

  const { id: initialConversationId } = await searchParams;
  const initialConversations = await getUserConversations(session.id);

  return (
    <MessagesClient
      currentUser={session}
      initialConversations={initialConversations}
      initialConversationId={initialConversationId}
    />
  );
}

