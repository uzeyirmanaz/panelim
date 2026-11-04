'use client'

// Mutfak ekranı — orijinal panel düzeni:
// "Hazırlanıyor Aşaması" ve "Hazırlanan Siparişler" iki kolonu,
// kartlarda gelir merkezi ikonu, "Masa 14 / Salon" alt başlığı, adisyon no,
// satırlarda "1 Tam · Çay" biçimi + gri "Hazır" düğmeleri,
// ürün özellikleri kartının altında kırmızı "· Mayonez · Ranch" satırı
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownWideNarrow, Bike, Check, CircleDot, ShoppingBag, Store, UtensilsCrossed, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { formatTL, type OrderDTO, type OrderItemDTO, type OrderType } from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Adisyon numarası (#127 biçimi) — kimlikten kararlı türetilir
function orderNo(id: string) {
  let s = 0
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0
  return 100 + (s % 900)
}

// Gelir merkezi ikonu: masa = çatal-bıçak (kırmızı), paket = kurye (mavi), gel-al = poşet (yeşil)
function SourceIcon({ type }: { type: OrderType }) {
  if (type === 'paket')
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#42a5f5] text-white">
        <Bike className="h-4.5 w-4.5" />
      </span>
    )
  if (type === 'gelal')
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#66bb6a] text-white">
        <ShoppingBag className="h-4.5 w-4.5" />
      </span>
    )
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e53935] text-white">
      <UtensilsCrossed className="h-4.5 w-4.5" />
    </span>
  )
}

function sourceLine(o: OrderDTO) {
  if (o.orderType === 'masa') return `${o.tableName} / Salon`
  if (o.orderType === 'paket') return o.customerName ? `Paket / ${o.customerName}` : 'Paket Sipariş'
  return o.customerName ? `Gel-Al / ${o.customerName}` : 'Gel-Al Sipariş'
}

// Satır tutarı: "1 Tam · Çay" — 1,5 gibi kesirli adımlar "1 Bir buçuk" diye yazılır
function qtyLabel(q: number) {
  const whole = Math.floor(q)
  const frac = q - whole
  if (frac === 0.5) return whole === 0 ? 'Yarım' : `${whole} Yarım`
  return `${q} Tam`
}

function KitchenCard(props: {
  order: OrderDTO
  prepared: boolean // sağ kolondaki kartlar: düğme yok
  busy: boolean
  localReady: Record<string, boolean>
  onItemReady: (o: OrderDTO, item: OrderItemDTO) => void
  onPrepareAll: (o: OrderDTO) => void
}) {
  const { order: o, prepared, busy, localReady } = props
  const allLocal = o.items.length > 0 && o.items.every((i) => localReady[i.id])

  return (
    <article className="rounded-lg border border-neutral-200/90 bg-white p-3.5 shadow-sm">
      <div className="flex items-start gap-2.5">
        <SourceIcon type={o.orderType as OrderType} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13.5px] font-semibold text-[#263238]">
            {o.orderType === 'masa' ? o.tableName || 'Masa Siparişi' : o.customerName ?? 'Paket Siparişi'}
          </p>
          <p className="truncate text-[12px] text-neutral-400">{sourceLine(o)}</p>
        </div>
        <span className="pt-0.5 text-[12.5px] text-neutral-400">#{orderNo(o.id)}</span>
        {!prepared && (
          <button
            type="button"
            disabled={busy || allLocal}
            onClick={() => props.onPrepareAll(o)}
            className="rounded-full bg-[#e57373] px-3 py-1 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#e53935] disabled:opacity-50"
          >
            {allLocal ? 'Hazırlanıyor' : 'Tümünü Hazırla'}
          </button>
        )}
      </div>

      <ul className="mt-2.5 space-y-2 border-t border-neutral-100 pt-2.5">
        {o.items.map((i) => {
          const done = prepared || localReady[i.id]
          return (
            <li key={i.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={cn('truncate text-[13px]', done ? 'text-neutral-400' : 'text-[#37474f]')}>
                  {qtyLabel(i.quantity)} · {i.name}
                </p>
                {i.note && !done && <p className="truncate text-[11.5px] text-[#e53935]">· {i.note.split(/[, ]+/).filter(Boolean).join(' · ')}</p>}
              </div>
              {!prepared && (
                <button
                  type="button"
                  disabled={busy || done}
                  onClick={() => props.onItemReady(o, i)}
                  className={cn(
                    'mt-0.5 shrink-0 rounded-md px-4 py-1 text-[12px] font-medium transition-colors',
                    done
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-neutral-200 text-[#546e7a] hover:bg-neutral-300'
                  )}
                >
                  {done ? 'Hazır ✓' : 'Hazır'}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {o.note && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-[11.5px] text-amber-700">Sipariş notu: {o.note}</p>}
    </article>
  )
}

export function PanelKitchenView() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderDTO[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [localReady, setLocalReady] = useState<Record<string, boolean>>({})
  const [sortDesc, setSortDesc] = useState(false)
  const [showPrepared, setShowPrepared] = useState(true)
  const [version, setVersion] = useState(0)
  const [, setTick] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])
  usePosEvents(
    useCallback((e) => {
      if (['order:new', 'order:updated', 'order:paid', 'order:deleted'].includes(e.event)) refetch()
    }, [refetch])
  )
  useInterval(refetch, 8000)
  useInterval(() => setTick((x) => x + 1), 1000)

  useEffect(() => {
    let cancelled = false
    api.get<OrderDTO[]>('/api/orders?scope=active')
      .then((data) => {
        if (!cancelled) setOrders(data.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [version])

  const preparing = useMemo(
    () => (orders ?? []).filter((o) => o.status === 'new' || o.status === 'preparing'),
    [orders]
  )
  const preparedList = useMemo(() => (orders ?? []).filter((o) => o.status === 'ready'), [orders])

  async function setStatus(o: OrderDTO, status: 'preparing' | 'ready') {
    setBusyId(o.id)
    try {
      await api.patch(`/api/orders/${o.id}`, { action: 'setStatus', status })
      if (status === 'ready') toast({ title: `#${orderNo(o.id)} hazır ✓`, description: o.tableName })
      refetch()
    } catch (e) {
      toast({ title: 'Güncellenemedi', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  function onItemReady(o: OrderDTO, item: OrderItemDTO) {
    setLocalReady((prev) => {
      const next = { ...prev, [item.id]: true }
      if (o.items.every((i) => next[i.id])) {
        void setStatus(o, 'ready')
      } else if (o.status === 'new') {
        void setStatus(o, 'preparing')
      }
      return next
    })
  }

  const sortChip = (
    <button
      type="button"
      onClick={() => setSortDesc((v) => !v)}
      className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-[12.5px] font-medium text-neutral-600 hover:border-neutral-300"
    >
      <ArrowDownWideNarrow className="h-3.5 w-3.5" /> Sırala
    </button>
  )
  const centerChip = (
    <span className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-[12.5px] font-medium text-neutral-600">
      <Store className="h-3.5 w-3.5" /> Gelir Merkezi
    </span>
  )
  const preparedChip = (
    <button
      type="button"
      onClick={() => setShowPrepared((v) => !v)}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium',
        showPrepared ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-neutral-200 bg-white text-neutral-600'
      )}
    >
      <CircleDot className="h-3.5 w-3.5" /> Hazırlanan Siparişler
    </button>
  )

  return (
    <div className="mx-auto max-w-7xl">
      {/* Alt başlık: Mutfak + filtre çipleri */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#263238]">
          <Users className="h-4.5 w-4.5 text-neutral-500" /> Mutfak
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {sortChip}
          {centerChip}
          {preparedChip}
        </div>
      </div>

      {!orders ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-neutral-200/70" />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {/* Hazırlanıyor Aşaması */}
          <section aria-label="Hazırlanıyor Aşaması">
            <h3 className="border-b border-neutral-200 pb-2 text-[14px] font-semibold text-[#37474f]">
              Hazırlanıyor Aşaması <span className="font-normal text-neutral-400">({preparing.length})</span>
            </h3>
            <div className="mt-3 space-y-3">
              {preparing.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-200 py-12 text-center text-[13px] text-neutral-400">
                  Bekleyen sipariş yok
                </div>
              ) : (
                (sortDesc ? [...preparing].reverse() : preparing).map((o) => (
                  <KitchenCard
                    key={o.id}
                    order={o}
                    prepared={false}
                    busy={busyId === o.id}
                    localReady={localReady}
                    onItemReady={onItemReady}
                    onPrepareAll={(x) => setStatus(x, 'ready')}
                  />
                ))
              )}
            </div>
          </section>

          {/* Hazırlanan Siparişler */}
          {showPrepared && (
            <section aria-label="Hazırlanan Siparişler">
              <h3 className="border-b border-neutral-200 pb-2 text-[14px] font-semibold text-[#37474f]">
                Hazırlanan Siparişler <span className="font-normal text-neutral-400">({preparedList.length})</span>
              </h3>
              <div className="mt-3 space-y-3">
                {preparedList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-neutral-200 py-12 text-center text-[13px] text-neutral-400">
                    <Check className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
                    Hazırlanan sipariş yok
                  </div>
                ) : (
                  (sortDesc ? [...preparedList].reverse() : preparedList).map((o) => (
                    <KitchenCard key={o.id} order={o} prepared busy={false} localReady={{}} onItemReady={() => {}} onPrepareAll={() => {}} />
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {orders && (
        <p className="mt-6 text-center text-[12px] text-neutral-400">
          Aktif akıştaki toplam tutar: {formatTL((orders ?? []).reduce((s, o) => s + o.total, 0))}
        </p>
      )}
    </div>
  )
}
