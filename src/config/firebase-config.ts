// ═══════════════════════════════════════════════════════════════
//  FIREBASE BAĞLANTI AYARLARI — Tek dosya, tek yer.
//
//  Nasıl doldurulur? (özet — ayrıntılı rehber: FIREBASE-KURULUM.md)
//  1. console.firebase.google.com → "Proje ekle"
//  2. Proje ayarları → "General" → "Your apps" → </> Web uygulaması ekle
//  3. Aşağıdaki firebaseConfig değerlerini buraya kopyalayın
// ═══════════════════════════════════════════════════════════════

/** Firebase proje değerleri — denem-ce953 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAZQY83BG8rYwPAY2CzB1FZhvC7EFen3G8',
  authDomain: 'denem-ce953.firebaseapp.com',
  projectId: 'denem-ce953',
  storageBucket: 'denem-ce953.firebasestorage.app',
  messagingSenderId: '219903314332',
  appId: '1:219903314332:web:2ef51a4370542c0ab5e059',
  measurementId: 'G-817Q88STKH',
}

/** Yapılandırma doldurulmuş mu? (yer tutucular hâlâ duruyor mu?) */
export const firebaseYapilandirildi = !Object.values(firebaseConfig).some(
  (v) => typeof v === 'string' && v.startsWith('BURAYA_')
)
