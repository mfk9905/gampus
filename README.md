# GAMPÜS

> **Öğrenciden Öğrenciye Güvenli ve Ekonomik Kampüs Yaşamı**
> *“Öğrencinin taşınma, ev ve eşya devir pazaryeri.”*

---

## 🚀 Proje Hakkında

GAMPÜS, üniversite öğrencilerinin:
- Kiralık ev ve studio daireler bulmasını,
- Bütçesine uygun kiralık oda bulmasını,
- Uyumlu ev arkadaşı bulmasını,
- İkinci el derslik masası, koltuk, beyaz eşya alıp satmasını,
- Mezun olurken evini ve tüm eşyalarını yeni gelen öğrencilere komisyonsuz devretmesini

sağlayan, öğrenciler odaklı, konum tabanlı ve güvenli marketplace platformudur.

---

## ✨ Öne Çıkan Özellikler

- **🟢 .edu.tr Öğrenci Doğrulama:** Gerçek üniversite öğrencilerine özel doğrulama rozeti.
- **📱 Onaylı İletişim & WhatsApp Entegrasyonu:** İlan sahipleriyle tek tıkla WhatsApp üzerinden dinamik mesaj ile bağlantı kurma.
- **🎓 Kampüs Yakınlığı Hesabı (Haversine Distance):** Seçtiğin üniversite kampüsüne kaç km / metre mesafede olduğunu anında gör.
- **🏠 5 Ana Kategori:** Kiralık Ev, Oda, Ev Arkadaşı, İkinci El Eşya ve Komple Ev Eşya Paketleri.
- **❤️ Favori & Lead Takibi:** İlanları favorilere ekleme ve ilan sahibi iletişim tıklama analitiği.
- **🛡️ Şikayet & Güvenlik Sistemi:** Sahte ve uygunsuz ilan bildirim mekanizması.
- **👑 Admin Yönetim Paneli:** Kullanıcı rolleri, doğrulamalar, ilan öne çıkarma ve şikayet kontrolü.
- **📱 Responsive & Mobile-First:** Uygulama hissi veren mobil alt navigasyon barı ve dinamik UI.

---

## 🛠️ Teknoloji Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Next.js Route Handlers (API Routes)
- **Database & ORM:** PostgreSQL / SQLite, Prisma ORM
- **Validation:** Zod
- **Auth:** JWT (Jose), HTTP-Only Cookies, Bcrypt Password Hashing

---

## 📦 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın veya İndirin

```bash
cd unilive
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Variables Yapılandırması

`.env` dosyanızı `.env.example` örneğine göre oluşturun:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="unilive_super_secret_jwt_key_2026_dev_mode"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
WHATSAPP_NUMBER="+905550000000"
```

### 4. Veritabanı Şemasını Oluşturun ve Tohum (Seed) Verisini Yükleyin

```bash
npx prisma db push
npx prisma db seed
```

*Seed verisinde 10 İstanbul üniversitesi (İTÜ, Boğaziçi, YTÜ, Marmara vb.), 20+ gerçekçi kullanıcı ve 50+ detaylı ilan yer almaktadır.*

### 5. Uygulamayı Geliştirici Modunda Başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

---

## 📁 Proje Klasör Yapısı

```text
src/
 ├── app/
 │   ├── page.tsx               # Ana Sayfa (Hero, Kampüs Seçimi, Kategoriler, Öne Çıkanlar)
 │   ├── explore/                # Keşfet & Gelişmiş Filtreleme Sayfası
 │   ├── login/                  # Kullanıcı Girişi
 │   ├── register/               # Öğrenci Kaydı (.edu.tr desteği)
 │   ├── listings/[id]/          # İlan Detay Sayfası & WhatsApp / Harita
 │   ├── create-listing/         # Adım Adım İlan Oluşturma Formu & Önizleme
 │   ├── profile/                # Öğrenci Profili & Doğrulama
 │   ├── dashboard/              # Kullanıcı İlan Yönetimi & İstatistikleri
 │   ├── admin/                  # Admin Yönetim Paneli
 │   └── api/                    # Clean Backend Route Handlers (Auth, Listings, Reports)
 │
 ├── components/
 │   ├── navbar/                 # Responsive Navbar & Mobile Bottom Nav
 │   ├── footer/                 # Footer & Marka Bilgisi
 │   ├── listing/                # ListingCard & ListingGrid
 │   ├── filters/                # ExploreFilters
 │   ├── campus/                 # CampusSelector
 │   └── report/                 # ReportModal
 │
 ├── lib/
 │   ├── db/                     # Prisma Client Singleton
 │   ├── auth/                   # JWT & Password Hash Yardımcıları
 │   ├── validation/             # Zod Validation Şemaları
 │   └── utils/                  # Haversine Mesafe Hesabı & Formatterlar
 │
 ├── services/
 │   ├── listing-service.ts      # İlan iş mantığı & sorgular
 │   ├── user-service.ts         # Kullanıcı & Profil servisi
 │   ├── university-service.ts   # Üniversite servisi
 │   └── report-service.ts       # Şikayet & Admin istatistik servisi
 │
 └── prisma/
     ├── schema.prisma           # Prisma Veritabanı Şeması
     └── seed.ts                 # Gerçekçi Türkçe Örnek Veri Tohumu
```

---

## 🗺️ Gelecek Yol Haritası (Future Roadmap)

```text
FAZ 2
- Gerçek .edu.tr e-posta sunucu entegrasyonu & aktivasyon linki
- SMS doğrulama (Twilio / Netgsm)
- Favori düşüş bildirimleri
- Gerçek Mapbox / OpenStreetMap harita entegrasyonu
- Kampüs mesafesi filtre sliderı
- Premium öne çıkan ilan satın alma

FAZ 3
- Online güvenli emanet / ödeme sistemi (Iyzico / Stripe)
- İki öğrenci arası gerçek zamanlı sohbet (Socket.io / Supabase Realtime)
- Nakliye & Kargo partneri entegrasyonu
- Kullanıcı değerlendirme ve rozet puanlama sistemi

FAZ 4
- React Native / Expo mobil uygulama (iOS & Android)
- Mobil anlık bildirimler (Push Notifications)
- Kampüs içi mikro ekonomi ve mekan fırsatları
- Türkiye geneli 81 il üniversite genişlemesi
```
