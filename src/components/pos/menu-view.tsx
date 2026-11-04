'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import {
  formatTL,
  productGradient,
  type CategoryDTO,
  type OrderDTO,
  type ProductDTO,
} from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, Plus, Search, Send, ShoppingBag, Sparkles, X } from 'lucide-react'

type CartLine = { productId: string; quantity: number; note: string }
type TableLite = { id: string; name: string }

export function MenuView() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<CategoryDTO[] | null>(null)
  const [tables, setTables] = useState<TableLite[]>([])
  const [activeCat, setActiveCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [tableId, setTableId] = useState<string>('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [detail, setDetail] = useState<ProductDTO | null>(null)
  const [detailQty, setDetailQty] = useState(1)
  const [detailNote, setDetailNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])
  usePosEvents(useCallback((e) => {
    if (['order:new', 'menu:changed', 'order:deleted'].includes(e.event)) refetch()
  }, [refetch]))
  useInterval(refetch, 20000)

  useEffect(() => {
    // QR bağlantısından masa (?masa=<id>) ve görünüm parametresi
    const params = new URLSearchParams(window.location.search)
    const masa = params.get('masa')
    if (masa) {
      try { localStorage.setItem('adisyon:table', masa) } catch {}
    }
    const saved = masa ?? (() => { try { return localStorage.getItem('adisyon:table') } catch { return null } })()
    if (saved) setTableId(saved)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [menu, tableData] = await Promise.all([
          api.get<CategoryDTO[]>('/api/menu'),
          api.get<TableLite[]>('/api/tables'),
        ])
        if (cancelled) return
        setCategories(menu)
        setTables(tableData.map((t) => ({ id: t.id, name: t.name })))
      } catch (err) {
        if (!cancelled) toast({ title: 'Menü yüklenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
      }
    }
    load()
    return () => { cancelled = true }
  }, [version, toast])

  const productsById = useMemo(() => {
    const map = new Map<string, ProductDTO>()
    categories?.forEach((c) => c.products.forEach((p) => map.set(p.id, p)))
    return map
  }, [categories])

  const filtered = useMemo(() => {
    if (!categories) return []
    const q = search.trim().toLocaleLowerCase('tr-TR')
    return categories
      .filter((c) => activeCat === 'all' || c.id === activeCat)
      .map((c) => ({
        ...c,
        products: c.products.filter((p) => {
          if (q && !`${p.name} ${p.description ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)) return false
          return true
        }),
      }))
      .filter((c) => c.products.length > 0)
  }, [categories, activeCat, search])

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0)
  const cartTotal = cart.reduce((s, l) => {
    const p = productsById.get(l.productId)
    return p ? s + p.price * l.quantity : s
  }, 0)

  function addToCart(product: ProductDTO, quantity: number, note: string) {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === product.id && (l.note ?? '') === note)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
        return next
      }
      return [...prev, { productId: product.id, quantity, note }]
    })
    toast({ title: 'Sepete eklendi', description: `${product.emoji} ${product.name} × ${quantity}` })
  }

  function changeLine(idx: number, delta: number) {
    setCart((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], quantity: next[idx].quantity + delta }
      if (next[idx].quantity <= 0) next.splice(idx, 1)
      return next
    })
  }

  function removeLine(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx))
  }

  async function submitOrder() {
    if (!tableId) {
      toast({ title: 'Masanızı seçin', description: 'Sipariş vermek için önce masanızı seçmelisiniz.', variant: 'destructive' })
      setCartOpen(false)
      return
    }
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const order = await api.post<OrderDTO>('/api/orders', {
        tableId,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, note: l.note || undefined })),
      })
      setCart([])
      setCartOpen(false)
      toast({ title: 'Siparişiniz alındı! 🎉', description: `${order.tableName} • ${order.items.length} çeşit • ${formatTL(order.total)} — Mutfak bilgilendirildi.` })
    } catch (err) {
      toast({ title: 'Sipariş gönderilemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8.5rem)]">
      {/* Restoran başlığı */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 text-white p-5 sm:p-7 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Lezzet Durağı</h1>
            <p className="text-white/85 text-sm mt-1">Kahvaltı • Kebap • Burger • Kahve — her gün 09:00-23:00</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Dijital Menü
          </Badge>
        </div>
      </div>

      {/* Araç çubuğu: masa seçimi + arama */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Select value={tableId} onValueChange={(v) => { setTableId(v); try { localStorage.setItem('adisyon:table', v) } catch {} }}>
          <SelectTrigger className="w-full sm:w-44 bg-white" aria-label="Masa seçimi">
            <ShoppingBag className="w-4 h-4 mr-1 text-brand-600" />
            <SelectValue placeholder="Masanızı seçin" />
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Menüde ara… (ör. burger, kahve)" className="pl-9 bg-white" aria-label="Menüde ara" />
        </div>
      </div>

      {/* Kategori sekmeleri */}
      <div className="mt-3 -mx-1 px-1 pb-1 overflow-x-auto nice-scroll">
        <div className="flex gap-2 w-max">
          <button
            onClick={() => setActiveCat('all')}
            className={`shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors ${activeCat === 'all' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-foreground border hover:bg-brand-50'}`}
          >
            ✨ Tümü
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors ${activeCat === c.id ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-foreground border hover:bg-brand-50'}`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Ürün listesi */}
      <div className="mt-4 flex-1">
        {!categories ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-2">🔍</div>
            <p className="font-medium">Sonuç bulunamadı</p>
            <p className="text-sm mt-1">Aramanızı değiştirin veya başka bir kategori seçin.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <section key={c.id} className="mb-6" aria-label={c.name}>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">{c.emoji}</span> {c.name}
                <span className="text-xs font-normal text-muted-foreground">({c.products.length} ürün)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {c.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setDetail(p); setDetailQty(1); setDetailNote('') }}
                    disabled={!p.available}
                    className="group text-left rounded-2xl border bg-white p-3 flex gap-3 items-center shadow-sm transition-all hover:shadow-md hover:border-brand-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${productGradient(p.color)} flex items-center justify-center text-3xl shrink-0 transition-transform group-hover:scale-105`}>
                      {p.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{p.name}</p>
                        {p.popular && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] px-1.5">Popüler</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-bold text-brand-700 text-sm">{formatTL(p.price)}</span>
                        {!p.available ? (
                          <span className="text-[11px] text-stone-400">Tükendi</span>
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Sepet çubuğu (mobil öncelikli) */}
      {cartCount > 0 && (
        <div className="sticky bottom-20 sm:bottom-4 z-30 order-pop">
          <Button
            onClick={() => setCartOpen(true)}
            className="w-full h-12 rounded-2xl text-base shadow-lg bg-brand-600 hover:bg-brand-700 justify-between px-5"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {cartCount} ürün
            </span>
            <span className="font-bold">{formatTL(cartTotal)}</span>
          </Button>
        </div>
      )}

      {/* Ürün detay penceresi */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${productGradient(detail.color)} flex items-center justify-center text-4xl mx-auto`}>
                  {detail.emoji}
                </div>
                <DialogTitle className="text-center mt-2">{detail.name}</DialogTitle>
                <DialogDescription className="text-center">{detail.description}</DialogDescription>
                <p className="text-center font-bold text-brand-700 text-lg">{formatTL(detail.price)}</p>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setDetailQty((q) => Math.max(1, q - 1))} aria-label="Azalt">
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">{detailQty}</span>
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setDetailQty((q) => Math.min(20, q + 1))} aria-label="Arttır">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={detailNote}
                  onChange={(e) => setDetailNote(e.target.value)}
                  placeholder="Notunuz (ör. soğansız, az acılı…)"
                  rows={2}
                  maxLength={200}
                />
              </div>
              <DialogFooter>
                <Button
                  className="w-full bg-brand-600 hover:bg-brand-700 h-11"
                  onClick={() => {
                    addToCart(detail, detailQty, detailNote.trim())
                    setDetail(null)
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Sepete Ekle — {formatTL(detail.price * detailQty)}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sepet paneli */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-600" /> Sepetiniz
            </SheetTitle>
            <SheetDescription>
              {tableId ? `Masa: ${tables.find((t) => t.id === tableId)?.name ?? '—'}` : 'Henüz masa seçmediniz'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 nice-scroll">
            {cart.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground">
                <div className="text-4xl mb-2">🛒</div>
                <p className="font-medium">Sepetiniz boş</p>
                <p className="text-sm">Menüden ürün ekleyin.</p>
              </div>
            ) : (
              <ul className="space-y-3 py-2">
                {cart.map((line, idx) => {
                  const p = productsById.get(line.productId)
                  if (!p) return null
                  return (
                    <li key={`${line.productId}-${idx}`} className="rounded-xl border bg-white p-3 flex gap-3 items-center">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${productGradient(p.color)} flex items-center justify-center text-2xl shrink-0`}>
                        {p.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        {line.note && <p className="text-xs text-brand-600 truncate">📝 {line.note}</p>}
                        <p className="text-sm font-bold text-brand-700">{formatTL(p.price * line.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeLine(idx, -1)} aria-label="Azalt">
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-sm font-semibold w-5 text-center">{line.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeLine(idx, 1)} aria-label="Arttır">
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-400 hover:text-red-500" onClick={() => removeLine(idx)} aria-label="Kaldır">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <SheetFooter className="border-t">
            <div className="w-full space-y-3">
              <div className="flex justify-between text-base font-semibold">
                <span>Toplam</span>
                <span className="text-brand-700">{formatTL(cartTotal)}</span>
              </div>
              <Button className="w-full bg-brand-600 hover:bg-brand-700 h-12 text-base" disabled={cart.length === 0 || submitting} onClick={submitOrder}>
                {submitting ? 'Gönderiliyor…' : (<><Send className="w-4 h-4 mr-2" /> Siparişi Gönder</>)}
              </Button>
              {!tableId && <p className="text-xs text-center text-red-500">⚠️ Sipariş için masa seçmelisiniz.</p>}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
