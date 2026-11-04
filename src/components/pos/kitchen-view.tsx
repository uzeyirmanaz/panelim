'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ORDER_STATUS_LABELS, formatTL, formatTime, type OrderDTO, type OrderStatus } from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/pos/status-badge'
import { ChefHat, Check, Clock, CookingPot, Flame, Receipt } from 'lucide-react'

const COLUMNS: { status: OrderStatus; icon: React.ReactNode; accent: string; next?: OrderStatus; nextLabel?: string }[] = [
  { status: 'new', icon: <Flame className="w-4 h-4" />, accent: 'bg-brand-500', next: 'preparing', nextLabel: 'Hazırlamaya Başla' },
  { status: 'preparing', icon: <CookingPot className="w-4 h-4" />, accent: 'bg-amber-500', next: 'ready', nextLabel: 'Hazır Oldu' },
  { status: 'ready', icon: <Check className="w-4 h-4" />, accent: 'bg-emerald-500', next: 'delivered', nextLabel: 'Teslim Edildi' },
]

export function KitchenView() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderDTO[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])
  usePosEvents(useCallback((e) => {
    if (['order:new', 'order:updated', 'order:paid', 'order:deleted'].includes(e.event)) refetch()
  }, [refetch]))
  useInterval(refetch, 8000)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await api.get<OrderDTO[]>('/api/orders?scope=active')
        if (!cancelled) {
          // Mutfakta en yeni en üstte
          setOrders(data.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)))
        }
      } catch (err) {
        if (!cancelled) toast({ title: 'Siparişler yüklenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
      }
    }
    load()
    return () => { cancelled = true }
  }, [version, toast])

  async function advance(order: OrderDTO, next: OrderStatus) {
    setBusyId(order.id)
    try {
      await api.patch(`/api/orders/${order.id}`, { action: 'setStatus', status: next })
      refetch()
    } catch (err) {
      toast({ title: 'Güncellenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 shadow-sm">
          <ChefHat className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs text-muted-foreground">Mutfak Ekranı</p>
            <p className="text-sm font-bold">Canlı Akış</p>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.status} className="rounded-xl border bg-white px-4 py-2.5 shadow-sm">
            <p className="text-xs text-muted-foreground">{ORDER_STATUS_LABELS[col.status]}</p>
            <p className="text-lg font-bold">{orders?.filter((o) => o.status === col.status).length ?? '—'}</p>
          </div>
        ))}
      </div>

      {!orders ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const list = orders.filter((o) => o.status === col.status)
            return (
              <section key={col.status} className="rounded-2xl bg-stone-100/70 border p-3 min-h-64" aria-label={ORDER_STATUS_LABELS[col.status]}>
                <header className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-6 h-6 rounded-lg ${col.accent} text-white flex items-center justify-center`}>{col.icon}</span>
                  <h2 className="font-bold text-sm">{ORDER_STATUS_LABELS[col.status]}</h2>
                  <Badge variant="outline" className="ml-auto bg-white">{list.length}</Badge>
                </header>
                <div className="space-y-3">
                  {list.length === 0 ? (
                    <div className="text-center py-10 text-stone-400 text-sm">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      Sipariş yok
                    </div>
                  ) : (
                    list.map((o) => (
                      <article key={o.id} className={`rounded-xl border bg-white p-3 shadow-sm order-pop ${o.status === 'new' ? 'ring-pulse border-brand-200' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{o.tableName}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(o.createdAt)}
                          </span>
                        </div>
                        <ul className="space-y-1 mb-2">
                          {o.items.map((i) => (
                            <li key={i.id} className="text-sm flex justify-between gap-2">
                              <span className="min-w-0">
                                <span className="font-bold text-brand-700">{i.quantity}×</span> {i.name}
                                {i.note && <span className="block text-xs text-amber-600">📝 {i.note}</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {o.note && <p className="text-xs bg-amber-50 text-amber-700 rounded-md px-2 py-1 mb-2">Sipariş notu: {o.note}</p>}
                        <div className="flex items-center justify-between">
                          <StatusBadge status={o.status} />
                          {col.next && (
                            <Button
                              size="sm"
                              className={`h-8 text-xs ${o.status === 'new' ? 'bg-brand-600 hover:bg-brand-700' : o.status === 'preparing' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                              disabled={busyId === o.id}
                              onClick={() => advance(o, col.next!)}
                            >
                              {busyId === o.id ? '…' : col.nextLabel}
                            </Button>
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Teslim edilen adisyonlar mutfak akışından düşer; ödeme kasadan alınır. Toplam aktif tutar: {orders ? formatTL(orders.reduce((s, o) => s + o.total, 0)) : '—'}
      </p>
    </div>
  )
}
