'use client'

// ═══════════════════════════════════════════════════════════════════
//  VERİ KATMANI — Firestore destekli uyumluluk katmanı
//  Eski REST arayüzüyle (api.get/post/patch/del) bire bir aynı imzayı
//  sunar; tüm veriler doğrudan Firestore'da saklanır ve okunur.
//  Böylece GitHub + Firebase Hosting üzerinde sunucusuz çalışır.
// ═══════════════════════════════════════════════════════════════════
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore'

import { firebaseConfig } from '@/config/firebase-config'
import { getFirebaseAuth, getFirebaseDb, firebaseYapilandirildi } from './firebase/client'
import { ACTIVE_STATUSES, type CategoryDTO, type OrderDTO, type OrderStatus, type ProductDTO, type StatsDTO, type TableDTO } from './types'
import { onAuthStateChanged, type User } from 'firebase/auth'

// ─── Yardımcılar ────────────────────────────────────────────────────

async function dbx() {
  const db = getFirebaseDb()
  if (!db) {
    throw new Error(
      'Firebase yapılandırılmamış. src/config/firebase-config.ts dosyasındaki değerleri kendi Firebase projenizle doldurun.'
    )
  }
  return db
}

/** Firestore Timestamp/Date değerlerini ISO string'e çevir (görünümler bunu bekler) */
function ts(v: unknown): unknown {
  if (v && typeof v === 'object' && 'toDate' in (v as Record<string, unknown>)) {
    return (v as { toDate(): Date }).toDate().toISOString()
  }
  if (v instanceof Date) return v.toISOString()
  return v
}

function normalize<T>(id: string, data: DocumentData): T {
  const out: Record<string, unknown> = { id }
  for (const [k, v] of Object.entries(data)) {
    if (k === 'items' && Array.isArray(v)) {
      out[k] = v.map((it: DocumentData) => {
        const item: Record<string, unknown> = {}
        for (const [ik, iv] of Object.entries(it)) item[ik] = ts(iv)
        return item
      })
    } else {
      out[k] = ts(v)
    }
  }
  return out as T
}

async function liste<T>(kol: string, siralama?: string, yon: 'asc' | 'desc' = 'asc'): Promise<T[]> {
  // Koleksiyon okumaları REST (düz HTTPS) üzerinden yapılır: Firestore SDK'sının
  // canlı akış kanalı (WebChannel) katı ağ/proksi arkasında takılıp hiç
  // dönmeyebiliyor; REST her ortamda güvenilir sonuç verir. Yazma işlemleri
  // SDK üzerinden sürer.
  const belgeler = await restListe(kol, siralama, yon)
  return belgeler.map((b) => normalize<T>(String(b.id), b as DocumentData))
}

// ─── REST okuma katmanı ──────────────────────────────────────────────────

const FS_TABAN = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`

/** Oturum sahibinin kimlik jetonu (SDK otomatik tazeler) */
async function kimlikJetoni(): Promise<string> {
  const auth = getFirebaseAuth()
  if (!auth) {
    console.warn('[api] kimlikJetoni: auth örneği yok')
    throw new Error('Firebase yapılandırılmamış.')
  }
  let kullanici = auth.currentUser
  if (!kullanici) {
    // Sayfa yeni yüklendiğinde oturum bilgisi asenkron geri yüklenir;
    // ilk okumaların boşa düşmemesi için kısa bir süre bekliyoruz.
    console.debug('[api] kimlikJetoni: oturum bekleniyor…')
    kullanici = await new Promise<User | null>((coz) => {
      const sure = setTimeout(() => {
        abone()
        coz(null)
      }, 6000)
      const abone = onAuthStateChanged(auth, (u) => {
        clearTimeout(sure)
        abone()
        coz(u)
      })
    })
    console.debug('[api] kimlikJetoni: oturum sonucu =', kullanici?.email ?? 'yok')
  }
  if (!kullanici) {
    console.warn('[api] kimlikJetoni: oturum açılamadı (kullanıcı yok)')
    throw new Error('Oturum açık değil — veriler okunamadı.')
  }
  return kullanici.getIdToken()
}

type RestDeger = Record<string, unknown>

/** REST tipli alan değerini normal JS değerine çevir */
function restDegeri(v: RestDeger): unknown {
  const tur = Object.keys(v)[0]
  switch (tur) {
    case 'stringValue':
      return v[tur] as string
    case 'booleanValue':
      return v[tur] as boolean
    case 'integerValue':
    case 'doubleValue':
      return Number(v[tur])
    case 'nullValue':
      return null
    case 'timestampValue':
      return new Date(String(v[tur]))
    case 'mapValue': {
      const f = (v[tur] as { fields?: Record<string, RestDeger> }).fields ?? {}
      const out: Record<string, unknown> = {}
      for (const [k, x] of Object.entries(f)) out[k] = restDegeri(x)
      return out
    }
    case 'arrayValue': {
      const dizi = (v[tur] as { values?: RestDeger[] }).values ?? []
      return dizi.map((x) => restDegeri(x))
    }
    default:
      return v[tur] // bytesValue / referenceValue / geoPointValue — panelde kullanılmıyor
  }
}

/** REST belgesini { id, ...alanlar } düz nesnesine çevir */
function restBelge(ad: string, fields: Record<string, RestDeger> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = { id: ad.split('/').pop() }
  for (const [k, v] of Object.entries(fields ?? {})) out[k] = restDegeri(v)
  return out
}

/** Koleksiyonu REST ile oku (orderBy varsa runQuery, yoksa belge listesi) */
async function restListe(kol: string, siralama?: string, yon: 'asc' | 'desc' = 'asc'): Promise<Record<string, unknown>[]> {
  const token = await kimlikJetoni()
  const runQuery = Boolean(siralama)
  const url = runQuery ? `${FS_TABAN}:runQuery` : `${FS_TABAN}/${kol}?pageSize=300`
  console.debug('[api] restListe:', kol, siralama ?? '(sırasız)')
  const govde = runQuery
    ? {
        structuredQuery: {
          from: [{ collectionId: kol }],
          ...(siralama
            ? { orderBy: [{ field: { fieldPath: siralama }, direction: yon === 'asc' ? 'ASCENDING' : 'DESCENDING' }] }
            : {}),
        },
      }
    : undefined
  const res = await fetch(url, {
    method: runQuery ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(runQuery ? { 'Content-Type': 'application/json' } : {}) },
    body: govde ? JSON.stringify(govde) : undefined,
  })
  if (!res.ok) {
    const h = await res.json().catch(() => ({}) as RestDeger)
    console.warn('[api] restListe HATA:', kol, res.status, JSON.stringify(h).slice(0, 200))
    throw new Error(`Firestore okuma hatası (${res.status}): ${JSON.stringify(h).slice(0, 200)}`)
  }
  const veri: unknown = await res.json()
  if (runQuery) {
    const satirlar = (Array.isArray(veri) ? veri : []) as Array<{ document?: { name: string; fields?: Record<string, RestDeger> } }>
    return satirlar.filter((s) => s?.document).map((s) => restBelge(s.document!.name, s.document!.fields))
  }
  const liste_ = (veri as { documents?: Array<{ name: string; fields?: Record<string, RestDeger> }> }).documents ?? []
  return liste_.map((d) => restBelge(d.name, d.fields))
}

/** Formdan gelen string değerleri koleksiyonun beklediği tiplere çevir */
const NUMERIK: Record<string, string[]> = {
  features: ['price'],
  'vat-rates': ['rate'],
  discounts: ['value'],
  expenses: ['amount'],
  wastes: ['quantity', 'amount'],
}
const TARIH: Record<string, string[]> = {
  expenses: ['spentAt'],
  wastes: ['wastedAt'],
}
const VARSAYILAN: Record<string, Record<string, unknown>> = {
  discounts: { type: 'percent' },
  expenses: { category: 'Diğer' },
  wastes: { unit: 'Adet' },
}

function hazirla(kol: string, body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (k === 'id') continue
    if (NUMERIK[kol]?.includes(k)) {
      out[k] = Number(String(v).replace(',', '.')) || 0
    } else if (TARIH[kol]?.includes(k)) {
      out[k] = v ? new Date(String(v)).toISOString() : new Date().toISOString()
    } else {
      out[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v
    }
  }
  for (const [k, v] of Object.entries(VARSAYILAN[kol] ?? {})) {
    if (out[k] === undefined || out[k] === null) out[k] = v
  }
  return out
}

// ─── Ana istemci ────────────────────────────────────────────────────

type Yanit<T> = { ok: boolean; data?: T; error?: string }

function basari<T>(data: T): T {
  return data
}

export const api = {
  // GET — okuma işlemleri
  async get<T>(url: string): Promise<T> {
    const [path, qs] = url.split('?')
    const params = new URLSearchParams(qs ?? '')

    // Tanımlar (birimler, özellikler, kdv, indirimler, mutfak grupları,
    // müşteriler, ödenmezler, giderler, zayiler) — ortak okuma
    const tanimlar: Record<string, [string, string]> = {
      '/api/units': ['units', 'name'],
      '/api/features': ['features', 'name'],
      '/api/vat-rates': ['vatRates', 'rate'],
      '/api/discounts': ['discounts', 'name'],
      '/api/kitchen-groups': ['kitchenGroups', 'name'],
      '/api/customers': ['customers', 'name'],
      '/api/odenmezler': ['nonpayers', 'name'],
      '/api/expenses': ['expenses', 'spentAt'],
      '/api/wastes': ['wastes', 'wastedAt'],
    }
    if (tanimlar[path]) {
      const [kol, siralama] = tanimlar[path]
      return basari(await liste<T>(kol, siralama, path === '/api/expenses' || path === '/api/wastes' ? 'desc' : 'asc'))
    }

    switch (path) {
      case '/api/categories': {
        const kat = await liste<CategoryDTO & { products?: ProductDTO[] }>('categories', 'sortOrder')
        const urunler = await liste<ProductDTO>('products', 'createdAt')
        const grupta = kat.map((k) => ({ ...k, products: urunler.filter((u) => u.categoryId === k.id) }))
        return basari(grupta as unknown as T)
      }

      case '/api/menu': {
        const kat = await liste<CategoryDTO & { products?: ProductDTO[] }>('categories', 'sortOrder')
        const urunler = await liste<ProductDTO>('products', 'createdAt')
        const grupta = kat.map((k) => ({ ...k, products: urunler.filter((u) => u.categoryId === k.id) }))
        return basari(grupta as unknown as T)
      }

      case '/api/products':
        return basari(await liste<T>('products', 'createdAt'))

      case '/api/users':
        return basari(await liste<T>('users', 'createdAt'))

      case '/api/invites':
        return basari(await liste<T>('invites', 'createdAt'))

      case '/api/tables': {
        const masalar = await liste<TableDTO>('tables', 'name')
        masalar.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR', { numeric: true }))
        const aktifler = await liste<OrderDTO>('orders', 'createdAt', 'desc')
        const acikler = aktifler.filter((o) => (ACTIVE_STATUSES as string[]).includes(o.status))
        const dto: TableDTO[] = masalar.map((m) => {
          const o = acikler.find((x) => x.tableId === m.id)
          return {
            ...m,
            openOrderId: o?.id ?? null,
            openOrderStatus: (o?.status as OrderStatus) ?? null,
            openOrderTotal: o ? o.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0,
            openOrderItems: o ? o.items.reduce((s, i) => s + i.quantity, 0) : 0,
            lastOrderAt: o?.createdAt ?? null,
          }
        })
        return basari(dto as unknown as T)
      }

      case '/api/orders': {
        const scope = params.get('scope') ?? 'active'
        const hepsi = await liste<OrderDTO>('orders', 'createdAt', 'desc')
        let secilen = hepsi
        if (scope === 'active') secilen = hepsi.filter((o) => (ACTIVE_STATUSES as string[]).includes(o.status))
        if (scope === 'paid') secilen = hepsi.filter((o) => o.status === 'paid')
        // tableName çözümle
        const masalar = await liste<{ id: string; name: string }>('tables', 'name')
        const dto = secilen.map((o) => ({
          ...o,
          tableName:
            o.tableName ??
            masalar.find((m) => m.id === o.tableId)?.name ??
            o.customerName ??
            (o.orderType === 'paket' ? 'Paket Sipariş' : o.orderType === 'gelal' ? 'Gel-Al Sipariş' : 'Sipariş'),
        }))
        return basari(dto as unknown as T)
      }

      case '/api/stats': {
        const hepsi = await liste<OrderDTO>('orders', 'createdAt', 'desc')
        const urunler = await liste<ProductDTO>('products', 'createdAt')
        const masalar = await liste<TableDTO>('tables', 'name')
        const giderler = await liste<{ id: string; amount: number; spentAt?: string | null }>('expenses', 'spentAt', 'desc')
        const odenenler = hepsi.filter((o) => o.status === 'paid')

        const simdi = new Date()
        const bugunBaslangic = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate())
        const bugun = odenenler.filter((o) => new Date(o.createdAt) >= bugunBaslangic)
        const todayRevenue = bugun.reduce((s, o) => s + o.total, 0)
        const todayOrders = bugun.length
        const aktifler = hepsi.filter((o) => (ACTIVE_STATUSES as string[]).includes(o.status))
        const openTotal = aktifler.reduce((s, o) => s + o.total, 0)

        const ayBaslangic = new Date(bugunBaslangic)
        ayBaslangic.setDate(ayBaslangic.getDate() - 29)
        const monthRevenue = odenenler
          .filter((o) => new Date(o.createdAt) >= ayBaslangic)
          .reduce((s, o) => s + o.total, 0)

        // Saat bazlı satışlar (10:00–24:00 arası 16 dilim — orijinal gibi)
        const hourly = Array.from({ length: 16 }, (_, i) => {
          const h = i + 8
          const revenue = bugun
            .filter((o) => new Date(o.createdAt).getHours() === h)
            .reduce((s, o) => s + o.total, 0)
          return { label: `${String(h).padStart(2, '0')}:00`, revenue }
        })

        // Son 7 gün
        const last7days = Array.from({ length: 7 }, (_, i) => {
          const gun = new Date(bugunBaslangic)
          gun.setDate(gun.getDate() - (6 - i))
          const o = odenenler.filter((x) => {
            const d = new Date(x.createdAt)
            return d >= gun && d < new Date(gun.getTime() + 86400000)
          })
          return {
            date: gun.toISOString().slice(0, 10),
            label: gun.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
            revenue: o.reduce((s, x) => s + x.total, 0),
            orders: o.length,
          }
        })

        // En çok satanlar
        const satisMap = new Map<string, { quantity: number; revenue: number }>()
        const katMap = new Map<string, { revenue: number }>()
        for (const o of odenenler) {
          for (const i of o.items) {
            const mevcut = satisMap.get(i.name) ?? { quantity: 0, revenue: 0 }
            mevcut.quantity += i.quantity
            mevcut.revenue += i.price * i.quantity
            satisMap.set(i.name, mevcut)
            if (i.productId) {
              const urun = urunler.find((u) => u.id === i.productId)
              if (urun) {
                const k = katMap.get(urun.categoryId) ?? { revenue: 0 }
                k.revenue += i.price * i.quantity
                katMap.set(urun.categoryId, k)
              }
            }
          }
        }
        const topProducts = [...satisMap.entries()]
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 8)

        const kategoriler = await liste<CategoryDTO>('categories', 'sortOrder')
        const categoryShare = [...katMap.entries()]
          .map(([cid, v]) => {
            const k = kategoriler.find((x) => x.id === cid)
            return { name: k?.name ?? 'Diğer', emoji: k?.emoji ?? '🍽️', revenue: v.revenue }
          })
          .sort((a, b) => b.revenue - a.revenue)

        const stats: StatsDTO = {
          todayRevenue,
          todayOrders,
          avgTicket: todayOrders > 0 ? todayRevenue / todayOrders : 0,
          activeOrders: aktifler.length,
          openTotal,
          monthRevenue,
          hourly,
          productCount: urunler.length,
          tableCount: masalar.length,
          last7days,
          topProducts,
          categoryShare,
          // Gerçek ana sayfa kartları: misafir sayısı (bugün kapanan adisyonlar)
          // ve bugünkü gider toplamı
          todayGuests: bugun.length,
          todayExpense: giderler
            .filter((g) => {
              if (!g.spentAt) return false
              const d = new Date(g.spentAt)
              return d >= bugunBaslangic && d < new Date(bugunBaslangic.getTime() + 86400000)
            })
            .reduce((s, g) => s + Number(g.amount ?? 0), 0),
        } as StatsDTO & { todayGuests: number; todayExpense: number }
        return basari(stats as unknown as T)
      }

      default:
        throw new Error(`Bilinmeyen uç nokta: ${url}`)
    }
  },

  // POST — oluşturma
  async post<T>(url: string, body?: unknown): Promise<T> {
    const [path] = url.split('?')
    const db = await dbx()
    const b = (body ?? {}) as Record<string, unknown>

    if (path === '/api/orders') {
      const orderType = ['masa', 'paket', 'gelal'].includes(String(b?.orderType)) ? String(b.orderType) : 'masa'
      const tableId = b?.tableId ? String(b.tableId) : null
      const customerName = b?.customerName ? String(b.customerName).trim().slice(0, 80) : null
      const note = b?.note ? String(b.note).trim() : null
      const rawItems = Array.isArray(b?.items) ? b.items : []

      let tableName: string | null = null
      if (orderType === 'masa') {
        if (!tableId) throw new Error('Masa seçilmeli')
        const masalar_ = await liste<{ id: string; name?: string }>('tables')
        const masa = masalar_.find((m) => m.id === tableId)
        if (!masa) throw new Error('Masa bulunamadı')
        tableName = masa.name ?? null
      }
      if (rawItems.length === 0) throw new Error('Sepet boş')

      const urunler = await liste<ProductDTO>('products', 'createdAt')
      const itemRows: { productId: string; name: string; price: number; quantity: number; note: string | null }[] = []
      for (const raw of rawItems) {
        const quantity = Math.max(1, Math.min(50, Math.floor(Number(raw?.quantity) || 1)))
        const itemNote = raw?.note ? String(raw.note).trim().slice(0, 200) : null
        if (raw?.productId) {
          const urun = urunler.find((u) => u.id === String(raw.productId))
          if (!urun || !urun.available) continue
          itemRows.push({ productId: urun.id, name: urun.name, price: urun.price, quantity, note: itemNote })
        }
      }
      if (itemRows.length === 0) throw new Error('Geçerli ürün bulunamadı')

      const total = itemRows.reduce((s, i) => s + i.price * i.quantity, 0)
      const kayit = await addDoc(collection(db, 'orders'), {
        tableId: orderType === 'masa' ? tableId : null,
        tableName: orderType === 'masa' ? tableName : null,
        orderType,
        customerName: orderType === 'masa' ? null : customerName,
        status: 'new',
        total,
        note,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: itemRows.map((i) => ({ id: crypto.randomUUID(), ...i })),
      })
      return basari({ id: kayit.id } as unknown as T)
    }

    // Kullanıcı davet kodu üretimi
    if (path === '/api/users/invite') {
      const kod = Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('')
      await addDoc(collection(db, 'invites'), {
        code: kod,
        role: b?.role ?? 'garson',
        kullanildi: false,
        olusturan: b?.olusturan ?? '',
        createdAt: new Date(),
      })
      return basari({ code: kod } as unknown as T)
    }

    // Tanım koleksiyonları — ortak oluşturma
    const tanimlar: Record<string, string> = {
      '/api/units': 'units',
      '/api/features': 'features',
      '/api/vat-rates': 'vatRates',
      '/api/discounts': 'discounts',
      '/api/kitchen-groups': 'kitchenGroups',
      '/api/customers': 'customers',
      '/api/odenmezler': 'nonpayers',
      '/api/expenses': 'expenses',
      '/api/wastes': 'wastes',
    }
    if (tanimlar[path]) {
      const kol = tanimlar[path]
      const veri = hazirla(kol, b)
      const kayit = await addDoc(collection(db, kol), { ...veri, createdAt: new Date() })
      return basari({ id: kayit.id } as unknown as T)
    }

    throw new Error(`Bilinmeyen uç nokta: ${url}`)
  },

  // PATCH — güncelleme
  async patch<T>(url: string, body?: unknown): Promise<T> {
    const [path] = url.split('?')
    const db = await dbx()
    const b = (body ?? {}) as Record<string, unknown>

    // /api/orders/[id] aksiyonları
    const siparisEslesme = path.match(/^\/api\/orders\/([^/]+)$/)
    if (siparisEslesme) {
      const id = siparisEslesme[1]
      const ref = doc(db, 'orders', id)
      const action = String(b?.action ?? '')

      if (action === 'setStatus') {
        await updateDoc(ref, { status: String(b?.status ?? 'new'), updatedAt: new Date() })
        return basari({} as T)
      }
      if (action === 'pay') {
        await updateDoc(ref, { status: 'paid', paidAt: new Date(), updatedAt: new Date() })
        return basari({} as T)
      }
      if (action === 'updateNote') {
        await updateDoc(ref, { note: b?.note ? String(b.note).trim() : null, updatedAt: new Date() })
        return basari({} as T)
      }
      if (action === 'addItems') {
        const mevcut = await getDoc(ref)
        const data = mevcut.data()
        const items = Array.isArray(data?.items) ? data!.items : []
        const urunler = await liste<ProductDTO>('products', 'createdAt')
        const yeniler: DocumentData[] = [...items]
        for (const raw of Array.isArray(b?.items) ? b.items : []) {
          const quantity = Math.max(1, Math.min(50, Math.floor(Number(raw?.quantity) || 1)))
          const urun = urunler.find((u) => u.id === String(raw?.productId))
          if (!urun) continue
          // Aynı ürün + not varsa adet artır
          const ayni = yeniler.find(
            (x) => x.productId === urun.id && (x.note ?? null) === (raw?.note ? String(raw.note).trim() : null)
          )
          if (ayni) {
            ayni.quantity += quantity
          } else {
            yeniler.push({
              id: crypto.randomUUID(),
              productId: urun.id,
              name: urun.name,
              price: urun.price,
              quantity,
              note: raw?.note ? String(raw.note).trim().slice(0, 200) : null,
            })
          }
        }
        const total = yeniler.reduce((s: number, i) => s + Number(i.price) * Number(i.quantity), 0)
        await updateDoc(ref, { items: yeniler, total, updatedAt: new Date() })
        return basari({ merged: true } as unknown as T)
      }
      if (action === 'replaceItems') {
        const urunler = await liste<ProductDTO>('products', 'createdAt')
        const itemRows: DocumentData[] = []
        for (const raw of Array.isArray(b?.items) ? b.items : []) {
          const quantity = Math.max(1, Math.min(50, Math.floor(Number(raw?.quantity) || 1)))
          const urun = urunler.find((u) => u.id === String(raw?.productId))
          if (!urun) continue
          itemRows.push({
            id: crypto.randomUUID(),
            productId: urun.id,
            name: urun.name,
            price: urun.price,
            quantity,
            note: raw?.note ? String(raw.note).trim().slice(0, 200) : null,
          })
        }
        const total = itemRows.reduce((s: number, i) => s + Number(i.price) * Number(i.quantity), 0)
        await updateDoc(ref, { items: itemRows, total, updatedAt: new Date() })
        return basari({} as T)
      }
      if (action === 'move') {
        const hedefId = String(b?.tableId ?? '')
        const hedefDoc = await getDoc(doc(db, 'tables', hedefId))
        const hedef = hedefDoc.data() as { name?: string } | undefined
        await updateDoc(ref, { tableId: hedefId, tableName: hedef?.name ?? null, updatedAt: new Date() })
        return basari({ merged: false } as unknown as T)
      }
      throw new Error('Bilinmeyen aksiyon')
    }

    // Tanım koleksiyonları — ortak güncelleme
    const tanimlar: Record<string, string> = {
      '/api/units': 'units',
      '/api/features': 'features',
      '/api/vat-rates': 'vatRates',
      '/api/discounts': 'discounts',
      '/api/kitchen-groups': 'kitchenGroups',
      '/api/customers': 'customers',
      '/api/odenmezler': 'nonpayers',
      '/api/expenses': 'expenses',
      '/api/wastes': 'wastes',
    }
    if (tanimlar[path] && b?.id) {
      await updateDoc(doc(db, tanimlar[path], String(b.id)), hazirla(tanimlar[path], b))
      return basari({} as T)
    }

    throw new Error(`Bilinmeyen uç nokta: ${url}`)
  },

  // DELETE — silme
  async del<T>(url: string): Promise<T> {
    const [path, qs] = url.split('?')
    const db = await dbx()
    const params = new URLSearchParams(qs ?? '')

    const siparisEslesme = path.match(/^\/api\/orders\/([^/]+)$/)
    if (siparisEslesme) {
      await deleteDoc(doc(db, 'orders', siparisEslesme[1]))
      return basari({} as T)
    }

    const tanimlar: Record<string, string> = {
      '/api/units': 'units',
      '/api/features': 'features',
      '/api/vat-rates': 'vatRates',
      '/api/discounts': 'discounts',
      '/api/kitchen-groups': 'kitchenGroups',
      '/api/customers': 'customers',
      '/api/odenmezler': 'nonpayers',
      '/api/expenses': 'expenses',
      '/api/wastes': 'wastes',
    }
    if (tanimlar[path] && params.get('id')) {
      await deleteDoc(doc(db, tanimlar[path], params.get('id')!))
      return basari({} as T)
    }

    throw new Error(`Bilinmeyen uç nokta: ${url}`)
  },
}

export { firebaseYapilandirildi }
