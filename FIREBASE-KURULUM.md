# 🔥 Firebase + GitHub KURULUM REHBERİ
### (Teknik bilgisi gerektirmez — adımları sırayla yapın, 20 dakika sürer)

Bu rehberle sisteminizi **internette herkesin erişebileceği şekilde** yayına alacaksınız.
Sistem artık kendi bilgisayarına bağlı değil; Google'ın bulutunda (Firebase) ve GitHub'da duracak.

---

## BÖLÜM 1 — Firebase Projesi Oluşturma (5 dakika)

1. Tarayıcınızda **console.firebase.google.com** adresini açın.
2. Google hesabınızla giriş yapın (hesabınız yoksa "Hesap oluştur" ile açın).
3. Mavi **"Create a project" / "Proje oluştur"** düğmesine tıklayın.
4. Proje adı yazın (örn: `kafe-panelim`) → **Continue / Devam**.
5. "Google Analytics" sorusuna istediğiniz gibi cevap verin (etkisiz bırakabilirsiniz) → **Create project / Proje oluştur**.
6. "Your new project is ready" yazısını görünce **Continue** deyin. ✅

---

## BÖLÜM 2 — Giriş Sistemini Açma (2 dakika)

1. Sol menüden **Build → Authentication** tıklayın.
2. **"Get started"** düğmesine basın.
3. Listeden **Email/Password** seçin.
4. Sadece **Enable (Etkinleştir)** düğmesini açın → **Save**. ✅
   *(Bunu yapmazsanız giriş ekranı "operation-not-allowed" hatası verir.)*

---

## BÖLÜM 3 — Veritabanını Açma (2 dakika)

1. Sol menüden **Build → Firestore Database** tıklayın.
2. **"Create database"** deyin.
3. Bölge seçin: **eur3 (europe-west)** önerilir → **Next**.
4. **"Start in test mode"** seçili kalsın → **Create**. ✅
   *(Merak etmeyin: kodda gelen güvenlik kuralları zaten giriş yapmayanları engeller.)*

---

## BÖLÜM 4 — Kodunuzu Firebase'e Tanıtma (3 dakika) ⭐ EN ÖNEMLİ ADIM

1. Firebase sol menüsünden, dişli çark **⚙️ Project settings** tıklayın.
2. Aşağı kaydırın: **"Your apps"** bölümünde **</>** (Web) simgesine tıklayın.
3. Takma ad yazın (örn: `panel`) → **Register app** deyin.
4. Karşınıza `firebaseConfig` diye bir kutu çıkacak. İçinde şuna benzer satırlar olacak:

```
apiKey: "AIzaSyB4x5...",
authDomain: "kafe-panelim.firebaseapp.com",
projectId: "kafe-panelim",
storageBucket: "kafe-panelim.appspot.com",
messagingSenderId: "1234567890",
appId: "1:1234567890:web:abc123"
```

5. Bu 6 satırdaki **tırnak içindeki değerleri** kopyalayın.
6. Proje dosyalarınızda **`src/config/firebase-config.ts`** dosyasını açın.
7. `BURAYA_...` yazan 6 değeri silip, kopyaladığınız değerleri yapıştırın.
8. Dosyayı **kaydedin**. Bu kadar! 🎉

> ⚠️ Dikkat: `src/config/brand.ts` dosyasından panel adınızı, işletme adınızı, destek
> telefonunu istediğiniz zaman değiştirebilirsiniz. Tek dosya, tek yer.

---

## BÖLÜM 5 — Kodu GitHub'a Yükleme (5 dakika)

1. **github.com** adresine girin, hesabınız yoksa ücretsiz açın.
2. Sağ üstteki **+** işaretine tıklayın → **New repository**.
3. İsim verin (örn: `panelim`), **Private** seçin → **Create repository**.
4. Açılan sayfada **"uploading an existing file"** yazısına tıklayın.
5. Sizinle verdiğim **zip dosyasının içeriğini** bilgisayarınızda çıkartın.
6. Çıkan klasörün içindeki **tüm dosyaları** GitHub sayfasına sürükleyip bırakın.
   *(⚠️ `node_modules` klasörü YOKSA dert etmeyin — zaten olmamalı. Zip içinde de yok.)*
7. Sayfanın altındaki yeşil **"Commit changes"** düğmesine basın. ✅

> Dosyalar çoksa tek seferde yüklenmeyebilir. "Add file → Upload files" ile kalanları
> tekrar sürükleyip bırakabilirsiniz. Klasörler GitHub'da otomatik oluşur.

---

## BÖLÜM 6 — Yayınlama: GitHub'dan Firebase'e Otomatik Bağlantı (5 dakika)

Bu adımdan sonra kod GitHub'a her yüklendiğinde site **kendiliğinden güncellenir**. 🔄

1. Firebase konsolunda sol menüden **Hosting** tıklayın → **"Get started"**.
2. İki seçenek çıkacak; **"Use existing project / GitHub"** akışında:
   - Adım 1/2: sadece **Next** deyin.
   - Adım 2/2: **"Set up a GitHub workflow"** seçeneğini seçin → **GitHub'a bağlan** yetkisi verin (GitHub şifreniz sorulursa normaldir, GitHub'ın kendi sayfasıdır).
3. Depo (repository) listesinden **panelim** deponuzu seçin.
4. Yayın ayarlarında:
   - **Public directory / Klasör:** `out`
   - **Automatic deploy:** `main` dalı (branch) seçili kalsın
5. **"Finish"** deyin ve oluşan **GitHub Actions** işleminin bitmesini bekleyin (~3-5 dk).
6. Firebase size şöyle bir adres verecek:
   **`https://kafe-panelim.web.app`** — SİTENİZ HAZIR! 🎉

> 📌 **Bu adresi istediğiniz kişiyle paylaşabilirsiniz.** Dilerseniz ileride
> kendi alan adınızı (örn. panelim.com) Hosting → "Add custom domain" ile bağlayabilirsiniz.

---

## BÖLÜM 7 — İlk Giriş ve Kurulum (1 dakika)

1. Sitenize girin: `https://proje-adınız.web.app/giris`
2. İlk ziyaretinizde ekran **"İlk yöneticiyi oluştur"** gösterecek:
   - Ad Soyad, E-posta ve şifre yazın → **Yöneticiyi Oluştur** deyin.
3. Artık paneli kullanmaya başladınız! 🎊
4. Boş ekranlar göreceksiniz. Panelin **Ana Sayfa**'sındaki
   **"Örnek Verileri Yükle"** düğmesine basın — örnek menü ve masalar tek tıkla gelir.
5. Personeliniz için: **Kullanıcılar → Ekle → Davet Kodu Üret**.
   Kodu personelinize verin; giriş sayfasındaki "Davet koduyla personel kaydı"
   bölümünden kendi hesabını oluşturur.

---

## Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
| --- | --- |
| Girişte "operation-not-allowed" | Bölüm 2'deki Email/Password etkinleştirmeyi unutmuşsunuz. |
| "Kurulum gerekli" ekranı duruyor | Bölüm 4'teki değerleri yanlış yapıştırdınız; `src/config/firebase-config.ts` dosyasını tekrar kontrol edin. |
| Sayfa boş/beyaz | Bölüm 5'te dosyalar eksik yüklenmiş olabilir; GitHub deponuzda `out` değil tüm dosyalar olmalı. |
| Veriler gelmiyor | Bölüm 3'te Firestore'u oluşturmayı atlamışsınız. |
| Yayınlama hatası | GitHub deponuzda `firebase.json` ve `out` klasör ayarı `out` olarak kayıtlı mı bakın. |

## Günlük Kullanım Özeti

- **Marka/isim değiştirmek** → `src/config/brand.ts` (tek dosya)
- **Yeni sürüm yüklemek** → GitHub → deponuz → "Add file → Upload files" → değişen dosyaları yükle → otomatik yayına çıkar
- **Yedek/veri** → Firebase konsolu → Firestore Database → verilerinizi görebilir, dışa aktarabilirsiniz
