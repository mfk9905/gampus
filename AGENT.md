# 🤖 AGENT.md — GAMPÜS AI Ajan & Geliştirici Kılavuzu

> **Bu belge, GAMPÜS projesinde görev alacak tüm yapay zeka ajanları (ve geliştiriciler) için tek yetkili operasyonel, mimari ve kural kılavuzudur.**  
> Projede kod yazmadan veya değişiklik yapmadan önce bu belgedeki kuralları, mimari kararları ve iş mantığını eksiksiz kavrayınız.

---

## 1. 📌 Proje Özeti ve Temel Vizyon

- **Proje Adı:** GAMPÜS (Gampüs)
- **Slogan:** *"Öğrenciden Öğrenciye Güvenli Kampüs Pazaryeri"*
- **Amaç:** Üniversite öğrencilerinin kiralık ev, oda, ev arkadaşı bulmasını ve 2. el eşyalarını (mobilya, beyaz eşya, kitap) komisyonsuz, aracısız ve güvenli bir şekilde birbirlerine aktarmasını sağlayan doğrulanmış kampüs platformu.
- **Hedef Kitle:** Türkiye'deki üniversite öğrencileri (`.edu.tr` doğrulamalı).
- **Dil Politikası:** **%100 Türkçe**. Arayüzde, bildirimlerde, hata mesajlarında ve durum etiketlerinde ham İngilizce enum/terim (`HOUSE`, `PENDING`, `Dashboard`, `ACTIVE` vb.) kesinlikle kullanıcıya gösterilmez; her zaman Türkçe eşlemeleri (`CATEGORY_LABELS`, `STATUS_LABELS`) kullanılır.

---

## 2. 🛠️ Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Kütüphane | Detay |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | React 19, Server & Client Components, Route Handlers |
| **Dil** | TypeScript (Strict Mode) | Tip güvenliği zorunludur; `any` kullanımından kaçının |
| **Stil / UI** | Tailwind CSS + Lucide Icons | Responsive, mobile-first, özel scrollbar ve modern arayüz |
| **Veritabanı & ORM** | PostgreSQL + Prisma ORM | CUID birincil anahtarlar, ilişkisel indeksler, cascade silmeler |
| **Kimlik Doğrulama** | JWT (`jose`), HTTP-only Cookies | `jwt_token` çerezi, `bcryptjs` parola hashleme, Role (`USER`, `ADMIN`) |
| **Gerçek Zamanlı İletişim**| SSE (Server-Sent Events) | In-memory `messageBus` (0ms gecikme), opsiyonel Pusher fallback |
| **Ses Bildirimleri** | Web Audio API Synthesizer | Harici MP3 dosyası indirmeden tarayıcıda dinamik chime melodisi |
| **Medya Yükleme** | Cloudinary API | Bellek içi stream ile güvenli görsel yükleme (max 10 görsel / ilan) |
| **İçerik Moderasyonu** | Regex & Fraud Filtreleme | IBAN, harici telefon, kapora dolandırıcılığı engelleme motoru |

---

## 3. ⚙️ Geliştirme Ortamı & Önemli Çalıştırma Komutları

### 🔑 Ortam Değişkenleri (`.env`)
```env
DATABASE_URL="postgresql://postgres:Naber3545@127.0.0.1:5432/unilive?schema=public"
DIRECT_URL="postgresql://postgres:Naber3545@127.0.0.1:5432/unilive?schema=public"
JWT_SECRET="unilive_super_secret_jwt_key_2026_dev_mode"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### ⚡ Kritik Terminal & Sandbox Kuralları (Önemli!)
1. **PostgreSQL ve Ağ Erişimi:**  
   PostgreSQL veritabanına bağlanırken veya dev server başlatırken yerel ağ/soket erişimi gerektiğinden terminal araçlarında gerekirse `BypassSandbox: true` parametresi kullanılır.
2. **Prisma Komutları:**
   - Şema senkronizasyonu: `npx prisma db push`
   - Test verisi yükleme: `npx prisma db seed` (10 üniversite, 21 kullanıcı, 52 ilan oluşturur)
   - Prisma Client derleme: `npx prisma generate`
3. **Derleme & Tip Kontrolü:**
   - Her geliştirme sonrası mutlaka tip kontrolü çalıştırılmalıdır:  
     `npx tsc --noEmit`
4. **Geliştirici Sunucusu:**
   - `npm run dev` (Turbopack destekli Next.js sunucusu, `http://localhost:3000`)

---

## 4. 📂 Proje Dizin Yapısı

```text
src/
├── app/                                # Next.js App Router sayfaları ve API uçları
│   ├── page.tsx                        # Ana sayfa (Hero, Kampüs Seçici, Kategoriler, Öne Çıkanlar)
│   ├── explore/                        # Keşfet & Arama (Filtreleme, Sıralama, Kampüs İlanları)
│   ├── create-listing/                 # 4 Adımlı İlan Verme Sihirbazı (Erken Giriş Korumalı)
│   ├── listings/[id]/                  # İlan Detayı (Galeri, Kampüs Mesafesi, Güvenli İletişim)
│   ├── messages/                       # Anlık Mesajlaşma (SSE Gerçek Zamanlı Sohbet, Mobil Uyumlu)
│   ├── dashboard/                      # Kullanıcı Paneli (İlanlarım, Favoriler, Gelen Talepler)
│   ├── profile/                        # Profil Ayarları (.edu.tr Doğrulama, Kayıtlı Aramalar)
│   ├── admin/                          # Yönetici Paneli (Şikayetler, Doğrulamalar, İlan Moderasyonu)
│   ├── login/ & register/              # Giriş ve Öğrenci Kayıt Sayfaları
│   └── api/                            # Route Handlers
│       ├── auth/                       # Giriş, çıkış, kayıt, me, .edu.tr öğrenci doğrulama
│       ├── listings/                   # İlan CRUD, favorilere ekleme
│       ├── messages/                   # Mesaj gönderme, engelleme, şikayet, SSE stream (/stream)
│       ├── notifications/              # Sistem bildirimleri ve SSE stream (/stream)
│       ├── upload/                     # Cloudinary görsel yükleme
│       └── admin/                      # İstatistikler, kullanıcı/ilan yönetimi
├── components/                         # Yeniden kullanılabilir React bileşenleri
│   ├── navbar/Navbar.tsx               # Üst gezinme çubuğu + Bildirim Merkezi + Mesaj Butonu + Mobil Alt Bar
│   ├── footer/Footer.tsx               # Modern, sadeleştirilmiş footer
│   ├── listing/                        # ListingCard.tsx, ListingGrid.tsx
│   ├── filters/ExploreFilters.tsx      # Kategori, fiyat, üniversite, durum filtreleri
│   ├── campus/CampusSelector.tsx       # Kampüs seçici açılır menü
│   └── report/ReportModal.tsx          # Güvenlik ve dolandırıcılık bildirim modalı
├── services/                           # İş mantığı ve veritabanı operasyonları
│   ├── chat-service.ts                 # Mesajlaşma, okundu takibi, engelleme, sayaç hesaplama
│   ├── chat-moderation-service.ts      # Sohbet içi güvenlik (IBAN, numara engeli)
│   ├── listing-service.ts              # İlan listeleme, mesafe hesaplama, filtreleme
│   ├── moderation-service.ts           # İlan metin moderasyonu ve risk puanlama
│   ├── notification-service.ts         # Sistem bildirimleri oluşturma
│   ├── report-service.ts               # Şikayet yönetimi ve admin istatistikleri
│   └── university-service.ts           # Üniversite koordinat ve kampüs verileri
├── lib/                                # Yardımcı fonksiyonlar ve altyapı
│   ├── audio/sound.ts                  # Web Audio bildirim sesi motoru
│   ├── events/message-bus.ts           # Bellek içi SSE yayın veri yolu
│   ├── auth/                           # JWT token yönetimi ve oturum çözücü
│   ├── db/prisma.ts                    # Prisma singleton istemcisi
│   ├── rate-limit/                     # Hız sınırlama (Rate Limiting) mekanizması
│   └── utils/distance.ts               # Haversine kampüs mesafesi formülü
└── prisma/
    ├── schema.prisma                   # Veritabanı modelleri ve ilişkiler
    └── seed.ts                         # Zengin demo verisi tohumlayıcı
```

---

## 5. 🧱 Veritabanı Modelleri & Kritik İlişkiler

1. **`User`**: Kullanıcı hesabı. `role` (`USER` / `ADMIN`), `studentVerified` (.edu.tr onayı), `phoneVerified`, `allowPhoneCalls`.
2. **`University`**: Kampüsler. `name`, `shortName`, `city`, `district`, `latitude`, `longitude`.
3. **`Listing`**: İlanlar. `category` (`HOUSE`, `ROOM`, `ROOMMATE`, `FURNITURE`, `HOUSE_PACKAGE`), `price`, `status` (`ACTIVE`, `SOLD`, `RENTED`, `PASSIVE`), koordinatlar.
4. **`Conversation` & `Message`**: İki kullanıcı arasındaki sohbet. `buyerId`, `sellerId`, `listingId`. Her mesaj `senderId`, `receiverId`, `text`, `isRead`.
5. **`Notification`**: Sistem bildirimleri. `type` (`INFO`, `VERIFICATION`, `SYSTEM`). **Önemli:** Chat mesajları genel notification tablosuna yazılmaz!
6. **`UserBlock`**: Karşılıklı kullanıcı engelleme (`blockerId`, `blockedId`).
7. **`Report`**: Dolandırıcılık veya kural ihlali şikayetleri (`chatExcerpt` içerebilir).

---

## 6. 🚨 Kritik İş Mantığı & Değişmez Kurallar (Invariants)

Yeni bir özellik eklerken veya hata düzeltirken **ASLA** aşağıdaki kuralları çiğnemeyiniz:

### 🚫 Kural 1: "Ev Devri" (HOUSE_HANDOVER) Kaldırılmıştır
- Platformdan "Ev Devri" seçeneği bilinçli olarak temizlenmiştir.
- Navigation, filtreler, arama seçenekleri veya formlara **Ev Devri (HOUSE_HANDOVER)** tekrar **eklenmemelidir**.
- İzin verilen kategoriler:
  1. `HOUSE` (Kiralık Ev)
  2. `ROOM` (Kiralık Oda)
  3. `ROOMMATE` (Ev Arkadaşı)
  4. `FURNITURE` (İkinci El Eşya)
  5. `HOUSE_PACKAGE` (Ev Paketi)

### 💬 Kural 2: Mesaj Okundu Durumu ve Sayaç Tutarlılığı
- **Sayaç Hesabı:** Toplam okunmamış mesaj sayısı **daima** doğrudan `prisma.message.count({ where: { receiverId: userId, isRead: false } })` ile hesaplanmalıdır. Ara sayaç alanlarındaki tutarsızlıklar bu sayede önlenir.
- **Sohbete Girildiğinde:** Kullanıcı bir sohbete girdiği anda (`getConversationMessages` veya `PATCH /api/messages/conversations/[id]`), o sohbette kendisine ait tüm mesajlar anında `isRead: true` yapılır.
- **Aktif Sohbet Anında Mesaj Alma:** Kullanıcı o an açık olan sohbetteyken gelen yeni SSE mesajları anında `PATCH` ile okundu yapılır; böylece kullanıcı sohbette yazışırken bildirim sayacı sabit kalmaz veya artmaz.
- **Etkinlik Tetikleme:** Mesaj okundu durumu her değiştiğinde `window.dispatchEvent(new CustomEvent('unilive:refresh-unread'))` tetiklenerek Navbar'daki sayaç anında güncellenir.

### 🔔 Kural 3: Mesajlar ile Sistem Bildirimleri Ayrıdır
- Sohbet mesajları **asla** `Notification` tablosuna `CHAT_MESSAGE` olarak kaydedilmez.
- Navbar'daki **Zil İkonu (Bell)** yalnızca sistem bildirimlerini (.edu.tr onayı, ilan durumu vb.) gösterir.
- **Mesaj İkonu (MessageSquare)** yalnızca okunmamış özel mesaj sayısını gösterir.

### 🛡️ Kural 4: Sohbet Güvenliği ve Anti-Fraud Koruması
- Mesaj gönderilirken `validateChatMessage` fonksiyonu çalışır:
  - IBAN, kredi kartı numaraları, şüpheli kapora talepleri, platform dışı yönlendirmeler tespit edilirse mesaj veritabanına kaydedilmez ve kullanıcıya güvenlik uyarısı verilir.
- Engellenen kullanıcılar birbirlerine mesaj gönderemez (`checkBlockStatus`).

### 📝 Kural 5: İlan Verme Form Doğrulamaları (Erken Kontroller)
- Giriş yapmamış kullanıcılar "İlan Ver" butonuna tıkladığı anda doğrudan `/login?redirect=/create-listing` sayfasına yönlendirilir (form sonuna bırakılmaz).
- Başlık (en az 5 karakter) ve Açıklama (en az 10 karakter) kontrolleri **Adım 2'de** yapılır; geçersizse bir sonraki adıma geçilmesine izin verilmez.

### 📱 Kural 6: Mobil Tasarım & Tam Ekran Mesajlaşma
- Mobilde alt navigasyon barı (`fixed bottom-0 md:hidden`) her zaman mevcuttur.
- Mobilde `/messages` sayfasına girildiğinde:
  - Sohbet seçili değilse: Sohbet listesi gösterilir. (Asla boş "Sohbet Seçin" ekranı tek başına görünmemelidir!)
  - Sohbet seçiliyse: Sol menü gizlenir, tam ekran yerel uygulama gibi sohbet penceresi ve sol üstte geri dönüş (`←`) oku görüntülenir.
- Sayfa içi otomatik kaydırmalar tüm sayfayı (`window`) değil, sadece ilgili mesaj kutusunu (`messagesContainerRef`) kaydırmalıdır.

---

## 7. 📡 API Uç Noktaları Rehberi

| Metot | Uç Nokta | Yetki | Açıklama |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/messages/unread-count` | Kullanıcı | Gerçek zamanlı okunmamış mesaj sayısını döner |
| `GET` | `/api/messages/conversations` | Kullanıcı | Kullanıcının tüm sohbetlerini ve son mesajlarını döner |
| `GET` | `/api/messages/conversations/[id]` | Kullanıcı | Sohbet mesaj geçmişini getirir ve mesajları okundu yapar |
| `PATCH` | `/api/messages/conversations/[id]` | Kullanıcı | Sohbetteki tüm mesajları açıkça okundu olarak işaretler |
| `POST` | `/api/messages` | Kullanıcı | Moderasyon kontrollü mesaj gönderir ve SSE yayını yapar |
| `GET` | `/api/messages/stream?conversationId=...` | Kullanıcı | İlgili sohbet için anlık SSE akışı |
| `GET` | `/api/notifications/stream` | Kullanıcı | Kullanıcı geneli anlık SSE bildirim akışı |
| `GET/PATCH` | `/api/notifications` | Kullanıcı | Sistem bildirimlerini getirir / okundu işaretler |
| `POST` | `/api/upload` | Kullanıcı | Cloudinary üzerinden görsel yükler |
| `GET/POST` | `/api/listings` | Herkes / Kullanıcı | İlanları listeleme ve yeni ilan oluşturma |
| `GET/PATCH/DELETE`| `/api/listings/[id]` | Sahip / Admin | İlan detay, durum güncelleme ve silme |
| `POST` | `/api/listings/[id]/favorite` | Kullanıcı | İlanı favorilere ekler / kaldırır |

---

## 8. 🔍 Sorun Giderme & Hızlı Kontrol Listesi

Bir değişiklik yaptığınızda aşağıdaki adımları kontrol ediniz:

1. [ ] `npx tsc --noEmit` hatasız tamamlandı mı?
2. [ ] Yeni veya değiştirilen arayüz metinleri Türkçe mi?
3. [ ] "Ev Devri" referansı veya kalıntısı eklendi mi? (Kesinlikle eklenmemeli)
4. [ ] Okunmamış mesaj sayacı düzgün sıfırlanıyor mu?
5. [ ] Mobil görünümde taşma, kayma veya beyaz boş ekran kalıyor mu?
6. [ ] PostgreSQL sorguları hatasız çalışıyor mu?

---

*Bu belge projenin çekirdek mimarisini yansıtmaktadır. UNILIVE üzerinde çalışırken bu ilkeleri koruyunuz.*

