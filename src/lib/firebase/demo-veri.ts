'use client'

// Demo veri yükleyici — Firestore'a örnek kategori/ürün/masa/gider/sipariş ekler.
// Panel ana sayfası ve masalar ekranındaki "Örnek Verileri Yükle" düğmesi ile çağrılır;
// böylece yeni kurulan Firebase projesi boş ekranla karşılaşmaz.
// Yüklenenler: 3 kategori, 11 ürün, 10 masa, 5 birim, 3 KDV, 2 mutfak grubu,
// 2 açık adisyon (masalar renkli görünür) ve 3 bugün kapanmış adisyon
// (satış kartları ve grafikler dolu görünür).
import { addDoc, collection } from 'firebase/firestore'

import { getFirebaseDb } from './client'

const KATEGORILER = [
  {
    name: 'İçecekler',
    emoji: '🥤',
    urunler: [
      { name: 'Çay', price: 52, emoji: '🍵', color: 'amber', popular: true },
      { name: 'Türk Kahvesi', price: 105, emoji: '☕', color: 'stone', popular: true },
      { name: 'Filtre Kahve', price: 105, emoji: '🥤', color: 'stone', popular: false },
      { name: 'Su', price: 45, emoji: '💧', color: 'violet', popular: false },
      { name: 'Ayran', price: 70, emoji: '🥛', color: 'violet', popular: false },
    ],
  },
  {
    name: 'Yiyecekler',
    emoji: '🍽️',
    urunler: [
      { name: 'Adana Kebap', price: 420, emoji: '🌯', color: 'red', popular: true },
      { name: 'Izgara Tavuk', price: 320, emoji: '🍗', color: 'orange', popular: true },
      { name: 'Mantı', price: 280, emoji: '🥟', color: 'yellow', popular: false },
    ],
  },
  {
    name: 'Tatlı ve Pastalar',
    emoji: '🍰',
    urunler: [
      { name: 'Künefe', price: 240, emoji: '🧆', color: 'amber', popular: true },
      { name: 'San Sebastian', price: 260, emoji: '🍰', color: 'stone', popular: true },
      { name: 'Sufle', price: 190, emoji: '🍫', color: 'stone', popular: false },
    ],
  },
]

const BOLGE_ADLARI = ['Salon']
const MASALAR = ['Masa 1', 'Masa 2', 'Masa 3', 'Masa 4', 'Masa 5', 'Masa 6', 'Masa 7', 'Masa 8', 'Masa 9', 'Masa 10']

type UrunKaydi = { id: string; name: string }

export async function demoVeriyiYukle(): Promise<{ kategori: number; urun: number; masa: number; siparis: number }> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firebase yapılandırılmamış.')
  const { api } = await import('@/lib/api')

  // Mevcut durum: koleksiyonlar doluysa o bölümü atla (tekrar yüklemede zarar verme)
  // (REST okuma: SDK akışı bazı ağlarda takılabiliyor)
  const [mevcutKategoriler, mevcutMasalar] = await Promise.all([
    api.get<Array<{ id: string }>>('/api/categories').catch(() => [] as Array<{ id: string }>),
    api.get<Array<{ id: string }>>('/api/tables').catch(() => [] as Array<{ id: string }>),
  ])
  const kategoriVar = mevcutKategoriler.length > 0
  const masaVar = mevcutMasalar.length > 0
  if (kategoriVar && masaVar) throw new Error('Demo veri zaten yüklenmiş görünüyor.')

  let kategoriSayisi = 0
  let urunSayisi = 0

  // 1) Kategoriler + ürünler (yoksa oluştur, varsa mevcutları kullan)
  const urunler: UrunKaydi[] = []
  if (kategoriVar) {
    const urunler_ = await api.get<Array<{ id: string; name: string }>>('/api/products')
    for (const u of urunler_) urunler.push({ id: u.id, name: u.name })
  } else {
    let sira = 0
    for (const k of KATEGORILER) {
      const kat = await addDoc(collection(db, 'categories'), {
        name: k.name,
        emoji: k.emoji,
        sortOrder: sira++,
        createdAt: new Date(),
      })
      kategoriSayisi++
      for (const u of k.urunler) {
        const kayit = await addDoc(collection(db, 'products'), {
          categoryId: kat.id,
          name: u.name,
          description: null,
          price: u.price,
          emoji: u.emoji,
          color: u.color,
          available: true,
          popular: u.popular,
          createdAt: new Date(),
        })
        urunler.push({ id: kayit.id, name: u.name })
        urunSayisi++
      }
    }
  }

  // 2) Masalar — Salon bölgesi altında (yoksa)
  let masaSayisi = 0
  const masaIdler: string[] = []
  if (masaVar) {
    for (const m of mevcutMasalar) masaIdler.push(m.id)
    masaSayisi = masaIdler.length
  } else {
    const bolge = await addDoc(collection(db, 'zones'), {
      name: BOLGE_ADLARI[0],
      sortOrder: 0,
      createdAt: new Date(),
    })
    let masaSira = 0
    for (const m of MASALAR) {
      const kayit = await addDoc(collection(db, 'tables'), {
        name: m,
        zone: BOLGE_ADLARI[0],
        zoneId: bolge.id,
        seats: 4,
        sortOrder: masaSira++,
        createdAt: new Date(),
      })
      masaIdler.push(kayit.id)
      masaSayisi++
    }
  }

  // 3) Birimler + KDV + mutfak grupları (yalnızca kategoriler bizim yüklediğimizde)
  if (!kategoriVar) {
    for (const b of ['Tam', 'Yarım', 'Bir buçuk', 'Adet', 'Kg']) {
      await addDoc(collection(db, 'units'), { name: b, sortOrder: 0, createdAt: new Date() })
    }
    for (const r of [1, 10, 20]) {
      await addDoc(collection(db, 'vatRates'), { rate: r, createdAt: new Date() })
    }
    for (const g of ['Mutfak', 'Bar']) {
      await addDoc(collection(db, 'kitchenGroups'), { name: g, createdAt: new Date() })
    }
  }

  // 4) Örnek siparişler — ürün ve masa varsa (açık adisyonlar masaları renklendirir,
  //    kapanmışlar bugünün satış kartlarını ve grafiklerini doldurur)
  let siparisSayisi = 0
  if (urunler.length > 0 && masaIdler.length > 0) {
    const sec = (ad: string) => {
      const u = urunler.find((x) => x.name === ad)
      if (!u) throw new Error(`Demo ürünü bulunamadı: ${ad}`)
      return u.id
    }
    const masa = (i: number) => masaIdler[Math.min(i, masaIdler.length - 1)]

    try {
      // 2 açık adisyon — Masa 1 (büyük tutar) ve Masa 4 (küçük tutar), orijinal ekrandaki gibi
      const aciklar: Array<{ masaIdx: number; secimler: Array<[string, number]> }> = [
        { masaIdx: 0, secimler: [['Çay', 4], ['San Sebastian', 2], ['Filtre Kahve', 2], ['Türk Kahvesi', 1]] },
        { masaIdx: 3, secimler: [['Adana Kebap', 1], ['Su', 2]] },
      ]
      for (const o of aciklar) {
        await api.post('/api/orders', {
          orderType: 'masa',
          tableId: masa(o.masaIdx),
          items: o.secimler.map(([ad, quantity]) => ({ productId: sec(ad), quantity })),
        })
        siparisSayisi++
      }

      // 3 bugün kapanmış adisyon — satış grafikleri ve misafir sayısı dolu görünsün
      const kapananlar: Array<{ masaIdx: number; secimler: Array<[string, number]> }> = [
        { masaIdx: 2, secimler: [['Çay', 2], ['Künefe', 1]] },
        { masaIdx: 5, secimler: [['Izgara Tavuk', 1], ['Ayran', 2]] },
        { masaIdx: 7, secimler: [['Mantı', 1], ['Sufle', 1]] },
      ]
      for (const o of kapananlar) {
        const sonuc = await api.post<{ id: string }>('/api/orders', {
          orderType: 'masa',
          tableId: masa(o.masaIdx),
          items: o.secimler.map(([ad, quantity]) => ({ productId: sec(ad), quantity })),
        })
        await api.patch(`/api/orders/${sonuc.id}`, { action: 'pay' })
        siparisSayisi++
      }
    } catch {
      // Sipariş örnekleri oluşturulamasa bile temel demo verisi yüklü sayılır
    }
  }

  return { kategori: kategoriSayisi, urun: urunSayisi, masa: masaSayisi, siparis: siparisSayisi }
}
