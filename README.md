# Panelim — Bulut POS ve Adisyon Sistemi (Firebase + GitHub)

Restoran/cafe işletmeleri için bulut tabanlı panel: masalar, menü/ürünler,
siparişler, tanımlar, kullanıcılar, yetkiler ve raporlar.

- **Veri katmanı:** Firebase Firestore (sunucusuz — arka uç sunucu yoktur)
- **Kimlik doğrulama:** Firebase Authentication (e-posta + şifre, davet kodlu personel kaydı)
- **Arayüz:** Next.js 16 + TypeScript + Tailwind CSS 4 (statik export — Firebase Hosting'e bire bir uyumlu)
- **Marka:** tamamen parametrik — `src/config/brand.ts` dosyasından tek yerden yönetilir

## Öne Çıkanlar

| Özellik | Durum |
| --- | --- |
| Giriş ekranı (ilk yönetici kurulumu + davet kodlu personel kaydı) | ✅ |
| Ana Sayfa (bugünün satışı, misafir sayısı, açık sipariş, gider kartları) | ✅ |
| Masa / Bölgeler (bölge + masa yönetimi) | ✅ |
| Menü / Ürünler (kategori ağacı + ürün ızgarası) | ✅ |
| Tanımlamalar: Birimler, Özellikler, KDV, İndirimler, Mutfak Grupları | ✅ |
| Müşteriler, Ödenmezler | ✅ |
| Gider/Masraf + Zayi İşlemleri | ✅ |
| Kullanıcılar (davet kodu sistemi) + Yetkiler | ✅ |
| Raporlar: Ürün Satış, Gün Sonu, Vardiya, İstatistik, Fire, Sihirbaz | ✅ |
| Sipariş (POS) ekranı — masa/paket/gel-al | ✅ |
| Örnek veri yükleme (tek tıkla demo menü + masalar) | ✅ |

## Dosya Yapısı

```
src/config/brand.ts             ← MARKA AYARLARI (ad, işletme, destek bilgisi)
src/config/firebase-config.ts   ← FIREBASE BAĞLANTI (kendi proje değerleriniz)
src/lib/firebase/               ← Firestore istemcisi, kimlik doğrulama, servisler
src/lib/api.ts                  ← Veri katmanı (Firestore destekli uyumluluk katmanı)
src/app/giris/                  ← Giriş ekranı
src/app/panel/                  ← Yönetim paneli (tüm ekranlar)
src/components/panel/           ← Panel bileşenleri
.github/workflows/deploy.yml    ← GitHub → Firebase otomatik yayınlama
firebase.json                   ← Firebase Hosting yapılandırması
firestore.rules                 ← Veritabanı güvenlik kuralları
```

## Kurulum

**Yayınlama (GitHub + Firebase):** → `FIREBASE-KURULUM.md` — teknik bilgi
gerektirmeyen, adım adım Türkçe rehber.

**Bilgisayarınızda denemek:**

```bash
bun install            # veya: npm install
bun run dev            # veya: npm run dev
# http://localhost:3000
```

> Uygulama çalışması için `src/config/firebase-config.ts` dosyasına kendi
> Firebase değerlerinizi girmeniz gerekir (bkz. FIREBASE-KURULUM.md, Bölüm 4).

## Sık Sorulanlar

**Marka adını / işletme adını nereden değiştiririm?**
`src/config/brand.ts` — tek dosya, tek yer. `restaurantName`, `accountCode`,
`name`, destek bilgileri dahil.

**Demo hesap var mı?**
Hayır. İlk girişte kendi yönetici hesabınızı oluşturursunuz ("İlk yöneticiyi
oluştur" ekranı yalnızca kullanıcı yokken görünür). Örnek veriler panelin
Ana Sayfa'sındaki "Örnek Verileri Yükle" düğmesiyle yüklenir.

**Personel hesabı nasıl açılır?**
Panel → Kullanıcılar → Ekle → davet kodu üret → kodu personelle paylaş →
giriş sayfasındaki "Davet koduyla personel kaydı" bölümünü kullanır.

**Depolama/veri limiti?**
Firebase ücretsiz planı (Spark) bu panel için fazlasıyla yeterlidir:
1 GB Firestore verisi, 50 bin günlük okuma.
