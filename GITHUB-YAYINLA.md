# GitHub'a Yükle → Site Kendiliğinden Yayınlanır

Hiçbir ayar yapmanız gerekmez.

1. Zip'i bilgisayarınızda çıkarın.
2. GitHub'da deponuzu açın → **Add file → Upload files**.
3. Çıkan klasörün **içindeki her şeyi** (gizli `.github` klasörü dahil) sürükleyip bırakın → **Commit changes**.
4. **Actions** sekmesinde "Siteyi Yayinla" çalışır (yeşil ✔ olunca bitti, ~3-5 dk).
5. Adres: `https://KULLANICI.github.io/DEPO-ADI/`

## Actions sekmesinde hiçbir şey çalışmadıysa
`.github` klasörü yüklenmemiş olabilir (gizli klasör). Çözüm:
Add file → **Create new file** → ad kısmına tam olarak `.github/workflows/deploy.yml` yazın →
`deploy-yml-yedek.txt` dosyasının içeriğini kopyalayıp yapıştırın → **Commit changes**.

## Giriş için Firebase'de (bir kez)
Authentication → Sign-in method → **Email/Password: Enable**, Firestore Database → **Create database**.
