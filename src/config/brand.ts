// ═══════════════════════════════════════════════════════════════
//  MARKA AYARLARI — Tek dosya, tek yer.
//  Uygulamanızın adını buradan değiştirin. Başka hiçbir dosyaya
//  dokunmanıza gerek yok; tüm ekranlar buradan okur.
// ═══════════════════════════════════════════════════════════════

export const BRAND = {
  /** Uygulama adı — menü, giriş ekranı, başlıklar hepsinde görünür */
  name: 'Panelim',
  /** Kısa açıklama (tarayıcı sekmesi başlığında kullanılır) */
  tagline: 'Bulut POS ve Adisyon Sistemi',
  /** Giriş ekranı karşılama başlığı */
  welcomeTitle: 'Panele hoş geldiniz',
  /** Giriş ekranı alt açıklama */
  welcomeSubtitle: 'Lütfen üyelik bilgileriniz ile giriş yapınız',
  /** Sol panelde gösterilecek kısa vurgu cümlesi */
  pitch:
    'Şubelerinizin tüm operasyonunu tek panelden yönetin: masalar, menü, siparişler ve raporlar — hepsi anlık ve bulut üzerinde.',
  /** Sol panelde gösterilecek işletme referansı (isteğe bağlı) */
  referenceAuthor: '',
  /** Destek e-posta adresi (Destek İste penceresi) */
  supportEmail: 'destek@ornek.com',
  /** Destek telefon numarası */
  supportPhone: '+90 (5xx) xxx xx xx',
  /** Destek çalışma saatleri */
  supportHours: 'Hafta içi 09.00 – 18.00 saatleri arasında hizmet vermekteyiz.',
  /** Telif satırı */
  copyright: 'Tüm hakları saklıdır.',
  /** Panelde görünen işletme adı (sidenav üstünde) */
  restaurantName: 'İşletmem',
  /** Panelde görünen hesap kodu */
  accountCode: '10000',
  /** Panel sürüm etiketi */
  version: '1.0',
} as const
