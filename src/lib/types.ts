// Paylaşılan tipler (istemci + sunucu)
export type View = 'menu' | 'pos' | 'kitchen' | 'admin'

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'paid'

export type OrderType = 'masa' | 'paket' | 'gelal'

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  masa: 'Masa',
  paket: 'Paket',
  gelal: 'Gel-Al',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Yeni',
  preparing: 'Hazırlanıyor',
  ready: 'Hazır',
  delivered: 'Teslim Edildi',
  paid: 'Ödendi',
}

export const ACTIVE_STATUSES: OrderStatus[] = ['new', 'preparing', 'ready', 'delivered']

export type CategoryDTO = {
  id: string
  name: string
  emoji: string
  sortOrder: number
  products: ProductDTO[]
}

export type ProductDTO = {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  emoji: string
  color: string
  available: boolean
  popular: boolean
}

export type OrderItemDTO = {
  id: string
  productId: string | null
  name: string
  price: number
  quantity: number
  note: string | null
}

export type OrderDTO = {
  id: string
  tableId: string | null
  orderType: OrderType
  customerName: string | null
  tableName: string
  status: OrderStatus
  total: number
  note: string | null
  createdAt: string
  items: OrderItemDTO[]
}

export type TableDTO = {
  id: string
  name: string
  zone: string
  seats: number
  openOrderId: string | null
  openOrderStatus: OrderStatus | null
  openOrderTotal: number
  openOrderItems: number
  lastOrderAt: string | null
}

export type StatsDTO = {
  todayRevenue: number
  todayOrders: number
  avgTicket: number
  activeOrders: number
  openTotal: number
  monthRevenue: number
  hourly: { label: string; revenue: number }[]
  productCount: number
  tableCount: number
  last7days: { date: string; label: string; revenue: number; orders: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  categoryShare: { name: string; emoji: string; revenue: number }[]
}

// Ürün kartı renk paleti (Tailwind sınıfları statik olmalı; anahtar adları veritabanıyla uyumlu)
export const PRODUCT_COLORS: Record<string, string> = {
  violet: 'from-brand-100 to-brand-50',
  amber: 'from-amber-100 to-orange-50',
  rose: 'from-rose-100 to-pink-50',
  orange: 'from-orange-100 to-amber-50',
  lime: 'from-lime-100 to-green-50',
  stone: 'from-stone-200 to-stone-100',
  red: 'from-red-100 to-orange-50',
  yellow: 'from-yellow-100 to-amber-50',
}

export function productGradient(color: string): string {
  return PRODUCT_COLORS[color] ?? PRODUCT_COLORS.violet
}

export function formatTL(value: number): string {
  // Tutar her zaman 2 haneli gösterilir: ₺150,00
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
