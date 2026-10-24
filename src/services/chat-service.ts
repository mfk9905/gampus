import { prisma } from '@/lib/db/prisma';
import { validateChatMessage } from './chat-moderation-service';
import { triggerChatEvent } from '@/lib/pusher/server';
import { messageBus } from '@/lib/events/message-bus';

/**
 * Checks if there is an active block between two users in either direction.
 */
export async function checkBlockStatus(userAId: string, userBId: string) {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });

  return {
    isBlocked: !!block,
    blockedByMe: block?.blockerId === userAId,
    blockedByUser: block?.blockerId === userBId,
  };
}

/**
 * Finds or initiates a conversation for a specific listing between buyer and seller.
 */
export async function getOrCreateConversation(listingId: string, buyerId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, studentVerified: true },
      },
      images: {
        take: 1,
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!listing) {
    throw new Error('İlan bulunamadı.');
  }

  if (listing.userId === buyerId) {
    throw new Error('Kendi ilanınıza mesaj gönderemezsiniz.');
  }

  const sellerId = listing.userId;

  // Check if blocked
  const blockStatus = await checkBlockStatus(buyerId, sellerId);
  if (blockStatus.isBlocked) {
    throw new Error('Engelleme nedeniyle bu kullanıcıyla sohbet başlatılamaz.');
  }

  // Find existing conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      listingId_buyerId: {
        listingId,
        buyerId,
      },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          locationText: true,
          status: true,
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
      },
      buyer: {
        select: { id: true, name: true, avatar: true, studentVerified: true },
      },
      seller: {
        select: { id: true, name: true, avatar: true, studentVerified: true },
      },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        listingId,
        buyerId,
        sellerId,
        lastMessageText: null,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            locationText: true,
            status: true,
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
        buyer: {
          select: { id: true, name: true, avatar: true, studentVerified: true },
        },
        seller: {
          select: { id: true, name: true, avatar: true, studentVerified: true },
        },
      },
    });
  }

  return conversation;
}

/**
 * Returns all conversations for a user (both as buyer and seller).
 */
export async function getUserConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          status: true,
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
      },
      buyer: {
        select: { id: true, name: true, avatar: true, studentVerified: true },
      },
      seller: {
        select: { id: true, name: true, avatar: true, studentVerified: true },
      },
    },
  });

  // Get exact unread counts per conversation for current user directly from messages table
  const unreadCounts = await prisma.message.groupBy({
    by: ['conversationId'],
    where: {
      receiverId: userId,
      isRead: false,
    },
    _count: {
      id: true,
    },
  });

  const unreadMap = new Map<string, number>();
  for (const item of unreadCounts) {
    unreadMap.set(item.conversationId, item._count.id);
  }

  // Attach otherUser and block status for each conversation
  const mapped = await Promise.all(
    conversations.map(async (conv) => {
      const isBuyer = conv.buyerId === userId;
      const otherUser = isBuyer ? conv.seller : conv.buyer;
      const unreadCount = unreadMap.get(conv.id) || 0;
      const blockStatus = await checkBlockStatus(userId, otherUser.id);

      return {
        id: conv.id,
        listingId: conv.listingId,
        listing: conv.listing,
        otherUser,
        unreadCount,
        lastMessageText: conv.lastMessageText,
        lastMessageAt: conv.lastMessageAt,
        isBlocked: blockStatus.isBlocked,
        blockedByMe: blockStatus.blockedByMe,
      };
    })
  );

  return mapped;
}

/**
 * Gets message history of a conversation and marks messages as read for the viewing user.
 */
export async function getConversationMessages(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          locationText: true,
          status: true,
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
      },
      buyer: {
        select: { id: true, name: true, avatar: true, studentVerified: true },
      },
      seller: {
        select: { id: true, name: true, avatar: true, studentVerified: true },
      },
    },
  });

  if (!conversation) {
    throw new Error('Sohbet bulunamadı.');
  }

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new Error('Bu sohbete erişim yetkiniz yok.');
  }

  const isBuyer = conversation.buyerId === userId;
  const otherUser = isBuyer ? conversation.seller : conversation.buyer;

  // Mark unread messages directed to current user as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      receiverId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  // Mark related in-app notifications as read for this conversation
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        OR: [
          { link: `/messages?id=${conversationId}` },
          { link: `/messages?conversationId=${conversationId}` },
          { link: { contains: conversationId } },
        ],
      },
      data: {
        isRead: true,
      },
    });
  } catch (err) {
    // Non-fatal
  }

  // Reset unread count for current user unconditionally
  try {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: isBuyer ? { buyerUnreadCount: 0 } : { sellerUnreadCount: 0 },
    });
  } catch (err) {
    // Non-fatal
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      text: true,
      isRead: true,
      createdAt: true,
    },
  });

  const blockStatus = await checkBlockStatus(userId, otherUser.id);

  return {
    conversation: {
      id: conversation.id,
      listingId: conversation.listingId,
      listing: conversation.listing,
      otherUser,
      isBuyer,
      blockStatus,
    },
    messages,
  };
}

/**
 * Sends a message within a conversation.
 * Performs real-time moderation, anti-fraud checks, block checks, and updates unread counts.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string) {
  // 1. Content moderation
  const moderation = validateChatMessage(text);
  if (!moderation.isValid) {
    throw new Error(moderation.reason || 'Mesajınız güvenlik kurallarına uymadığı için gönderilemedi.');
  }

  // 2. Conversation validation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { title: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  if (!conversation) {
    throw new Error('Sohbet bulunamadı.');
  }

  if (conversation.buyerId !== senderId && conversation.sellerId !== senderId) {
    throw new Error('Bu sohbete mesaj gönderme yetkiniz yok.');
  }

  const receiverId = conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId;
  const senderName = conversation.buyerId === senderId ? conversation.buyer.name : conversation.seller.name;

  // 3. Block check
  const blockStatus = await checkBlockStatus(senderId, receiverId);
  if (blockStatus.isBlocked) {
    if (blockStatus.blockedByMe) {
      throw new Error('Bu kullanıcıyı engellediğiniz için mesaj gönderemezsiniz. Engeli kaldırmanız gerekmektedir.');
    } else {
      throw new Error('Bu kullanıcı tarafından engellendiğiniz için mesaj gönderemezsiniz.');
    }
  }

  // 4. Create message & update conversation in transaction
  const isSenderBuyer = conversation.buyerId === senderId;

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        text: text.trim(),
        isRead: false,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: text.trim().substring(0, 120),
        lastMessageAt: new Date(),
        // Increment receiver's unread count
        ...(isSenderBuyer
          ? { sellerUnreadCount: { increment: 1 } }
          : { buyerUnreadCount: { increment: 1 } }),
      },
    }),
  ]);

  // 6. Real-time push (Server-Sent Events / in-memory bus + Pusher fallback)
  const payload = {
    id: message.id,
    conversationId,
    senderId,
    receiverId,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };

  // Direct realtime emit (0ms latency, zero cloud dependency)
  messageBus.emit(`conversation:${conversationId}`, payload);
  messageBus.emit(`user:${receiverId}`, {
    type: 'MESSAGE',
    id: message.id,
    senderId,
    receiverId,
    conversationId,
    senderName,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  });

  // Also trigger external Pusher if keys are configured
  await triggerChatEvent(`conversation-${conversationId}`, 'new-message', payload);
  await triggerChatEvent(`user-${receiverId}`, 'new-notification', {
    type: 'MESSAGE',
    id: message.id,
    senderId,
    receiverId,
    conversationId,
    senderName,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  });

  return message;
}

/**
 * Blocks a user.
 */
export async function blockUser(blockerId: string, blockedId: string, reason?: string) {
  if (blockerId === blockedId) {
    throw new Error('Kendinizi engelleyemezsiniz.');
  }

  return await prisma.userBlock.upsert({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
    create: {
      blockerId,
      blockedId,
      reason: reason || null,
    },
    update: {
      reason: reason || null,
    },
  });
}

/**
 * Unblocks a user.
 */
export async function unblockUser(blockerId: string, blockedId: string) {
  return await prisma.userBlock.deleteMany({
    where: {
      blockerId,
      blockedId,
    },
  });
}

/**
 * Reports a conversation, capturing recent messages as evidence for admins.
 */
export async function reportConversation(
  reporterId: string,
  conversationId: string,
  reason: string,
  description?: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { name: true } } },
      },
    },
  });

  if (!conversation) {
    throw new Error('Sohbet bulunamadı.');
  }

  const reportedUserId = conversation.buyerId === reporterId ? conversation.sellerId : conversation.buyerId;

  // Format recent chat messages as evidence excerpt
  const chatExcerpt = conversation.messages
    .reverse()
    .map(
      (m) =>
        `[${new Date(m.createdAt).toLocaleTimeString('tr-TR')}] ${m.sender.name}: ${m.text}`
    )
    .join('\n');

  return await prisma.report.create({
    data: {
      listingId: conversation.listingId,
      conversationId: conversation.id,
      reporterUserId: reporterId,
      reportedUserId,
      reason,
      description: description || null,
      chatExcerpt,
      status: 'PENDING',
    },
  });
}

/**
 * Explicitly marks all messages in a conversation as read for the user.
 */
export async function markConversationAsRead(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, buyerId: true, sellerId: true },
  });

  if (!conversation) return;
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) return;

  const isBuyer = conversation.buyerId === userId;

  await prisma.$transaction([
    prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: isBuyer ? { buyerUnreadCount: 0 } : { sellerUnreadCount: 0 },
    }),
  ]);

  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        OR: [
          { link: `/messages?id=${conversationId}` },
          { link: `/messages?conversationId=${conversationId}` },
          { link: { contains: conversationId } },
        ],
      },
      data: {
        isRead: true,
      },
    });
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Calculates total unread chat messages for a user across all conversations.
 * Uses exact message count where receiver is user and isRead is false.
 */
export async function getUnreadMessagesCount(userId: string): Promise<number> {
  return await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false,
    },
  });
}

