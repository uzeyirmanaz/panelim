// Genel Firestore CRUD servisi — her koleksiyon için aynı imkânlar:
// canlı dinleme (onSnapshot), ekleme, güncelleme, silme.
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  where,
  type QueryConstraint,
} from 'firebase/firestore'

import { getFirebaseDb } from './client'

export interface CrudService<T extends { id: string }> {
  /** Canlı dinleme — veri değişince callback yeniden çalışır; aboneliği döndürür */
  aboneOl: (callback: (veriler: T[]) => void, hata?: (e: Error) => void) => () => void
  /** Tek seferlik tam liste */
  hepsiniGetir: () => Promise<T[]>
  /** Belge ekle — otomatik kimlik */
  ekle: (veri: Omit<T, 'id'>) => Promise<string>
  /** Belirli kimlikle yaz (upsert) */
  yaz: (id: string, veri: Omit<T, 'id'>) => Promise<void>
  /** Var olan belgeyi güncelle */
  guncelle: (id: string, veri: Partial<T>) => Promise<void>
  /** Belgeyi sil */
  sil: (id: string) => Promise<void>
  /** Basit filtreli sorgu */
  filtrele: (alan: string, deger: unknown) => Promise<T[]>
}

export function koleksiyon<T extends { id: string }>(
  ad: string,
  siralamaAlani?: string,
  siralamaYonu: 'asc' | 'desc' = 'asc'
): CrudService<T> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firebase yapılandırılmamış — src/config/firebase-config.ts dosyasını doldurun.')

  function ref(kisitlar: QueryConstraint[] = []) {
    const koleksiyonRef = collection(db!, ad)
    const kosullar: QueryConstraint[] = [...kisitlar]
    if (siralamaAlani) kosullar.push(orderBy(siralamaAlani, siralamaYonu))
    return kosullar.length ? query(koleksiyonRef, ...kosullar) : koleksiyonRef
  }

  return {
    aboneOl(callback, hata) {
      return onSnapshot(
        ref(),
        (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[]),
        (e) => hata?.(e)
      )
    },

    async hepsiniGetir() {
      const snap = await getDocs(ref())
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[]
    },

    async ekle(veri) {
      const kayit = await addDoc(collection(db!, ad), {
        ...veri,
        createdAt: (veri as { createdAt?: unknown }).createdAt ?? new Date(),
      })
      return kayit.id
    },

    async yaz(id, veri) {
      await setDoc(doc(db!, ad, id), { ...veri, createdAt: (veri as { createdAt?: unknown }).createdAt ?? new Date() })
    },

    async guncelle(id, veri) {
      await updateDoc(doc(db!, ad, id), veri as Record<string, unknown>)
    },

    async sil(id) {
      await deleteDoc(doc(db!, ad, id))
    },

    async filtrele(alan, deger) {
      const snap = await getDocs(ref([where(alan, '==', deger)]))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[]
    },
  }
}
