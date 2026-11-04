'use client'

// Siparişler ekranı — orijinal panel "Liste Görünümü" kanban düzeni:
// [Masa Görünümü | Liste Görünümü] anahtarı, "Müşteri adı veya sipariş no ile ara..."
// arama çubuğu, Düzenle menüsü ve üç sütun: Hazırlanıyor / Hazırlanan Siparişler /
// Teslimata Çıkanlar. Kartlarda: tür ikonu (kırmızı masa / yeşil paket), süren
// sayacı, "Sipariş Detayı →", #numara, masa adı, tutar ve alt işlem satırı.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Armchair,
  Banknote,
  ChevronDown,
  CircleSlash,
  Clock3,
  Ellipsis,
  Grid2X2,
  Hourglass,
  LayoutList,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatTL, ORDER_STATUS_LABELS, type OrderDTO, type OrderStatus, type OrderType, type TableDTO } from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Görünümdeki sütunlar (orijinaldeki akış sırası)
const COLUMNS: { key: string; title: string; statuses: OrderStatus[] }[] = [
  { key: 'preparing', title: 'Hazırlanıyor', statuses: ['new', 'preparing'] },
  { key: 'ready', title: 'Hazırlanan Siparişler', statuses: ['ready'] },
  { key: 'out', title: 'Teslimata Çıkanlar', statuses: ['delivered'] },
]

// Kart ikonu: masa siparişi kırmızı çatal-bıçak, paket/gel-al yeşil poşet
function TypeIcon({ orderType }: { orderType: OrderType }) {
  const Icon = orderType === 'masa' ? UtensilsCrossed : ShoppingBag
  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white',
        orderType === 'masa' ? 'bg-[#c62828]' : 'bg-[#43a047]'
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  )
}

// Süre sayacı: HH:MM:SS — 45 dk altı yeşil, 45-90 turuncu, üzeri kırmızı
function elapsedParts(iso: string) {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return { label: `${pad(h)}:${pad(m)}:${pad(s)}`, mins: Math.floor(secs / 60) }
}

function timerColor(mins: number) {
  if (mins < 45) return 'text-[#2e7d32]'
  if (mins < 90) return 'text-[#ef6c00]'
  return 'text-[#c62828]'
}

// Sipariş numarası: kimlikteki rakamlardan türetilen kısa no (#109 biçiminde)
function orderNo(id: string) {
  const digits = (id.match(/\d+/g) ?? []).join('')
  return `#${(digits.slice(-3) || '0').padStart(3, '0')}`
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  new: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
  delivered: null,
  paid: null,
}

function OrderCard(props: {
  order: OrderDTO
  onOpen: (o: OrderDTO) => void
  onAdvance: (o: OrderDTO) => void
  onCancel: (o: OrderDTO) => void
  onPrint: (o: OrderDTO) => void
}) {
  const { order: o } = props
  const [menuOpen, setMenuOpen] = useState(false)
  const { label, mins } = elapsedParts(o.createdAt)

  return (
    <div className="relative rounded-lg border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button type="button" onClick={() => props.onOpen(o)} className="block w-full p-3 text-left" aria-label={`${o.tableName} sipariş detayı`}>
        <div className="flex items-start justify-between gap-2">
          <TypeIcon orderType={o.orderType} />
          <div className="text-right">
            <p className={cn('text-[14px] font-bold tabular-nums', timerColor(mins))}>{label}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#c62828]">Sipariş Detayı →</p>
          </div>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">{orderNo(o.id)}</p>
        <p className="truncate text-[13px] font-semibold text-[#37474f]">{o.tableName}</p>
        <p className="mt-0.5 text-[15px] font-bold text-[#263238]">{formatTL(o.total)}</p>
      </button>

      {/* Alt işlem satırı — süre, fiş ve menü */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 border-t border-neutral-100 text-neutral-400">
        <button
          type="button"
          title={NEXT_STATUS[o.status] ? `Durumu: ${ORDER_STATUS_LABELS[NEXT_STATUS[o.status]!]}` : 'Ödeme al'}
          onClick={() => props.onAdvance(o)}
          className="flex h-9 items-center justify-center transition-colors hover:bg-neutral-50 hover:text-[#37474f]"
        >
          {NEXT_STATUS[o.status] ? <Hourglass className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
        </button>
        <button
          type="button"
          title="Fiş yazdır"
          onClick={() => props.onPrint(o)}
          className="flex h-9 items-center justify-center transition-colors hover:bg-neutral-50 hover:text-[#37474f]"
        >
          <Printer className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Diğer işlemler"
          data-menu-keep
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 items-center justify-center transition-colors hover:bg-neutral-50 hover:text-[#37474f]"
        >
          <Ellipsis className="h-4 w-4" />
        </button>
      </div>

      {menuOpen && (
        <div
          data-menu-keep
          className="absolute right-2 top-2 z-20 w-44 overflow-hidden rounded-lg border bg-white text-[12.5px] shadow-xl"
        >
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              props.onOpen(o)
            }}
            className="flex h-9 w-full items-center gap-2 px-3 text-[#37474f] hover:bg-neutral-50"
          >
            <Clock3 className="h-3.5 w-3.5" /> Sipariş Detayı
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              props.onAdvance(o)
            }}
            className="flex h-9 w-full items-center gap-2 px-3 text-[#37474f] hover:bg-neutral-50"
          >
            <Hourglass className="h-3.5 w-3.5" /> Durumu İlerlet
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              props.onCancel(o)
            }}
            className="flex h-9 w-full items-center gap-2 border-t border-neutral-100 px-3 text-red-600 hover:bg-red-50"
          >
            <CircleSlash className="h-3.5 w-3.5" /> Siparişi İptal
          </button>
        </div>
      )}
    </div>
  )
}

export function OrdersListView() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderDTO[] | null>(null)
  const [tables, setTables] = useState<TableDTO[] | null>(null)
  const [mode, setMode] = useState<'list' | 'masa'>('list')
  const [search, setSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [detail, setDetail] = useState<OrderDTO | null>(null)
  const [version, setVersion] = useState(0)
  const [, setTick] = useState(0) // sayaçları tazelemek için

  const refetch = useCallback(() => setVersion((v) => v + 1), [])
  usePosEvents(
    useCallback((e) => {
      if (['order:new', 'order:updated', 'order:paid', 'order:deleted'].includes(e.event)) refetch()
    }, [refetch])
  )
  useInterval(refetch, 10000)
  useInterval(() => setTick((x) => x + 1), 1000)

  useEffect(() => {
    let cancelled = false
    api.get<OrderDTO[]>('/api/orders?scope=all')
      .then((data) => {
        if (!cancelled) setOrders(data.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)))
      })
      .catch(() => {})
    api.get<TableDTO[]>('/api/tables').then((t) => !cancelled && setTables(t)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [version])

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR')
    return (orders ?? []).filter((o) => {
      if (o.status === 'paid') return false
      if (q && !o.tableName.toLocaleLowerCase('tr-TR').includes(q) && !(o.customerName ?? '').toLocaleLowerCase('tr-TR').includes(q) && !orderNo(o.id).includes(q))
        return false
      return true
    })
  }, [orders, search])

  const columns = useMemo(
    () =>
      COLUMNS.map((c) => ({
        ...c,
        list: filtered
          .filter((o) => c.statuses.includes(o.status))
          .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
      })),
    [filtered]
  )

  const zones = useMemo(() => Array.from(new Set((tables ?? []).map((t) => t.zone))), [tables])

  async function advance(o: OrderDTO) {
    const next = NEXT_STATUS[o.status]
    try {
      if (next) {
        await api.patch(`/api/orders/${o.id}`, { action: 'setStatus', status: next })
        toast({ title: `${o.tableName} • ${ORDER_STATUS_LABELS[next]}` })
      } else {
        await api.patch(`/api/orders/${o.id}`, { action: 'pay' })
        toast({ title: `Ödeme alındı ✓ ${formatTL(o.total)}` })
      }
      refetch()
      setDetail(null)
    } catch {
      toast({ title: 'İşlem tamamlanamadı', variant: 'destructive' })
    }
  }

  async function cancel(o: OrderDTO) {
    if (!window.confirm(`${o.tableName} siparişi iptal edilsin mi?`)) return
    try {
      await api.del(`/api/orders/${o.id}`)
      toast({ title: 'Sipariş iptal edildi' })
      refetch()
      setDetail(null)
    } catch {
      toast({ title: 'Sipariş iptal edilemedi', variant: 'destructive' })
    }
  }

  function print(o: OrderDTO) {
    toast({ title: 'Fiş yazdırılıyor…', description: `${o.tableName} • ${formatTL(o.total)}` })
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Masa / Liste görünümü anahtarı — orijinaldeki çift buton */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('masa')}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-medium shadow-sm transition-colors',
            mode === 'masa' ? 'bg-[#37474f] text-white' : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
          )}
        >
          <Grid2X2 className="h-4 w-4" />
          Masa Görünümü
        </button>
        <button
          type="button"
          onClick={() => setMode('list')}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-medium shadow-sm transition-colors',
            mode === 'list' ? 'bg-[#37474f] text-white' : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
          )}
        >
          <LayoutList className="h-4 w-4" />
          Liste Görünümü
        </button>
      </div>

      {/* Arama + Düzenle */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri adı veya sipariş no ile ara..."
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-[13.5px] shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-brand-400"
            aria-label="Sipariş ara"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setEditOpen((v) => !v)}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 text-[13px] font-medium text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50"
          >
            Düzenle
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          {editOpen && (
            <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-lg border bg-white text-[13px] shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setEditOpen(false)
                  refetch()
                }}
                className="flex h-9 w-full items-center gap-2 px-3 text-[#37474f] hover:bg-neutral-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Siparişleri Yenile
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === 'list' ? (
        /* Kanban sütunları */
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {columns.map((col) => (
            <section key={col.key} className="rounded-lg bg-[#fbfbfc] p-3 ring-1 ring-neutral-200/70">
              <h3 className="px-0.5 pb-2.5 text-[14px] font-semibold text-[#37474f]">
                {col.title} <span className="font-normal text-neutral-400">({col.list.length})</span>
              </h3>
              <div className="space-y-3">
                {col.list.map((o) => (
                  <OrderCard key={o.id} order={o} onOpen={setDetail} onAdvance={advance} onCancel={cancel} onPrint={print} />
                ))}
                {col.list.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-neutral-200 text-[12.5px] text-neutral-300">
                    Sipariş yok
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Masa görünümü — dolu masalar yeşil kart, boş masalar gri */
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {(tables ?? []).map((t) => {
            const open = !!t.openOrderId
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => router.push(`/panel/siparis?masa=${t.id}`)}
                className={cn(
                  'flex h-28 flex-col justify-between rounded-lg border p-3 text-left transition-all hover:shadow-md',
                  open ? 'border-[#b5d4ad] bg-[#e7f2e4]' : 'border-neutral-200 bg-white hover:border-neutral-300'
                )}
              >
                <div className="flex w-full items-start justify-between">
                  <p className={cn('truncate text-[13px] font-semibold', open ? 'text-[#2e7d32]' : 'text-neutral-400')}>{t.name}</p>
                  <Armchair className={cn('h-4 w-4 shrink-0', open ? 'text-[#2e7d32]' : 'text-neutral-300')} />
                </div>
                {open ? (
                  <div>
                    <p className="text-[11px] text-[#2e7d32]/70">{ORDER_STATUS_LABELS[t.openOrderStatus ?? 'new']}</p>
                    <p className="text-[17px] font-bold text-[#2e7d32]">{formatTL(t.openOrderTotal)}</p>
                  </div>
                ) : (
                  <p className="text-[12.5px] text-neutral-300">Boş</p>
                )}
              </button>
            )
          })}
          {!tables && (
            <div className="col-span-full flex h-32 items-center justify-center text-[13px] text-neutral-300">Masalar yükleniyor…</div>
          )}
        </div>
      )}

      {zones.length === 0 && mode === 'masa' && null}

      {/* Sipariş detayı penceresi */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-[14px] font-semibold text-[#263238]">
                  {detail.tableName} <span className="ml-1 font-normal text-neutral-400">{orderNo(detail.id)}</span>
                </p>
                <p className="text-[11.5px] text-neutral-400">
                  {ORDER_STATUS_LABELS[detail.status]} • {new Date(detail.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setDetail(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="max-h-64 overflow-y-auto nice-scroll px-4 py-2">
              {detail.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 border-b border-neutral-50 py-2 text-[13px] last:border-0">
                  <span className="min-w-0 flex-1 truncate text-[#37474f]">
                    <b className="mr-1.5 text-neutral-400">{it.quantity}×</b>
                    {it.name}
                  </span>
                  <span className="font-semibold text-[#263238]">{formatTL(it.price * it.quantity)}</span>
                </li>
              ))}
              {detail.items.length === 0 && <li className="py-4 text-center text-[12.5px] text-neutral-300">Kalem yok</li>}
            </ul>
            {detail.note && <p className="border-t bg-amber-50/60 px-4 py-2 text-[12.5px] text-amber-800">Not: {detail.note}</p>}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-[15px] font-bold text-[#263238]">{formatTL(detail.total)}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cancel(detail)}
                  className="h-9 rounded-lg border border-neutral-200 px-3 text-[12.5px] font-medium text-red-600 hover:bg-red-50"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => advance(detail)}
                  className="h-9 rounded-lg bg-[#37474f] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#263238]"
                >
                  {NEXT_STATUS[detail.status] ? `Durumu: ${ORDER_STATUS_LABELS[NEXT_STATUS[detail.status]!]}` : 'Ödeme Al'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
