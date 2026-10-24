import { getCurrentUser } from '@/lib/auth';
import { messageBus } from '@/lib/events/message-bus';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  if (!conversationId) {
    return new Response('conversationId is required', { status: 400 });
  }

  // Authorization check (IDOR protection)
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, sellerId: true },
  });

  if (!conversation) {
    return new Response('Sohbet bulunamadı.', { status: 404 });
  }

  if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
    return new Response('Bu sohbete erişim yetkiniz yok.', { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(new TextEncoder().encode(`: connected\n\n`));

      const onNewMessage = (msg: any) => {
        try {
          const payload = JSON.stringify(msg);
          controller.enqueue(new TextEncoder().encode(`event: new-message\ndata: ${payload}\n\n`));
        } catch (e) {
          // ignore
        }
      };

      const eventName = `conversation:${conversationId}`;
      messageBus.on(eventName, onNewMessage);

      // Heartbeat ping every 20 seconds to keep connection open through proxies/mobile browsers
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20000);

      req.signal.onabort = () => {
        clearInterval(heartbeat);
        messageBus.off(eventName, onNewMessage);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

