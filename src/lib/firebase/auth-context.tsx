'use client'

// Kimlik doğrulama bağlamı — Firebase Auth + Firestore profil
// - Giriş: e-posta + şifre
// - İlk kurulum: hiç kullanıcı yokken "İlk yöneticiyi oluştur" akışı
// - Personel: panelden üretilen davet kodu ile kaydolur
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

import { getFirebaseAuth, getFirebaseDb, firebaseYapilandirildi } from './client'
import { api } from '@/lib/api'
import type { KullaniciProfili } from './tipler'

interface AuthDurumu {
  /** Firebase Auth kullanıcısı (null = giriş yapılmamış) */
  user: User | null
  /** Firestore'daki profil kaydı (ad, rol vb.) */
  profil: KullaniciProfili | null
  yukleniyor: boolean
  yapilandirildi: boolean
  /** Koleksiyonlarda hiç profil var mı? (false ise ilk kurulum akışı gösterilir) */
  ilkKurulumGerekli: boolean | null
  girisYap: (email: string, sifre: string) => Promise<void>
  cikisYap: () => Promise<void>
  ilkYoneticiOlustur: (ad: string, email: string, sifre: string) => Promise<void>
  davetleKaydol: (davetKodu: string, ad: string, email: string, sifre: string) => Promise<void>
  hataCevir: (e: unknown) => string
}

const AuthContext = createContext<AuthDurumu | null>(null)

const HATA_CEVIRI: Record<string, string> = {
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/wrong-password': 'E-posta veya şifre hatalı.',
  'auth/user-not-found': 'E-posta veya şifre hatalı.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı, lütfen birkaç dakika sonra tekrar deneyin.',
  'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
  'auth/invalid-email': 'Geçerli bir e-posta adresi girin.',
  'auth/network-request-failed': 'İnternet bağlantısı kurulamadı.',
  'auth/operation-not-allowed':
    'Firebase konsolunda Email/Password yöntemi etkin değil. Authentication → Sign-in method → Email/Password → Etkinleştir.',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profil, setProfil] = useState<KullaniciProfili | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [ilkKurulumGerekli, setIlkKurulumGerekli] = useState<boolean | null>(null)

  // Koleksiyonda profil var mı? → ilk kurulum kararı
  // (REST okuma: SDK akışı bazı ağlarda takılabiliyor)
  useEffect(() => {
    if (!firebaseYapilandirildi) {
      setIlkKurulumGerekli(false)
      return
    }
    api
      .get<Array<unknown>>('/api/users')
      .then((d) => setIlkKurulumGerekli((d?.length ?? 0) === 0))
      .catch(() => setIlkKurulumGerekli(false))
  }, [])

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setYukleniyor(false)
      return
    }
    const abone = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const db = getFirebaseDb()
        if (db) {
          try {
            const snap = await getDoc(doc(db, 'users', u.uid))
            if (snap.exists()) {
              setProfil({ id: snap.id, ...(snap.data() as object) } as KullaniciProfili)
              const sonGiris = new Date().toLocaleString('tr-TR')
              updateDoc(doc(db, 'users', u.uid), { sonGiris }).catch(() => {})
            } else {
              setProfil({
                id: u.uid,
                uid: u.uid,
                name: u.displayName ?? u.email ?? 'Kullanıcı',
                email: u.email ?? '',
                role: 'admin',
              })
            }
          } catch {
            setProfil(null)
          }
        }
      } else {
        setProfil(null)
      }
      setYukleniyor(false)
    })
    return () => abone()
  }, [])

  async function girisYap(email: string, sifre: string) {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase yapılandırılmamış.')
    await signInWithEmailAndPassword(auth, email.trim(), sifre)
  }

  async function cikisYap() {
    const auth = getFirebaseAuth()
    if (auth) await fbSignOut(auth)
  }

  async function ilkYoneticiOlustur(ad: string, email: string, sifre: string) {
    const auth = getFirebaseAuth()
    const db = getFirebaseDb()
    if (!auth || !db) throw new Error('Firebase yapılandırılmamış.')
    const kimlik = await createUserWithEmailAndPassword(auth, email.trim(), sifre)
    if (ad) await updateProfile(kimlik.user, { displayName: ad })
    await setDoc(doc(db, 'users', kimlik.user.uid), {
      uid: kimlik.user.uid,
      name: ad || email,
      email: email.trim(),
      role: 'admin',
      sonGiris: new Date().toLocaleString('tr-TR'),
      createdAt: serverTimestamp(),
    })
  }

  async function davetleKaydol(davetKodu: string, ad: string, email: string, sifre: string) {
    const auth = getFirebaseAuth()
    const db = getFirebaseDb()
    if (!auth || !db) throw new Error('Firebase yapılandırılmamış.')

    // Davet kodunu doğrula (REST okuma — kayıt öncesi oturum yoktur)
    const davetler = await api.get<Array<{ id: string; code: string; kullanildi?: boolean; role?: string }>>('/api/invites')
    const davet = davetler.find((d) => d.code === davetKodu.trim() && d.kullanildi !== true)
    if (!davet) throw new Error('Davet kodu geçersiz veya kullanılmış.')

    const kimlik = await createUserWithEmailAndPassword(auth, email.trim(), sifre)
    if (ad) await updateProfile(kimlik.user, { displayName: ad })
    const rol = (davet.role ?? 'garson') as KullaniciProfili['role']
    await setDoc(doc(db, 'users', kimlik.user.uid), {
      uid: kimlik.user.uid,
      name: ad || email,
      email: email.trim(),
      role: rol,
      sonGiris: new Date().toLocaleString('tr-TR'),
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'invites', davet.id), { kullanildi: true })
  }

  function hataCevir(e: unknown): string {
    const kod = (e as { code?: string })?.code
    if (kod && HATA_CEVIRI[kod]) return HATA_CEVIRI[kod]
    const mesaj = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.'
    return mesaj.replace('Firebase: ', '')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profil,
        yukleniyor,
        yapilandirildi: firebaseYapilandirildi,
        ilkKurulumGerekli,
        girisYap,
        cikisYap,
        ilkYoneticiOlustur,
        davetleKaydol,
        hataCevir,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthDurumu {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır')
  return ctx
}
