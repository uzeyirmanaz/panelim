'use client'

// Satış ekranı — orijinal panel POS akışı:
// 1) Masa Seç (veya Gel-Al / Paket) → 2) Ürün Ekle (sepete, dokunarak) → 3) Gönder
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import {
  formatTL,
  productGradient,
  type CategoryDTO,
  type OrderType,
  type ProductDTO,
  type TableDTO,
} from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Armchair, Check, Coffee, Minus, Plus, ShoppingCart, ShoppingBag, Users } from 'lucide-react'

const TYPE_TABS: { type: OrderType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'masa', label: 'Masa', icon: Armchair },
  { type: 'paket', label: 'Paket', icon: ShoppingBag },
  { type: 'gelal', label: 'Gel-Al', icon: Coffee },
]

type CartLine = { product: ProductDTO; quantity: number }

export function PosView() {
  const { toast } = useToast()
  const [tables, setTables] = useState<TableDTO[] | null>(null)
  const [menu, setMenu] = useState<CategoryDTO[] | null>(null)
  const [orderType, setOrderType] = useState<OrderType>('masa')
  const [tableId, setTableId] = useState<string | null>(null)
  const [zone, setZone] = useState<string>('all')
  const [customerName, setCustomerName] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  const refetch = useCallback(() => {
    api.get<TableDTO[]>('/api/tables').then(setTables).catch(() => {})
  }, [])
  usePosEvents(useCallback((e) => {
    if (['order:new', 'order:updated', 'order:paid', 'order:deleted', 'table:changed'].includes(e.event)) refetch()
  }, [refetch]))
  useInterval(refetch, 10000)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get<TableDTO[]>('/api/tables'),
      api.get<CategoryDTO[]>('/api/menu'),
    ])
      .then(([t, m]) => {
        if (cancelled) return
        setTables(t)
        setMenu(m)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const selectedTable = tables?.find((t) => t.id === tableId) ?? null
  const zones = useMemo(() => Array.from(new Set((tables ?? []).map((t) => t.zone))), [tables])
  const visibleTables = useMemo(
    () => (tables ?? []).filter((t) => zone === 'all' || t.zone === zone),
    [tables, zone]
  )

  // Sepet toplamları
  const cartTotal = cart.reduce((s, l) => s + l.product.price * l.quantity, 0)
  const cartCount = cart.reduce((s, l) => s + l.quantity, 0)

  function bump(product: ProductDTO, delta: number) {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.product.id === product.id)
      if (idx === -1) {
        if (delta <= 0) return prev
        return [...prev, { product, quantity: 1 }]
      }
      const next = [...prev]
      const q = next[idx].quantity + delta
      if (q <= 0) next.splice(idx, 1)
      else next[idx] = { ...next[idx], quantity: Math.min(50, q) }
      return next
    })
  }

  function resetTarget() {
    setTableId(null)
    setCustomerName('')
    setNote('')
    setCart([])
  }

  const targetReady = orderType === 'masa' ? !!selectedTable : true

  async function send() {
    if (cart.length === 0 || !targetReady || sending) return
    setSending(true)
    try {
      if (orderType === 'masa' && selectedTable) {
        const items = cart.map((l) => ({ productId: l.product.id, quantity: l.quantity }))
        if (selectedTable.openOrderId) {
          // Masada açık adisyon var → üzerine ekle
          await api.patch(`/api/orders/${selectedTable.openOrderId}`, { action: 'addItems', items })
        } else {
          await api.post('/api/orders', { orderType: 'masa', tableId: selectedTable.id, items, note: note || null })
        }
        toast({ title: 'Adisyon güncellendi ✓', description: `${selectedTable.name} • ${cartCount} ürün • ${formatTL(cartTotal)}` })
      } else {
        await api.post('/api/orders', {
          orderType,
          customerName: customerName.trim() || null,
          items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          note: note || null,
        })
        toast({ title: 'Sipariş gönderildi ✓', description: `${orderType === 'paket' ? 'Paket' : 'Gel-Al'} • ${cartCount} ürün • ${formatTL(cartTotal)}` })
        resetTarget()
      }
      setCart([])
      setNote('')
      refetch()
    } catch (err) {
      toast({ title: 'Sipariş gönderilemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  if (!tables || !menu) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* 1. Adım: sipariş tipi — Masa / Paket / Gel-Al */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex rounded-xl border bg-white p-1 shadow-sm">
          {TYPE_TABS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => { setOrderType(type); resetTarget() }}
              className={cn(
                'flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors',
                orderType === type ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-soft hover:bg-brand-50 hover:text-brand-700'
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {orderType !== 'masa' && (
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={orderType === 'paket' ? 'Müşteri adı / telefon (opsiyonel)' : 'Müşteri adı (opsiyonel)'}
            className="w-full sm:w-72 bg-white"
            aria-label="Müşteri adı"
          />
        )}
      </div>

      {/* Masa modu + hedef seçilmemiş → masa seçim ızgarası */}
      {orderType === 'masa' && !selectedTable ? (
        <div>
          <p className="text-sm font-semibold text-ink-soft mb-3">1. Masa Seç</p>
          {zones.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <ZoneChip active={zone === 'all'} onClick={() => setZone('all')} label="Tümü" count={tables.length} />
              {zones.map((z) => (
                <ZoneChip key={z} active={zone === z} onClick={() => setZone(z)} label={z} count={tables.filter((t) => t.zone === z).length} />
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {visibleTables.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTableId(t.id)}
                className={cn(
                  'relative rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  t.openOrderId ? 'bg-brand-50 border-brand-200' : 'bg-white border-dashed'
                )}
              >
                <div className="flex items-center justify-between">
                  <Armchair className={cn('w-6 h-6', t.openOrderId ? 'text-brand-600' : 'text-stone-300')} />
                  {t.openOrderId ? <Badge className="bg-brand-600 border-0 text-[10px]">Dolu</Badge> : <Badge variant="outline" className="bg-white text-[10px] text-stone-400">Boş</Badge>}
                </div>
                <p className="font-bold mt-3 text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {t.seats} kişilik • {t.zone}</p>
                {t.openOrderId && (
                  <p className="text-sm font-bold mt-1.5 text-brand-700">{formatTL(t.openOrderTotal)}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* 2. Adım: ürün ekle + sepet */
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          {/* Ürün ızgarası (kategori şeritleriyle) */}
          <ProductGrid menu={menu} cart={cart} onBump={bump} />

          {/* Sepet */}
          <CartPanel
            className="xl:sticky xl:top-20"
            orderType={orderType}
            selectedTable={selectedTable}
            customerName={customerName}
            cart={cart}
            cartTotal={cartTotal}
            cartCount={cartCount}
            note={note}
            setNote={setNote}
            onBump={bump}
            onClear={() => setCart([])}
            onChangeTarget={resetTarget}
            onSend={send}
            sending={sending}
          />
        </div>
      )}
    </div>
  )
}

function ZoneChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 rounded-full border px-3.5 text-xs font-semibold transition-colors',
        active ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700'
      )}
    >
      {label} <span className={cn('ml-1', active ? 'text-white/70' : 'text-stone-400')}>{count}</span>
    </button>
  )
}

// Kategori butonu
function CatButton({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-[13px] font-medium transition-colors',
        active ? 'border-brand-200 bg-brand-50 text-brand-700 font-semibold' : 'border-transparent bg-white text-ink-soft hover:bg-brand-50/60'
      )}
    >
      <span className="text-base">{emoji}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

function ProductGrid({ menu, cart, onBump }: { menu: CategoryDTO[]; cart: CartLine[]; onBump: (p: ProductDTO, d: number) => void }) {
  const [activeCat, setActiveCat] = useState('all')
  const products = useMemo(
    () =>
      menu
        .filter((c) => activeCat === 'all' || c.id === activeCat)
        .flatMap((c) => c.products)
        .filter((p) => p.available),
    [menu, activeCat]
  )
  const qtyOf = (id: string) => cart.find((l) => l.product.id === id)?.quantity ?? 0

  return (
    <div className="min-w-0">
      <div className="flex lg:hidden flex-wrap gap-1.5 mb-3">
        <CatButton active={activeCat === 'all'} onClick={() => setActiveCat('all')} emoji="🍽️" label="Tümü" />
        {menu.map((c) => (
          <CatButton key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} emoji={c.emoji} label={c.name} />
        ))}
      </div>
      <div className="hidden lg:block mb-3">
        <CatRailInline categories={menu} active={activeCat} onChange={setActiveCat} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-2.5">
        {products.map((p) => {
          const q = qtyOf(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onBump(p, 1)}
              className={cn(
                'relative rounded-2xl border bg-white p-3 text-left shadow-sm transition-all hover:shadow-md hover:border-brand-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                q > 0 && 'border-brand-400 bg-brand-50/60'
              )}
            >
              {q > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white shadow">
                  {q}
                </span>
              )}
              <div className={cn('mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl', productGradient(p.color))}>
                {p.emoji}
              </div>
              <p className="text-[13px] font-semibold leading-tight line-clamp-2 min-h-[2.1em]">{p.name}</p>
              <p className="mt-1 text-sm font-bold text-brand-700">{formatTL(p.price)}</p>
              {p.popular && <Badge className="mt-1.5 bg-amber-100 text-amber-700 border-0 text-[10px] hover:bg-amber-100">⭐ Popüler</Badge>}
            </button>
          )
        })}
        {products.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">Bu kategoride ürün yok</p>
        )}
      </div>
    </div>
  )
}

// Yatay kategori şeridi (masaüstü)
function CatRailInline({ categories, active, onChange }: { categories: CategoryDTO[]; active: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto nice-scroll pb-1">
      <CatButton active={active === 'all'} onClick={() => onChange('all')} emoji="🍽️" label="Tümü" />
      {categories.map((c) => (
        <CatButton key={c.id} active={active === c.id} onClick={() => onChange(c.id)} emoji={c.emoji} label={c.name} />
      ))}
    </div>
  )
}

function CartPanel(props: {
  className?: string
  orderType: OrderType
  selectedTable: TableDTO | null
  customerName: string
  cart: CartLine[]
  cartTotal: number
  cartCount: number
  note: string
  setNote: (v: string) => void
  onBump: (p: ProductDTO, d: number) => void
  onClear: () => void
  onChangeTarget: () => void
  onSend: () => void
  sending: boolean
}) {
  const { selectedTable } = props
  const targetLabel =
    props.orderType === 'masa'
      ? selectedTable?.name ?? ''
      : `${props.orderType === 'paket' ? 'Paket' : 'Gel-Al'}${props.customerName.trim() ? ` • ${props.customerName.trim()}` : ''}`
  return (
    <section className={cn('rounded-2xl border bg-white shadow-sm overflow-hidden', props.className)} aria-label="Sepet">
      <div className="flex items-center justify-between gap-2 border-b bg-stone-50/80 px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <ShoppingCart className="h-3.5 w-3.5" /> Sipariş
          </p>
          <p className="truncate text-sm font-bold">{targetLabel}</p>
        </div>
        {props.orderType === 'masa' && (
          <Button size="sm" variant="ghost" className="h-8 text-xs text-brand-700 hover:text-brand-800" onClick={props.onChangeTarget}>
            Değiştir
          </Button>
        )}
      </div>

      {props.orderType === 'masa' && selectedTable?.openOrderId && (
        <div className="flex items-center justify-between border-b bg-brand-50/60 px-4 py-2 text-xs">
          <span className="text-brand-800">
            Mevcut adisyon: <b>{selectedTable.openOrderItems} ürün</b>
          </span>
          <span className="font-bold text-brand-800">{formatTL(selectedTable.openOrderTotal)}</span>
        </div>
      )}

      <div className="max-h-[300px] overflow-y-auto nice-scroll px-4 py-3 space-y-2 min-h-[120px]">
        {props.cart.length === 0 ? (
          <div className="flex h-[120px] flex-col items-center justify-center text-center text-muted-foreground">
            <ShoppingCart className="mb-1.5 h-7 w-7 text-stone-300" />
            <p className="text-sm font-medium">Sepet boş</p>
            <p className="text-xs">Ürünlere dokunarak ekleyin</p>
          </div>
        ) : (
          props.cart.map((l) => (
            <div key={l.product.id} className="flex items-center gap-2 rounded-xl border bg-white p-2">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-lg', productGradient(l.product.color))}>
                {l.product.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight">{l.product.name}</p>
                <p className="text-xs text-muted-foreground">{formatTL(l.product.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => props.onBump(l.product, -1)} aria-label={`${l.product.name} azalt`}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-6 text-center text-sm font-bold">{l.quantity}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => props.onBump(l.product, 1)} aria-label={`${l.product.name} arttır`}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2.5 border-t px-4 py-3">
        <Input
          value={props.note}
          onChange={(e) => props.setNote(e.target.value)}
          placeholder="Sipariş notu (opsiyonel)"
          className="h-9 bg-stone-50 text-[13px]"
          aria-label="Sipariş notu"
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{props.cartCount} ürün</span>
          <span className="text-lg font-extrabold tracking-tight">{formatTL(props.cartTotal)}</span>
        </div>
        <Button
          className="h-12 w-full bg-brand-600 text-[15px] font-bold hover:bg-brand-700 shadow-[0_8px_18px_-8px_rgba(192,39,31,0.55)]"
          disabled={props.cart.length === 0 || props.sending}
          onClick={props.onSend}
        >
          {props.sending ? (
            'Gönderiliyor…'
          ) : (
            <>
              <Check className="mr-1.5 h-4 w-4" /> Siparişi Gönder
            </>
          )}
        </Button>
        {props.cart.length > 0 && (
          <Button variant="ghost" className="h-8 w-full text-xs text-muted-foreground" onClick={props.onClear}>
            Sepeti Temizle
          </Button>
        )}
      </div>
    </section>
  )
}
