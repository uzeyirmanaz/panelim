'use client'

// Sipariş ekranı — orijinal panel POS sipariş girişi:
// koyu üst bar (geri, masa adı, arama, kişi, iptal) + solda adisyon fişi + sağda kategorili ürün ızgarası
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ClipboardList,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Undo2,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatTL, type CategoryDTO, type OrderDTO, type OrderType, type ProductDTO, type TableDTO } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Orijinaldeki kategori pili renkleri (sırayla uygulanır)
const PILL_COLORS = [
  'bg-[#f9a825] text-white',
  'bg-[#c92c2c] text-white',
  'bg-[#5c6bc0] text-white',
  'bg-[#cfd8dc] text-[#37474f]',
  'bg-[#e53935] text-white',
  'bg-[#90a4ae] text-white',
  'bg-[#00695c] text-white',
  'bg-[#00897b] text-white',
  'bg-[#26a69a] text-white',
  'bg-[#ff8a65] text-white',
  'bg-[#8d6e63] text-white',
  'bg-[#7e57c2] text-white',
]

type Line = { productId: string; name: string; price: number; quantity: number }

// Bağlam: masa siparişi mi, paket/gel-al mi? (statik export uyumlu: ?masa= sorgu parametresi)
function useOrderContext() {
  const searchParams = useSearchParams()
  const key = searchParams.get('masa') ?? ''
  const kind: 'table' | 'paket' | 'gelal' = key === 'paket' ? 'paket' : key === 'gelal' ? 'gelal' : 'table'
  return { key, kind }
}

export function OrderScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const { key, kind } = useOrderContext()

  const [tables, setTables] = useState<TableDTO[] | null>(null)
  const [menu, setMenu] = useState<CategoryDTO[] | null>(null)
  const [openOrder, setOpenOrder] = useState<OrderDTO | null>(null)
  const [lines, setLines] = useState<Line[]>([]) // yerel fiş
  const [savedLines, setSavedLines] = useState<Line[]>([]) // sunucudaki hali
  const [search, setSearch] = useState('')
  const [catPage, setCatPage] = useState(0)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [qtyFor, setQtyFor] = useState<string | null>(null) // adet açılır penceresi
  const [saving, setSaving] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const title =
    kind === 'paket' ? 'Paket Sipariş' : kind === 'gelal' ? 'Gel-Al Sipariş' : tables?.find((t) => t.id === key)?.name ?? '…'

  // Adisyon numarası — kimlikten kararlı türetilir (#109 biçimi)
  const adisyonNo = openOrder
    ? (() => {
        let s = 0
        for (let i = 0; i < openOrder.id.length; i++) s = (s * 31 + openOrder.id.charCodeAt(i)) >>> 0
        return 100 + (s % 900)
      })()
    : null

  // Veri yükleme
  useEffect(() => {
    let cancelled = false
    Promise.all([
      kind === 'table' ? api.get<TableDTO[]>('/api/tables') : Promise.resolve([] as TableDTO[]),
      api.get<CategoryDTO[]>('/api/menu'),
    ])
      .then(([t, m]) => {
        if (cancelled) return
        setTables(t)
        setMenu(m)
        setActiveCat(m[0]?.id ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [kind])

  // Masada açık adisyon varsa fişe yükle
  useEffect(() => {
    if (kind !== 'table' || !tables) return
    const t = tables.find((x) => x.id === key)
    if (!t?.openOrderId) {
      setOpenOrder(null)
      setLines([])
      setSavedLines([])
      return
    }
    api.get<OrderDTO[]>('/api/orders?scope=active')
      .then((orders) => {
        const o = orders.find((x) => x.id === t.openOrderId) ?? null
        setOpenOrder(o)
        const l = (o?.items ?? []).map((i) => ({ productId: i.productId ?? i.id, name: i.name, price: i.price, quantity: i.quantity }))
        setLines(l)
        setSavedLines(l)
      })
      .catch(() => {})
  }, [kind, key, tables])

  // Ürünler: arama + seçili kategori
  const products = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR')
    const src = menu ?? []
    return src
      .filter((c) => (q ? true : c.id === activeCat))
      .flatMap((c) => c.products.filter((p) => p.available && (!q || p.name.toLocaleLowerCase('tr-TR').includes(q))))
  }, [menu, activeCat, search])

  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  const dirty = useMemo(() => {
    if (lines.length !== savedLines.length) return true
    return lines.some((l, i) => {
      const s = savedLines[i]
      return !s || s.productId !== l.productId || s.quantity !== l.quantity
    })
  }, [lines, savedLines])

  function bump(p: ProductDTO, delta: number) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id)
      if (idx === -1) {
        if (delta <= 0) return prev
        return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]
      }
      const next = [...prev]
      const q = next[idx].quantity + delta
      if (q <= 0) next.splice(idx, 1)
      else next[idx] = { ...next[idx], quantity: Math.min(50, q) }
      return next
    })
  }

  function setQty(p: ProductDTO, q: number) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id)
      if (idx === -1) {
        if (q <= 0) return prev
        return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: Math.min(50, q) }]
      }
      const next = [...prev]
      if (q <= 0) next.splice(idx, 1)
      else next[idx] = { ...next[idx], quantity: Math.min(50, q) }
      return next
    })
  }

  const qtyProduct = useMemo(() => products.find((p) => p.id === qtyFor) ?? null, [products, qtyFor])
  const qtyCurrent = qtyProduct ? lines.find((l) => l.productId === qtyProduct.id)?.quantity ?? 0 : 0

  async function save() {
    if (lines.length === 0 || saving) return
    setSaving(true)
    try {
      if (kind === 'table') {
        if (openOrder) {
          // Mevcut adisyonu güncelle (adet değişiklikleri, silinenler dahil)
          if (dirty) {
            const updated = await api.patch<OrderDTO>(`/api/orders/${openOrder.id}`, {
              action: 'replaceItems',
              items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
            })
            const l = updated.items.map((i) => ({ productId: i.productId ?? i.id, name: i.name, price: i.price, quantity: i.quantity }))
            setOpenOrder(updated)
            setLines(l)
            setSavedLines(l)
          }
          toast({ title: 'Adisyon güncellendi ✓', description: `${title} • ${formatTL(total)}` })
        } else {
          const created = await api.post<OrderDTO>('/api/orders', {
            orderType: 'masa' satisfies OrderType,
            tableId: key,
            items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          })
          const l = created.items.map((i) => ({ productId: i.productId ?? i.id, name: i.name, price: i.price, quantity: i.quantity }))
          setOpenOrder(created)
          setLines(l)
          setSavedLines(l)
          toast({ title: 'Adisyon açıldı ✓', description: `${title} • ${formatTL(total)}` })
        }
      } else {
        // Paket / Gel-Al siparişi hemen oluştur
        await api.post('/api/orders', {
          orderType: kind,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        })
        toast({ title: 'Sipariş oluşturuldu ✓', description: `${title} • ${formatTL(total)}` })
        router.push('/panel')
        return
      }
      setQtyFor(null)
    } catch (e) {
      toast({ title: 'Kaydedilemedi', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function cancelOrder() {
    if (openOrder) {
      if (!window.confirm(`${title} masasındaki adisyon iptal edilsin mi?`)) return
      try {
        await api.del(`/api/orders/${openOrder.id}`)
        toast({ title: 'Adisyon iptal edildi' })
      } catch {
        toast({ title: 'Adisyon iptal edilemedi', variant: 'destructive' })
      }
    }
    router.push('/panel')
  }

  // Kasa Aç (paket/gel-al): kaydet + ödeme al + masalara dön
  async function kasaAc() {
    if (saving) return
    if (lines.length === 0) return
    setSaving(true)
    try {
      await save()
      if (openOrder) {
        await api.patch(`/api/orders/${openOrder.id}`, { action: 'pay' })
        toast({ title: 'Ödeme alındı ✓', description: `${title} • ${formatTL(total)}` })
        router.push('/panel')
        return
      }
    } catch (e) {
      toast({ title: 'İşlem tamamlanamadı', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Kategori sayfalama: sayfa başına 8 pili (orijinalde 2 sıra × 4)
  const cats = menu ?? []
  const CATS_PER_PAGE = 8
  const catPageCount = Math.max(1, Math.ceil(cats.length / CATS_PER_PAGE))
  const pageCats = cats.slice(catPage * CATS_PER_PAGE, catPage * CATS_PER_PAGE + CATS_PER_PAGE)
  const pillClass = (i: number) => PILL_COLORS[(i + catPage * CATS_PER_PAGE) % PILL_COLORS.length]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Koyu üst bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 bg-[#37474f] px-3 text-white">
        <button
          type="button"
          onClick={() => router.push('/panel')}
          aria-label="Masalara dön"
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex flex-col justify-center">
          <span className="truncate text-[15px] font-semibold leading-tight">{title}</span>
          <span className="text-[11px] font-normal text-white/60">
            {adisyonNo ? `Adisyon No: ${adisyonNo} · ${new Date(openOrder!.createdAt).toLocaleDateString('tr-TR')}` : 'Yeni Sipariş'}
          </span>
        </h1>
        <button type="button" aria-label="Masa düzenle" className="ml-1 hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 sm:flex">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Müşteri ekle" className="hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 sm:flex">
          <User className="h-4 w-4" />
        </button>

        <div className="relative mx-auto hidden w-full max-w-md md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün Adı veya Barkod ile Arama Yap"
            className="h-10 w-full rounded-lg border border-white/20 bg-white/10 pl-9 pr-3 text-[13px] text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <span
            aria-hidden
            className="mr-1 hidden items-center gap-1.5 text-[11px] text-white/50 xl:flex"
          >
            <Undo2 className="h-3.5 w-3.5" /> Geri Al için tuşuna basılı tutun. Parola
          </span>
          <button type="button" className="hidden h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] hover:bg-white/10 lg:flex" aria-label="Kişi sayısı">
            <Users className="h-4 w-4" /> 0
          </button>
          <button type="button" className="hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 sm:flex" aria-label="Sipariş notu">
            <ClipboardList className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={cancelOrder}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-red-300/60 bg-red-500/90 px-3 text-[13px] font-medium text-white hover:bg-red-500"
          >
            <XCircle className="h-4 w-4" /> İptal Et
          </button>
          {kind !== 'table' && (
            <button
              type="button"
              disabled={lines.length === 0 || saving}
              onClick={kasaAc}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#90caf9] bg-[#1e88e5] px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1565c0] disabled:opacity-50"
            >
              <span aria-hidden className="text-[13px]">₺</span> Kasa Aç
            </button>
          )}
        </div>
      </header>

      {/* Mobil arama */}
      <div className="relative border-b p-2 md:hidden">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ürün Adı veya Barkod ile Arama Yap"
          className="h-9 w-full rounded-lg border border-neutral-200 pl-9 pr-3 text-[13px] focus:border-brand-400 focus:outline-none"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Sol: adisyon fişi */}
        <aside className="flex w-full shrink-0 flex-col border-neutral-200 lg:w-[380px] lg:border-r">
          <p className="px-4 pt-3 text-[13px] text-neutral-500">
            Adisyon: <span className="font-medium text-neutral-700">{openOrder ? openOrder.tableName : 'Yeni Sipariş'}</span>
          </p>

          <div className="min-h-[120px] flex-1 overflow-y-auto px-4 py-2 nice-scroll">
            {lines.length === 0 ? (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                <ClipboardList className="mb-2 h-8 w-8 text-neutral-200" />
                <p className="text-[13px] text-neutral-400">Sağdan ürün ekleyerek adisyon oluşturun</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {lines.map((l) => (
                  <li key={l.productId} className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50/60 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        const p = products.find((x) => x.id === l.productId)
                        if (p) bump(p, 1)
                      }}
                      aria-label={`${l.name} adet arttır`}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:border-brand-300 hover:text-brand-600"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#37474f] text-[11.5px] font-bold text-white">
                      {l.quantity}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#263238]">{l.name}</p>
                      <p className="text-[11px] text-neutral-400">{formatTL(l.price)}</p>
                    </div>
                    <span className="shrink-0 text-[13.5px] font-bold text-[#263238]">{formatTL(l.price * l.quantity)}</span>
                    <button
                      type="button"
                      onClick={() => setQtyFor(l.productId)}
                      aria-label={`${l.name} adet düzenle`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const p = products.find((x) => x.id === l.productId)
                        if (p) bump(p, -l.quantity)
                        else setLines((prev) => prev.filter((x) => x.productId !== l.productId))
                      }}
                      aria-label={`${l.name} sil`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Toplam + Kaydet */}
          <div className="border-t px-4 pb-4 pt-3">
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-neutral-500">Toplam Tutar</span>
              <span className="text-[15px] font-bold text-[#263238]">{formatTL(total)}</span>
            </div>
            <button
              type="button"
              disabled={lines.length === 0 || saving || (kind === 'table' && !!openOrder && !dirty)}
              onClick={save}
              className={cn(
                'mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-semibold text-white transition-colors',
                lines.length === 0 || saving || (kind === 'table' && !!openOrder && !dirty)
                  ? 'cursor-not-allowed bg-[#e5a3a3]'
                  : 'bg-brand-600 hover:bg-brand-700'
              )}
            >
              <X className="h-4.5 w-4.5" /> {saving ? 'Kaydediliyor…' : 'KAPAT'}
            </button>
          </div>
        </aside>

        {/* Sağ: kategoriler + ürünler */}
        <section className="flex min-w-0 flex-1 flex-col bg-white">
          {/* Kategori pilleri */}
          <div className="border-b border-neutral-100 px-4 pt-3">
            {cats.length > 0 ? (
              search.trim() === '' ? (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {pageCats.map((c, i) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveCat(c.id)
                          setQtyFor(null)
                        }}
                        className={cn(
                          'flex h-11 items-center justify-center overflow-hidden rounded-md px-2 text-center text-[12px] font-semibold uppercase tracking-wide transition-transform hover:scale-[1.02]',
                          pillClass(i),
                          activeCat === c.id && 'ring-2 ring-[#263238] ring-offset-1'
                        )}
                        title={c.name}
                      >
                        <span className="truncate">
                          {c.name} <span className="opacity-80">({c.products.length})</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {catPageCount > 1 && (
                    <div className="flex items-center justify-end gap-1.5 py-2 text-[12px] text-neutral-400">
                      <span className="mr-0.5">Sekme:</span>
                      {Array.from({ length: catPageCount }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          aria-label={`${i + 1}. sekme`}
                          onClick={() => setCatPage(i)}
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-[11.5px] font-medium transition-colors',
                            i === catPage
                              ? 'bg-[#37474f] text-white'
                              : 'border border-neutral-200 text-neutral-500 hover:text-neutral-700'
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="pb-2 text-[12.5px] text-neutral-400">
                  “{search}” için {products.length} ürün bulundu
                </p>
              )
            ) : (
              <div className="pb-3" />
            )}
          </div>

          {/* Ürün ızgarası */}
          <div className="relative min-h-0 flex-1 overflow-y-auto p-4 nice-scroll">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {products.map((p) => {
                const inCart = lines.find((l) => l.productId === p.id)?.quantity ?? 0
                return (
                  <div key={p.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setQtyFor(qtyFor === p.id ? null : p.id)}
                      className={cn(
                        'flex h-[104px] w-full flex-col justify-between rounded-lg border-2 p-2.5 text-left transition-all hover:shadow-md',
                        inCart > 0
                          ? 'border-[#e3c25a] bg-[#fff8dc]'
                          : 'border-[#f0dc9a] bg-white hover:border-[#e3c25a]'
                      )}
                    >
                      <span className="line-clamp-2 text-[12.5px] font-medium leading-snug text-[#37474f]">{p.name}</span>
                      <span className="flex w-full items-end justify-between">
                        <span className="text-[14px] font-bold text-[#263238]">{formatTL(p.price)}</span>
                      </span>
                    </button>
                    {inCart > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#43a047] px-1.5 text-[11px] font-bold text-white shadow">
                        {inCart}
                      </span>
                    )}

                    {/* Adet seçme penceresi */}
                    {qtyFor === p.id && (
                      <div className="absolute left-1/2 top-1/2 z-30 w-48 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-[#f0dc9a] bg-white p-3 shadow-2xl">
                        <button
                          type="button"
                          aria-label="Kapat"
                          onClick={() => setQtyFor(null)}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <p className="truncate pr-4 text-[12.5px] font-semibold text-[#263238]">{p.name}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            type="button"
                            aria-label="Azalt"
                            onClick={() => setQty(p, qtyCurrent - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:border-brand-300"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-[16px] font-bold text-[#263238]">{qtyCurrent}</span>
                          <button
                            type="button"
                            aria-label="Arttır"
                            onClick={() => setQty(p, qtyCurrent + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:border-brand-300"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {products.length === 0 && (
              <p className="py-16 text-center text-[13.5px] text-neutral-400">Ürün bulunamadı</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
