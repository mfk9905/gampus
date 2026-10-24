import { getCurrentUser } from '@/lib/auth';
import { messageBus } from '@/lib/events/message-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Initial connection ping
      controller.enqueue(new TextEncoder().encode(`: connected\n\n`));

      const onUserEvent = (data: any) => {
        try {
          const payload = JSON.stringify(data);
          controller.enqueue(new TextEncoder().encode(`event: user-event\ndata: ${payload}\n\n`));
        } catch (e) {
          // ignore
        }
      };

      const eventName = `user:${user.id}`;
      messageBus.on(eventName, onUserEvent);

      // Heartbeat ping every 20 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20000);

      req.signal.onabort = () => {
        clearInterval(heartbeat);
        messageBus.off(eventName, onUserEvent);
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

