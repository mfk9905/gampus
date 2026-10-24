import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 [GAMPÜS] Test verilerini temizleme işlemi başlatılıyor...\n');

  try {
    // 1. Identify test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { endsWith: '@gampus.test' } },
          { name: { contains: '[TEST]' } },
        ],
      },
      select: { id: true, email: true, name: true },
    });

    const testUserIds = testUsers.map((u) => u.id);
    console.log(`🔍 Tespit edilen test kullanıcısı: ${testUsers.length}`);

    // 2. Identify test listings
    const testListings = await prisma.listing.findMany({
      where: {
        OR: [
          { title: { startsWith: '[TEST' } },
          { userId: { in: testUserIds } },
        ],
      },
      select: { id: true, title: true },
    });

    const testListingIds = testListings.map((l) => l.id);
    console.log(`🔍 Tespit edilen test ilanı: ${testListings.length}\n`);

    if (testListingIds.length > 0) {
      // Delete child relations of test listings
      const delImages = await prisma.listingImage.deleteMany({
        where: { listingId: { in: testListingIds } },
      });
      const delFavorites = await prisma.favorite.deleteMany({
        where: { listingId: { in: testListingIds } },
      });
      const delLeads = await prisma.contactLead.deleteMany({
        where: { listingId: { in: testListingIds } },
      });
      const delConvs = await prisma.conversation.deleteMany({
        where: { listingId: { in: testListingIds } },
      });

      // Delete the listings themselves
      const delListings = await prisma.listing.deleteMany({
        where: { id: { in: testListingIds } },
      });

      console.log(`✅ ${delListings.count} adet test ilanı silindi.`);
      console.log(`   (İlişkili ${delImages.count} görsel, ${delFavorites.count} favori, ${delLeads.count} talep, ${delConvs.count} sohbet temizlendi)`);
    }

    if (testUserIds.length > 0) {
      // Delete any remaining messages, reviews, blocks involving test users
      await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: { in: testUserIds } },
            { receiverId: { in: testUserIds } },
          ],
        },
      });
      await prisma.review.deleteMany({
        where: {
          OR: [
            { reviewerId: { in: testUserIds } },
            { reviewedUserId: { in: testUserIds } },
          ],
        },
      });
      await prisma.userBlock.deleteMany({
        where: {
          OR: [
            { blockerId: { in: testUserIds } },
            { blockedId: { in: testUserIds } },
          ],
        },
      });
      await prisma.notification.deleteMany({
        where: { userId: { in: testUserIds } },
      });

      // Delete the test users
      const delUsers = await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
      console.log(`✅ ${delUsers.count} adet test kullanıcısı silindi.`);
    }

    // Report preserved data
    const remainingUsers = await prisma.user.count();
    const remainingListings = await prisma.listing.count();
    const totalUniversities = await prisma.university.count();

    console.log('\n----------------------------------------------');
    console.log('🛡️ KORUNAN GERÇEK VERİLER:');
    console.log(`   🏛️ Üniversite Sayısı: ${totalUniversities} (Hiçbiri silinmedi)`);
    console.log(`   👤 Kalan Kullanıcı: ${remainingUsers} (Gerçek kullanıcılar korundu)`);
    console.log(`   📦 Kalan İlan: ${remainingListings} (Gerçek ilanlar korundu)`);
    console.log('----------------------------------------------');
    console.log('✨ Test verisi temizliği başarıyla tamamlandı!\n');
  } catch (error) {
    console.error('❌ Temizleme sırasında hata oluştu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();
