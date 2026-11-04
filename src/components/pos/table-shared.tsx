'use client'

// Harita ekranının kullandığı paylaşılan bileşenler:
// masa detay paneli ve ürün seçme penceresi
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import {
  ORDER_STATUS_LABELS,
  formatTL,
  formatTime,
  productGradient,
  type CategoryDTO,
  type OrderDTO,
  type OrderStatus,
  type ProductDTO,
  type TableDTO,
} from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/pos/status-badge'
import { Armchair, Banknote, CircleSlash, Clock, Minus, Plus, Receipt, Search } from 'lucide-react'

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

export function TableDetailSheet(props: {
  table: TableDTO | null
  orders: OrderDTO[]
  onClose: () => void
  onAdvance: (o: OrderDTO) => void
  onPay: (o: OrderDTO) => void
  onPayAll: (t: TableDTO) => void
  onCancel: (o: OrderDTO) => void
  onAdd: () => void
  payingAll: boolean
}) {
  const { table, orders } = props
  const total = orders.reduce((s, o) => s + o.total, 0)
  return (
    <Sheet open={!!table} onOpenChange={(o) => !o && props.onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Armchair className="w-5 h-5 text-brand-600" /> {table?.name}
            {table && <span className="text-xs font-normal text-muted-foreground">• {table.zone}</span>}
          </SheetTitle>
          <SheetDescription>
            {orders.length === 0 ? 'Açık adisyon yok' : `${orders.length} adisyon • Toplam ${formatTL(total)}`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 space-y-3 nice-scroll">
          {orders.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="font-medium">Bu masada açık adisyon yok</p>
              <p className="text-sm">Aşağıdan ürün ekleyerek adisyon açın.</p>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="rounded-xl border bg-white overflow-hidden order-pop">
                <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(o.createdAt)}
                    </span>
                  </div>
                  <span className="font-bold text-brand-700 text-sm">{formatTL(o.total)}</span>
                </div>
                <ul className="px-3 py-2 space-y-1">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex justify-between text-sm">
                      <span className="min-w-0 truncate">
                        <span className="font-semibold text-brand-700">{i.quantity}×</span> {i.name}
                        {i.note && <span className="text-xs text-amber-600"> (📝 {i.note})</span>}
                      </span>
                      <span className="text-muted-foreground shrink-0 ml-2">{formatTL(i.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {NEXT_STATUS[o.status] && (
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => props.onAdvance(o)}>
                      → {ORDER_STATUS_LABELS[NEXT_STATUS[o.status]!]}
                    </Button>
                  )}
                  <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => props.onPay(o)}>
                    <Banknote className="w-3.5 h-3.5 mr-1" /> Öde
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => props.onCancel(o)}>
                    <CircleSlash className="w-3.5 h-3.5 mr-1" /> İptal
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <SheetFooter className="border-t gap-2">
          <Button variant="outline" onClick={props.onAdd} className="w-full h-11">
            <Plus className="w-4 h-4 mr-1" /> Ürün Ekle / Adisyon Aç
          </Button>
          {orders.length > 0 && (
            <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700" disabled={props.payingAll} onClick={() => table && props.onPayAll(table)}>
              <Banknote className="w-4 h-4 mr-1" />
              {props.payingAll ? 'Kapatılıyor…' : `Tüm Hesabı Kapat — ${formatTL(total)}`}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

type PickerLine = { productId: string; quantity: number; note?: string }

export function ProductPickerDialog(props: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  onConfirm: (lines: PickerLine[]) => Promise<void>
}) {
  const { open, onOpenChange, title, onConfirm } = props
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [catId, setCatId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setPicked({})
    setSearch('')
    setCatId('all')
    let cancelled = false
    api.get<CategoryDTO[]>('/api/menu')
      .then((data) => { if (!cancelled) setCategories(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  const products = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR')
    return categories
      .filter((c) => catId === 'all' || c.id === catId)
      .flatMap((c) => c.products.filter((p) => p.available && (!q || p.name.toLocaleLowerCase('tr-TR').includes(q))))
  }, [categories, catId, search])

  const pickedTotal = Object.entries(picked).reduce((s, [pid, qty]) => {
    const p = products.find((x) => x.id === pid) ?? categories.flatMap((c) => c.products).find((x) => x.id === pid)
    return p ? s + p.price * qty : s
  }, 0)
  const pickedCount = Object.values(picked).reduce((s, q) => s + q, 0)

  function bump(p: ProductDTO, delta: number) {
    setPicked((prev) => {
      const next = { ...prev }
      const q = (next[p.id] ?? 0) + delta
      if (q <= 0) delete next[p.id]
      else next[p.id] = Math.min(50, q)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-3">
          <Select value={catId} onValueChange={setCatId}>
            <SelectTrigger className="w-full sm:w-44 bg-white" aria-label="Kategori">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara…" className="pl-9 bg-white" aria-label="Ürün ara" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto nice-scroll pr-1 min-h-0">
          {products.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Ürün bulunamadı</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2">
              {products.map((p) => (
                <li key={p.id} className="rounded-xl border bg-white p-2.5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${productGradient(p.color)} flex items-center justify-center text-xl shrink-0`}>
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-brand-700 font-bold">{formatTL(p.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => bump(p, -1)} aria-label={`${p.name} azalt`}>
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-sm font-semibold w-6 text-center">{picked[p.id] ?? 0}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => bump(p, 1)} aria-label={`${p.name} arttır`}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pt-3 space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span>{pickedCount} ürün seçildi</span>
            <span className="text-brand-700">{formatTL(pickedTotal)}</span>
          </div>
          <Button
            className="w-full bg-brand-600 hover:bg-brand-700 h-11"
            disabled={pickedCount === 0 || busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm(Object.entries(picked).map(([productId, quantity]) => ({ productId, quantity })))
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Ekleniyor…' : 'Adisyona Ekle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
