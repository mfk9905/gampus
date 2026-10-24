import { PrismaClient, Role, ListingCategory, ListingStatus, Condition } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    console.error('❌ Güvenlik Uyarısı: Üretim (production) ortamında test verisi (seed) çalıştırılamaz!');
    console.error('Gerçek kullanıcı ve ilan verilerinin silinmesini önlemek için işlem durduruldu.');
    process.exit(1);
  }

  console.log('🌱 Starting UNILIVE database seeding...');

  // Clean existing data
  await prisma.report.deleteMany();
  await prisma.contactLead.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();
  await prisma.university.deleteMany();

  const seedPassword = process.env.SEED_DEFAULT_PASSWORD || '123456';
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  // 1. UNIVERSITIES
  const universitiesData = [
    {
      name: 'İstanbul Teknik Üniversitesi',
      shortName: 'İTÜ',
      city: 'İstanbul',
      district: 'Sarıyer',
      latitude: 41.1053,
      longitude: 29.0234,
      logo: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Boğaziçi Üniversitesi',
      shortName: 'BOUN',
      city: 'İstanbul',
      district: 'Sarıyer',
      latitude: 41.0847,
      longitude: 29.0510,
      logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Yıldız Teknik Üniversitesi',
      shortName: 'YTÜ',
      city: 'İstanbul',
      district: 'Esenler',
      latitude: 41.0264,
      longitude: 28.8900,
      logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'İstanbul Üniversitesi',
      shortName: 'İÜ',
      city: 'İstanbul',
      district: 'Fatih',
      latitude: 41.0128,
      longitude: 28.9644,
      logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marmara Üniversitesi',
      shortName: 'MARMARA',
      city: 'İstanbul',
      district: 'Kadıköy',
      latitude: 40.9866,
      longitude: 29.0539,
      logo: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'İstanbul Üniversitesi-Cerrahpaşa',
      shortName: 'İÜC',
      city: 'İstanbul',
      district: 'Avcılar',
      latitude: 40.9902,
      longitude: 28.7246,
      logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'İstanbul Medipol Üniversitesi',
      shortName: 'MEDİPOL',
      city: 'İstanbul',
      district: 'Beykoz',
      latitude: 41.0924,
      longitude: 29.0886,
      logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'İstanbul Bilgi Üniversitesi',
      shortName: 'BİLGİ',
      city: 'İstanbul',
      district: 'Eyüpsultan',
      latitude: 41.0673,
      longitude: 28.9460,
      logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Bahçeşehir Üniversitesi',
      shortName: 'BAU',
      city: 'İstanbul',
      district: 'Beşiktaş',
      latitude: 41.0423,
      longitude: 29.0089,
      logo: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Kadir Has Üniversitesi',
      shortName: 'KHAS',
      city: 'İstanbul',
      district: 'Fatih',
      latitude: 41.0256,
      longitude: 28.9587,
      logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const universities = [];
  for (const u of universitiesData) {
    const created = await prisma.university.create({ data: u });
    universities.push(created);
  }
  console.log(`✅ Created ${universities.length} universities.`);

  // 2. USERS
  const adminUser = await prisma.user.create({
    data: {
      name: 'UNILIVE Yönetici',
      email: 'admin@unilive.app',
      passwordHash,
      phone: '+905321002020',
      role: Role.ADMIN,
      studentVerified: true,
      phoneVerified: true,
      universityId: universities[0].id,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
  });

  const names = [
    'Ahmet Yılmaz', 'Zeynep Kaya', 'Mehmet Demir', 'Elif Şahin', 'Can Öztürk',
    'Berkay Arslan', 'Ayşe Çelik', 'Burak Doğan', 'Melisa Yıldız', 'Eren Aydın',
    'Selin Koç', 'Mert Aslan', 'İrem Güneş', 'Deniz Yüksel', 'Kaan Özkan',
    'Yağmur Kılıç', 'Kerem Yalçın', 'Defne Aksoy', 'Batuhan Polat', 'Ezgi Yavuz'
  ];

  const users = [adminUser];
  for (let i = 0; i < names.length; i++) {
    const uni = universities[i % universities.length];
    const emailName = names[i].toLowerCase().replace(/[^a-z]/g, '');
    const isEdu = i % 2 === 0;
    const email = isEdu ? `${emailName}@${uni.shortName.toLowerCase()}.edu.tr` : `${emailName}${i}@gmail.com`;

    const user = await prisma.user.create({
      data: {
        name: names[i],
        email,
        passwordHash,
        phone: `+9053${Math.floor(10000000 + Math.random() * 90000000)}`,
        universityId: uni.id,
        studentVerified: isEdu,
        phoneVerified: i % 3 !== 0,
        role: Role.USER,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + (i * 1234567) % 900000000}?w=200&auto=format&fit=crop&q=80`,
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users.`);

  // Image assets for listings
  const houseImages = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
  ];

  const roomImages = [
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80',
  ];

  const furnitureImages = [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800&auto=format&fit=crop&q=80',
  ];

  const packageImages = [
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80',
  ];

  // 3. SAMPLE LISTINGS TEMPLATES
  const listingTemplates = [
    {
      category: ListingCategory.HOUSE,
      title: "Kadıköy Moda'da Marmara'ya 10 Dk 2+1 Öğrenci Evi",
      description: "Moda'nın kalbinde, sahile ve Marmara Üniversitesi Göztepe kampüsüne minibüsle 10 dakika mesafede. Evde şu an 2 öğrenci kalmaktayız, 3. kişi veya komple kiralama opsiyonu var. Kombili, eşyalı, internetli.",
      price: 18500,
      district: "Kadıköy",
      condition: Condition.GOOD,
      images: [houseImages[0], houseImages[1]],
      uniShort: "MARMARA",
      latOffset: 0.008,
      lngOffset: -0.005,
      featured: true,
    },
    {
      category: ListingCategory.HOUSE,
      title: "İTÜ Ayazağa Kampüsüne Yürüme Mesafesinde 1+1 Daire",
      description: "Maslak 1453 yakını, İTÜ Ayazağa metrosuna 8 dakika yürüme mesafesinde. Sıfır bina, güvenlikli, asansörlü, tam eşyalı 1+1 öğrenci dairesi. Elektrik su faturaları dahil opsiyonu mevcut.",
      price: 24000,
      district: "Sarıyer",
      condition: Condition.NEW,
      images: [houseImages[2], houseImages[3]],
      uniShort: "İTÜ",
      latOffset: 0.003,
      lngOffset: 0.004,
      featured: true,
    },
    {
      category: ListingCategory.ROOMMATE,
      title: "Boğaziçi Hisarüstü'nde 3+1 Eve Kadın Ev Arkadaşı Arayanlar",
      description: "Kuzey Kampüse 5 dakika yürüme mesafesinde Hisarüstü ana cadde üstünde 3+1 daireye 3. ev arkadaşı arıyoruz. Kendi odan olacak, çalışma masası ve yatak var. Temizliğe önem veren Boğaziçili veya başka üniversiteden öğrenci öncelikli.",
      price: 8500,
      district: "Sarıyer",
      condition: Condition.GOOD,
      images: [roomImages[0], roomImages[1]],
      uniShort: "BOUN",
      latOffset: -0.002,
      lngOffset: 0.003,
      featured: true,
    },
    {
      category: ListingCategory.ROOM,
      title: "YTÜ Davutpaşa Yakınında Aydınlık Kiralık Öğrenci Odası",
      description: "Davutpaşa kampüs kapısına 2 durak mesafede. Evde 2 YTÜ Mühendislik öğrencisi kalıyor. Odanın içinde yatak, gardırop ve geniş çalışma masası mevcut. Fiber internet aktif.",
      price: 7500,
      district: "Esenler",
      condition: Condition.GOOD,
      images: [roomImages[2], houseImages[4]],
      uniShort: "YTÜ",
      latOffset: 0.005,
      lngOffset: -0.004,
      featured: true,
    },
    {
      category: ListingCategory.FURNITURE,
      title: "Temiz IKEA Çalışma Masası ve Ergonomik Ofis Koltuğu",
      description: "Mezun olduğum için satıyorum. 1 yıl kullanıldı, hiç çiziği yırtığı yok. Çalışma masası sallanmaz, koltuk amortisörlü ve bel destekli. Beşiktaş içi elden teslim.",
      price: 2200,
      district: "Beşiktaş",
      condition: Condition.GOOD,
      images: [furnitureImages[0], furnitureImages[1]],
      uniShort: "BAU",
      latOffset: 0.002,
      lngOffset: 0.001,
      featured: true,
    },
    {
      category: ListingCategory.HOUSE_PACKAGE,
      title: "Mezuniyet Sebebiyle Komple 1+1 Öğrenci Evi Eşya Paketi",
      description: "Yatak, baza, L koltuk, buzdolabı, çamaşır makinesi, çalışma masası, mikrodalga, yemek masası ve sandalyeler dahil! Hepsi bir arada toplu satış. Nakliye konusunda yardımcı olunur.",
      price: 32000,
      district: "Avcılar",
      condition: Condition.USED,
      images: [packageImages[0], packageImages[1]],
      uniShort: "İÜC",
      latOffset: 0.004,
      lngOffset: 0.006,
      featured: true,
    },
    {
      category: ListingCategory.HOUSE,
      title: "Fatih Cibali'de Kadir Has'a 3 Dk 2+1 Devren Kiralık Ev",
      description: "Kadir Has Cibali kampüsünün hemen arkasında. Haliç manzaralı, yüksek giriş 2+1 daire. Evdeki tüm eşyalar makul bir devir ücretiyle yeni öğrenciye devredilecektir.",
      price: 19500,
      district: "Fatih",
      condition: Condition.GOOD,
      images: [houseImages[1], houseImages[3]],
      uniShort: "KHAS",
      latOffset: -0.003,
      lngOffset: 0.002,
      featured: false,
    },
    {
      category: ListingCategory.ROOMMATE,
      title: "Eyüpsultan Santralistanbul (Bilgi Üni) Yanı Erkek Ev Arkadaşı",
      description: "Bilgi Üniversitesi Santral kampüsüne yürüme 7 dakika. Ev 2+1, salon ortak kullanım. Sigara kullanmayan, düzenli ev arkadaşı arıyoruz.",
      price: 9000,
      district: "Eyüpsultan",
      condition: Condition.GOOD,
      images: [roomImages[1], roomImages[2]],
      uniShort: "BİLGİ",
      latOffset: 0.004,
      lngOffset: -0.002,
      featured: false,
    },
    {
      category: ListingCategory.FURNITURE,
      title: "Arçelik A++ Çamaşır Makinesi 7 Kg - Çok Temiz",
      description: "2 yıllık sorunsuz çamaşır makinesi. Bakımları yapılmış, sessiz motorlu. Kavacık / Beykoz Medipol Kampüsü yakınından teslim alınabilir.",
      price: 4500,
      district: "Beykoz",
      condition: Condition.GOOD,
      images: [furnitureImages[2]],
      uniShort: "MEDİPOL",
      latOffset: 0.005,
      lngOffset: 0.003,
      featured: false,
    },
    {
      category: ListingCategory.HOUSE,
      title: "Beşiktaş Akaretler'de BAU'ya 5 Dk Lüx 1+1 Daire",
      description: "Bahçeşehir Üniversitesi Beşiktaş kampüsüne adım mesafesinde. Starbucks, otobüs durakları ve sahile 2 dakika. Eşyalar yeni, klimalı ve güvenlik kameralı.",
      price: 28000,
      district: "Beşiktaş",
      condition: Condition.NEW,
      images: [houseImages[0], houseImages[2]],
      uniShort: "BAU",
      latOffset: 0.001,
      lngOffset: 0.002,
      featured: true,
    },
    {
      category: ListingCategory.FURNITURE,
      title: "Beko Buzdolabı (Öğrenci Dostu AZ Enerji)",
      description: "Soğutmasında hiçbir problem yok. Öğrenci evimize yeni buzdolabı aldığımız için boşa çıktı. İÜ Beyazıt kampüsü civarında.",
      price: 3800,
      district: "Fatih",
      condition: Condition.USED,
      images: [furnitureImages[3]],
      uniShort: "İÜ",
      latOffset: -0.004,
      lngOffset: 0.003,
      featured: false,
    },
    {
      category: ListingCategory.ROOM,
      title: "Avcılar Merkez'de İÜC Kampüsüne Yürüme 5 Dk Mobilyalı Oda",
      description: "Metrobüs durağına 3 dakika, İÜC Avcılar kampüsüne 5 dakika. Odamız güneye bakıyor, ferah. Tüm mutfak eşyaları ve çamaşır makinesi ortak kullanımda.",
      price: 6800,
      district: "Avcılar",
      condition: Condition.GOOD,
      images: [roomImages[0], houseImages[4]],
      uniShort: "İÜC",
      latOffset: -0.002,
      lngOffset: 0.005,
      featured: false,
    },
  ];

  // Expand templates to create 52 distinct realistic listings
  let totalListings = 0;
  for (let i = 0; i < 52; i++) {
    const tmpl = listingTemplates[i % listingTemplates.length];
    const user = users[(i + 1) % users.length];
    const uni = universities.find(u => u.shortName === tmpl.uniShort) || universities[i % universities.length];

    // Variations in title & price to make all 52 unique
    const catTitles: Record<string, string[]> = {
      HOUSE: [
        `Kiralık ${i % 2 === 0 ? '2+1' : '1+1'} Öğrenci Evi - ${uni.shortName} Yakını`,
        `${uni.district}'de Kampüse Yürüme Mesafesinde Masrafsız Eşyalı Daire`,
        `Mezuniyet Sebebiyle Devren Kiralık ${i % 2 === 0 ? '3+1' : '2+1'} Ev`,
        `Metro ve Otobüse 2 Dk ${uni.shortName} Öğrencisine Uygun Daire`,
      ],
      ROOM: [
        `Ferah Kiralık Öğrenci Odası - ${uni.shortName} Çevresi`,
        `Kombili Evde Özel Banyolu/Balkonlu Kiralık Oda`,
        `Faturalar Dahil Masrafsız Temiz Öğrenci Odası`,
      ],
      ROOMMATE: [
        `${uni.shortName}'li Öğrencilerin Yanına Ev Arkadaşı Arayanlar`,
        `${uni.district}'de 2+1 Eve Uyumlu Ev Arkadaşı`,
        `Sakin ve Düzenli Ev Arkadaşı Arıyoruz - ${uni.shortName} Yanı`,
      ],
      FURNITURE: [
        `Öğrenciden Temiz Kiralık/Satılık Eşya (${i % 2 === 0 ? 'Masa + Sandalye' : 'Koltuk Takımı'})`,
        `İkinci El Az Kullanılmış Ev Eşyası - ${uni.district}`,
        `Öğrenci Bütçesine Uygun Çekyat / Gardırop`,
      ],
      HOUSE_PACKAGE: [
        `Komple Ev Devri ve Eşya Paketi (${uni.shortName} Öğrencisinden)`,
        `Taşınma Sebebiyle Tüm Ev Eşyaları Set Halinde`,
      ],
    };

    const titleList = catTitles[tmpl.category] || catTitles.HOUSE;
    const title = `${titleList[i % titleList.length]} #${i + 1}`;
    const priceVariance = (i % 5) * 500 - 1000;
    const price = Math.max(1200, tmpl.price + priceVariance);

    const listing = await prisma.listing.create({
      data: {
        userId: user.id,
        universityId: uni.id,
        category: tmpl.category,
        title,
        description: `${tmpl.description}\n\nİletişim için WhatsApp üzerinden hemen yazabilirsiniz. İlan günceldir.`,
        price,
        locationText: `${uni.district}, İstanbul (Kampüse yakl. ${(0.3 + (i % 7) * 0.4).toFixed(1)} km)`,
        district: uni.district,
        latitude: uni.latitude + (tmpl.latOffset || 0.002) + (i % 4) * 0.001 - 0.002,
        longitude: uni.longitude + (tmpl.lngOffset || 0.002) + (i % 3) * 0.001 - 0.001,
        condition: tmpl.condition,
        status: i % 15 === 0 ? ListingStatus.SOLD : (i % 20 === 0 ? ListingStatus.RENTED : ListingStatus.ACTIVE),
        featured: tmpl.featured || i % 6 === 0,
        images: {
          create: tmpl.images.map((imgUrl, idx) => ({
            url: imgUrl,
            sortOrder: idx,
          })),
        },
      },
    });

    // Add some random favorites
    if (i % 3 === 0) {
      const favUser = users[(i + 3) % users.length];
      await prisma.favorite.create({
        data: {
          userId: favUser.id,
          listingId: listing.id,
        },
      }).catch(() => {});
    }

    // Add some lead contacts
    if (i % 4 === 0) {
      await prisma.contactLead.create({
        data: {
          listingId: listing.id,
          viewerUserId: users[(i + 2) % users.length].id,
          contactType: i % 2 === 0 ? 'MESSAGE' : 'PHONE',
        },
      });
    }

    totalListings++;
  }

  // 4. SEED SAMPLE CHAT CONVERSATIONS
  const sampleListing = await prisma.listing.findFirst();
  if (sampleListing && users.length >= 3) {
    const buyer = users[1];
    const seller = users.find((u) => u.id === sampleListing.userId) || users[2];

    if (buyer.id !== seller.id) {
      const conv = await prisma.conversation.create({
        data: {
          listingId: sampleListing.id,
          buyerId: buyer.id,
          sellerId: seller.id,
          lastMessageText: 'Yarın öğleden sonra kampüste buluşup görebilir miyiz?',
          lastMessageAt: new Date(),
          buyerUnreadCount: 0,
          sellerUnreadCount: 1,
        },
      });

      await prisma.message.createMany({
        data: [
          {
            conversationId: conv.id,
            senderId: buyer.id,
            receiverId: seller.id,
            text: 'Merhaba, ilanınızı gördüm. Hala müsait mi?',
            isRead: true,
            createdAt: new Date(Date.now() - 3600000),
          },
          {
            conversationId: conv.id,
            senderId: seller.id,
            receiverId: buyer.id,
            text: 'Merhaba! Evet hala müsait, hangi üniversitede okuyorsunuz?',
            isRead: true,
            createdAt: new Date(Date.now() - 1800000),
          },
          {
            conversationId: conv.id,
            senderId: buyer.id,
            receiverId: seller.id,
            text: 'Yarın öğleden sonra kampüste buluşup görebilir miyiz?',
            isRead: false,
            createdAt: new Date(Date.now() - 300000),
          },
        ],
      });
      console.log('✅ Created sample in-app conversation with messages.');
    }
  }

  console.log(`✅ Created ${totalListings} realistic student listings with photos, favorites, and leads.`);
  console.log('🎉 UNILIVE Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
