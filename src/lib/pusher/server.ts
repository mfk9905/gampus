import Pusher from 'pusher';

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER || 'eu';

export const pusherServer: Pusher | null =
  appId && key && secret
    ? new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      })
    : null;

/**
 * Triggers a real-time event through Pusher if configured.
 * Safely ignores if Pusher is not configured.
 */
export async function triggerChatEvent(channel: string, event: string, data: any) {
  if (!pusherServer) {
    return false;
  }
  try {
    await pusherServer.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error('[Pusher Error]', error);
    return false;
  }
}

