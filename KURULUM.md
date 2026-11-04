# Panelim — Yerel Kurulum (Bilgisayarınızda Çalıştırma)

> Yayınlamak (internete açmak) için: **FIREBASE-KURULUM.md** dosyasına bakın.
> Bu belge yalnızca kendi bilgisayarınızda denemek içindir.

## Gereksinimler

- **Node.js 20+** → https://nodejs.org (sol taraf: LTS sürümü, kurulum 2 dakika)
- **Bun** (isteğe bağlı, npm ile de olur)

## Adımlar

```bash
# 1) Bağımlılıkları kur
npm install

# 2) Firebase bağlantı değerlerini gir
#    src/config/firebase-config.ts dosyasını açın,
#    BURAYA_... yazan 6 değeri kendi Firebase projenizle değiştirin.
#    (Değerleri nereden alacağınız: FIREBASE-KURULUM.md → Bölüm 4)

# 3) Geliştirme sunucusunu başlat
npm run dev
```

Ardından tarayıcıda **http://localhost:3000** adresini açın.

## İlk Açılış

1. Giriş ekranı sizi **"İlk yöneticiyi oluştur"** karşılar:
   ad soyad + e-posta + şifre yazıp hesabınızı açın.
2. Panel açıldığında Ana Sayfa'daki **"Örnek Verileri Yükle"** düğmesine basın:
   örnek kategoriler, ürünler ve 10 masa tek tıkla yüklenir.
3. **Firebase konsolu → Authentication**'ta hesabınız listelenir,
   **Firestore Database**'te veriler görünür.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu (http://localhost:3000) |
| `npm run build` | `out/` klasörüne statik site üretir (yayına hazır) |
| `npm run start` | Üretilen siteyi yerelde sunar |
| `npm run deploy` | Firebase'e yayınlar (`firebase login` gerekir) |

## Marka / İşletme Ayarları

`src/config/brand.ts` — panel adı, işletme adı, hesap kodu, destek
e-postası/telefonu ve giriş ekranı metinleri dahil her şey bu tek dosyadan
yönetilir.
