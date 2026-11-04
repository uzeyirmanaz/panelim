'use client'

// Harita ekranı — kat planı görünümü (Salon / Bahçe bölgeleri, masa durumları)
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import {
  formatTL,
  type OrderDTO,
  type TableDTO,
} from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { TableDetailSheet, ProductPickerDialog } from '@/components/pos/table-shared'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

export function HaritaView() {
  const { toast } = useToast()
  const [tables, setTables] = useState<TableDTO[] | null>(null)
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [selectedTable, setSelectedTable] = useState<TableDTO | null>(null)
  const [zone, setZone] = useState('all')
  const [payingAll, setPayingAll] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<OrderDTO | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  usePosEvents(useCallback((e) => {
    if (['order:new', 'order:updated', 'order:paid', 'order:deleted', 'table:changed'].includes(e.event)) refetch()
  }, [refetch]))
  useInterval(refetch, 10000)
  // Masa süreleri için 30 saniyede bir saati tazele
  useInterval(useCallback(() => setNow(Date.now()), []), 30000)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [t, o] = await Promise.all([
          api.get<TableDTO[]>('/api/tables'),
          api.get<OrderDTO[]>('/api/orders?scope=active'),
        ])
        if (cancelled) return
        setTables(t)
        setOrders(o)
      } catch (err) {
        if (!cancelled) toast({ title: 'Veriler yüklenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
      }
    }
    load()
    return () => { cancelled = true }
  }, [version, toast])

  const openOrdersOf = useCallback(
    (tableId: string) => orders.filter((o) => o.tableId === tableId),
    [orders]
  )

  const zones = useMemo(() => Array.from(new Set((tables ?? []).map((t) => t.zone))), [tables])
  const visibleTables = useMemo(
    () => (tables ?? []).filter((t) => zone === 'all' || t.zone === zone),
    [tables, zone]
  )
  const occupied = tables?.filter((t) => t.openOrderId) ?? []
  const openTotal = occupied.reduce((s, t) => s + t.openOrderTotal, 0)

  async function advanceStatus(order: OrderDTO) {
    const next = { new: 'preparing', preparing: 'ready', ready: 'delivered' }[order.status as 'new' | 'preparing' | 'ready']
    if (!next) return
    try {
      await api.patch(`/api/orders/${order.id}`, { action: 'setStatus', status: next })
      toast({ title: `${order.tableName} güncellendi`, description: `Adisyon ${next === 'preparing' ? 'Hazırlanıyor' : next === 'ready' ? 'Hazır' : 'Teslim Edildi'} durumuna alındı.` })
      refetch()
    } catch (err) {
      toast({ title: 'Güncellenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    }
  }

  async function payOrder(order: OrderDTO) {
    try {
      await api.patch(`/api/orders/${order.id}`, { action: 'pay' })
      toast({ title: 'Ödeme alındı ✓', description: `${order.tableName} • ${formatTL(order.total)}` })
      refetch()
    } catch (err) {
      toast({ title: 'Ödeme alınamadı', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    }
  }

  async function cancelOrder(order: OrderDTO) {
    setCancelTarget(null)
    try {
      await api.del(`/api/orders/${order.id}`)
      toast({ title: 'Adisyon iptal edildi', description: `${order.tableName} • ${formatTL(order.total)}` })
      refetch()
    } catch (err) {
      toast({ title: 'İptal edilemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    }
  }

  async function payAll(table: TableDTO) {
    const list = openOrdersOf(table.id)
    if (list.length === 0) return
    setPayingAll(true)
    try {
      for (const o of list) {
        await api.patch(`/api/orders/${o.id}`, { action: 'pay' })
      }
      toast({ title: 'Hesap kapatıldı ✓', description: `${table.name} • Toplam ${formatTL(list.reduce((s, o) => s + o.total, 0))}` })
      setSelectedTable(null)
      refetch()
    } catch (err) {
      toast({ title: 'Hesap kapatılamadı', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    } finally {
      setPayingAll(false)
    }
  }

  if (!tables) {
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
      {/* Durum çubuğu */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="rounded-xl border bg-white px-4 py-2.5 shadow-sm">
          <p className="text-xs text-muted-foreground">Dolu / Toplam Masa</p>
          <p className="text-lg font-bold">{occupied.length} <span className="text-muted-foreground font-normal text-sm">/ {tables.length}</span></p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-2.5 shadow-sm">
          <p className="text-xs text-muted-foreground">Açık Adisyon</p>
          <p className="text-lg font-bold">{orders.length}</p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-2.5 shadow-sm">
          <p className="text-xs text-muted-foreground">Açık Tutar</p>
          <p className="text-lg font-bold text-brand-700">{formatTL(openTotal)}</p>
        </div>
        {/* Gösterge */}
        <div className="ml-auto hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Boş</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Dolu</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Yeni Sipariş</span>
        </div>
      </div>

      {/* Bölge sekmeleri */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <ZoneTab active={zone === 'all'} onClick={() => setZone('all')} label="Tümü" count={tables.length} />
        {zones.map((z) => (
          <ZoneTab key={z} active={zone === z} onClick={() => setZone(z)} label={z} count={tables.filter((t) => t.zone === z).length} />
        ))}
      </div>

      {/* Kat planı */}
      <div className="rounded-2xl border bg-[repeating-linear-gradient(45deg,#fafaf9_0px,#fafaf9_12px,#f5f5f4_12px,#f5f5f4_24px)] p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {visibleTables.map((t) => (
            <FloorTable
              key={t.id}
              table={t}
              onClick={() => setSelectedTable(t)}
              now={now}
            />
          ))}
        </div>
        {visibleTables.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Bu bölgede masa yok</p>
        )}
      </div>

      {/* Masa detayı */}
      <TableDetailSheet
        table={selectedTable}
        orders={selectedTable ? openOrdersOf(selectedTable.id) : []}
        onClose={() => setSelectedTable(null)}
        onAdvance={advanceStatus}
        onPay={payOrder}
        onPayAll={payAll}
        onCancel={(o) => setCancelTarget(o)}
        onAdd={() => setPickerOpen(true)}
        payingAll={payingAll}
      />

      {/* Ürün ekleme */}
      {selectedTable && (
        <ProductPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          title={`${selectedTable.name} — Ürün Ekle`}
          onConfirm={async (lines) => {
            const target = openOrdersOf(selectedTable.id)[0]
            try {
              if (target) {
                await api.patch(`/api/orders/${target.id}`, { action: 'addItems', items: lines })
              } else {
                await api.post('/api/orders', { orderType: 'masa', tableId: selectedTable.id, items: lines })
              }
              toast({ title: 'Adisyona eklendi ✓', description: `${selectedTable.name} • ${lines.length} çeşit` })
              setPickerOpen(false)
              refetch()
            } catch (err) {
              toast({ title: 'Eklenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
            }
          }}
        />
      )}

      {/* İptal onayı */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adisyon iptal edilsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.tableName} • {formatTL(cancelTarget?.total ?? 0)} tutarındaki adisyon kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => cancelTarget && cancelOrder(cancelTarget)}>
              Evet, İptal Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ZoneTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 rounded-xl border px-4 text-[13px] font-semibold transition-colors',
        active ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700'
      )}
    >
      {label} <span className={cn('ml-1 font-normal', active ? 'text-white/75' : 'text-stone-400')}>{count}</span>
    </button>
  )
}

// Kat planı masa kutusu — doluluk durumuna göre renklenir
function FloorTable({ table, onClick, now }: { table: TableDTO; onClick: () => void; now: number }) {
  const isOpen = !!table.openOrderId
  const hasNew = table.openOrderStatus === 'new'
  const minutes = table.lastOrderAt ? Math.max(0, Math.round((now - new Date(table.lastOrderAt).getTime()) / 60000)) : null
  const round = table.seats <= 2

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center border-2 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        round ? 'h-28 w-full rounded-full' : table.seats >= 6 ? 'h-28 w-full rounded-2xl' : 'h-28 w-full rounded-2xl',
        hasNew && 'ring-pulse',
        !isOpen && 'border-emerald-300 bg-emerald-50/80 hover:border-emerald-400',
        isOpen && !hasNew && 'border-brand-400 bg-brand-50',
        hasNew && 'border-amber-400 bg-amber-50'
      )}
    >
      {isOpen && (
        <Badge className={cn('absolute -top-2 left-1/2 -translate-x-1/2 border-0 text-[9px] px-1.5', hasNew ? 'bg-amber-500' : 'bg-brand-600')}>
          {hasNew ? 'YENİ' : formatTL(table.openOrderTotal)}
        </Badge>
      )}
      <p className={cn('text-sm font-bold leading-tight', isOpen ? 'text-brand-800' : 'text-emerald-800')}>{table.name}</p>
      <p className={cn('mt-0.5 flex items-center gap-1 text-[11px]', isOpen ? 'text-brand-700/80' : 'text-emerald-700/70')}>
        <Users className="h-3 w-3" /> {table.seats}
      </p>
      {isOpen && minutes !== null && (
        <p className="mt-1 text-[10px] font-medium text-brand-600/80">
          {minutes < 60 ? `${minutes} dk` : `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`}
        </p>
      )}
    </button>
  )
}
