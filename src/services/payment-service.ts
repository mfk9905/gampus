import { prisma } from '@/lib/db/prisma';
import { PREMIUM_TIERS } from '@/config/constants';

export interface ProcessPaymentParams {
  userId: string;
  listingId: string;
  durationDays: number;
}

export async function processPremiumPayment(params: ProcessPaymentParams) {
  const tier = PREMIUM_TIERS.find((t) => t.days === params.durationDays) || PREMIUM_TIERS[1];

  // 1. Create Payment Record (PENDING)
  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      listingId: params.listingId,
      type: 'PREMIUM_LISTING',
      amount: tier.price,
      currency: 'TRY',
      status: 'PENDING',
      provider: 'MOCK_PAYMENT_PROVIDER',
      providerPaymentId: `mock_pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      durationDays: tier.days,
    },
  });

  // 2. Simulate Payment Gateway Execution
  const isSuccessful = true; // Mock success

  if (isSuccessful) {
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS' },
    });

    // Calculate premiumUntil date
    const premiumUntil = new Date(Date.now() + tier.days * 24 * 60 * 60 * 1000);

    // Update listing status
    await prisma.listing.update({
      where: { id: params.listingId },
      data: {
        featured: true,
        premiumUntil,
      },
    });

    // Create Audit Log & Notification
    await prisma.analyticsEvent.create({
      data: {
        userId: params.userId,
        eventType: 'PREMIUM_PURCHASE',
        listingId: params.listingId,
        metadata: JSON.stringify({ amount: tier.price, durationDays: tier.days }),
      },
    });

    return {
      success: true,
      payment: updatedPayment,
      premiumUntil,
    };
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    return {
      success: false,
      error: 'Ödeme işlemi onaylanamadı.',
    };
  }
}
