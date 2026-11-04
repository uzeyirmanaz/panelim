# GitHub'a Yükle → Site Otomatik Yayında

Bu klasör GitHub'a yüklendiği anda siteyi kendisi derler ve yayınlar.
**Kod değiştirmenize, secret/şifre eklemenize gerek yok.** Tek seferlik 1 ayar var.

## 1) Depoya yükle
Zip'i çıkarın → GitHub'da yeni depo açın → **tüm dosyaları** (gizli `.github` klasörü dahil)
sürükleyip bırakın → **Commit changes**.
Ya da terminalden:
```bash
git init && git add -A && git commit -m "ilk yükleme"
git branch -M main
git remote add origin https://github.com/KULLANICI/DEPO.git
git push -u origin main
```

## 2) Tek seferlik ayar (30 saniye)
Depo → **Settings → Pages → Build and deployment → Source: `GitHub Actions`**.
Sonra **Actions** sekmesinden "Siteyi Yayinla" iş akışını açıp **Re-run** yapın
(ya da küçük bir değişiklik yükleyin).

## 3) Adresiniz
`https://KULLANICI.github.io/DEPO-ADI/` (ilk yayın ~2-3 dk sürer).
Giriş ekranı: `.../giris/`

## 4) Firebase'de bir kez izin verin (giriş çalışsın diye)
Firebase konsolu → **Authentication → Settings → Authorized domains → Add domain**
→ `KULLANICI.github.io` ekleyin. (Eklemezseniz giriş "unauthorized-domain" hatası verir.)

## İsteğe bağlı: Firebase Hosting'e de yayınlama
Depo → Settings → Secrets and variables → Actions → **New repository secret**
`FIREBASE_SERVICE_ACCOUNT` adıyla Firebase servis hesabı JSON'unu yapıştırın.
Secret yoksa bu adım otomatik atlanır; GitHub Pages yine çalışır.
