// Veri modelleri — Firestore dokümanları Prisma model alanlarıyla aynı
// şekildedir; böylece görünümler ve uyumluluk katmanı tutarlı çalışır.

export interface Kategori {
  id: string
  name: string
  emoji: string
  sortOrder: number
  createdAt?: unknown
}

export interface Urun {
  id: string
  categoryId: string
  name: string
  description?: string | null
  price: number
  emoji?: string
  color?: string
  available: boolean
  popular?: boolean
  createdAt?: unknown
}

export interface Birim {
  id: string
  name: string
  sortOrder?: number
  createdAt?: unknown
}

export interface Ozellik {
  id: string
  name: string
  price: number
  createdAt?: unknown
}

export interface KdvOrani {
  id: string
  rate: number
  createdAt?: unknown
}

export interface Indirim {
  id: string
  name: string
  type: 'percent' | 'amount'
  value: number
  createdAt?: unknown
}

export interface MutfakGrubu {
  id: string
  name: string
  createdAt?: unknown
}

export interface Musteri {
  id: string
  name: string
  phone?: string | null
  address?: string | null
  note?: string | null
  createdAt?: unknown
}

export interface Odenmez {
  id: string
  name: string
  unvan?: string | null
  createdAt?: unknown
}

export interface Masa {
  id: string
  name: string
  zone: string
  seats: number
  createdAt?: unknown
}

export interface Siparis {
  id: string
  tableId?: string | null
  tableName?: string | null
  orderType: 'masa' | 'paket' | 'gelal'
  customerName?: string | null
  status: string
  total: number
  note?: string | null
  createdAt?: unknown
  updatedAt?: unknown
  paidAt?: unknown
  items: SiparisKalemi[]
}

export interface SiparisKalemi {
  id: string
  productId: string | null
  name: string
  price: number
  quantity: number
  note?: string | null
}

export interface Gider {
  id: string
  name: string
  amount: number
  category: string
  note?: string | null
  spentAt?: unknown
  createdAt?: unknown
}

export interface Zayi {
  id: string
  name: string
  quantity: number
  unit: string
  amount: number
  reason?: string | null
  wastedAt?: unknown
  createdAt?: unknown
}

export interface KullaniciProfili {
  id: string
  uid: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'yonetici' | 'garson' | 'kasa' | 'mutfak'
  sonGiris?: string
  createdAt?: unknown
}

export interface DavetKodu {
  id: string
  code: string
  role: KullaniciProfili['role']
  kullanildi: boolean
  olusturan: string
  createdAt?: unknown
}
