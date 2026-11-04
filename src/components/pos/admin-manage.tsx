'use client'

import { withBase } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { api } from '@/lib/api'
import { PRODUCT_COLORS, formatTL, productGradient, type CategoryDTO, type ProductDTO, type TableDTO } from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Armchair, Download, Pencil, Plus, QrCode, Search, Trash2, Users } from 'lucide-react'

const EMOJI_CHOICES = ['🍽️', '🍳', '🥗', '🍖', '🍔', '🍕', '🍰', '☕', '🥤', '🍣', '🌮', '🥐', '🧁', '🍺', '🍷', '🍦', '🥘', '🍜', '🥪', '🍟', '🥩', '🍲', '🧀', '🫖', '🧃', '🥙', '🍱', '🥟']
const COLOR_KEYS = Object.keys(PRODUCT_COLORS)

export function AdminManage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'products' | 'categories' | 'tables'>('products')
  const [categories, setCategories] = useState<CategoryDTO[] | null>(null)
  const [tables, setTables] = useState<TableDTO[] | null>(null)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])
  usePosEvents(useCallback((e) => {
    if (['menu:changed', 'table:changed', 'order:new', 'order:paid'].includes(e.event)) refetch()
  }, [refetch]))
  useInterval(refetch, 30000)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [menu, t] = await Promise.all([api.get<CategoryDTO[]>('/api/menu'), api.get<TableDTO[]>('/api/tables')])
        if (cancelled) return
        setCategories(menu)
        setTables(t)
      } catch (err) {
        if (!cancelled) toast({ title: 'Veriler yüklenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
      }
    }
    load()
    return () => { cancelled = true }
  }, [version, toast])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {([['products', '🍔 Ürünler'], ['categories', '🗂️ Kategoriler'], ['tables', '🪑 Masalar & QR']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${tab === key ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border hover:bg-brand-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'products' && <ProductsTab categories={categories} onChange={refetch} />}
      {tab === 'categories' && <CategoriesTab categories={categories} onChange={refetch} />}
      {tab === 'tables' && <TablesTab tables={tables} onChange={refetch} />}
    </div>
  )
}

// ---------------- ÜRÜNLER ----------------
function ProductsTab({ categories, onChange }: { categories: CategoryDTO[] | null; onChange: () => void }) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [editProduct, setEditProduct] = useState<Partial<ProductDTO> | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<ProductDTO | null>(null)

  const allProducts = useMemo(() => categories?.flatMap((c) => c.products.map((p) => ({ ...p, categoryId: c.id, categoryName: c.name }))) ?? [], [categories])
  const catName = useCallback((id: string) => categories?.find((c) => c.id === id)?.name ?? '—', [categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR')
    return allProducts.filter((p) => {
      if (catFilter !== 'all' && p.categoryId !== catFilter) return false
      if (q && !p.name.toLocaleLowerCase('tr-TR').includes(q)) return false
      return true
    })
  }, [allProducts, search, catFilter])

  async function toggleAvailable(p: ProductDTO, available: boolean) {
    try {
      await api.patch(`/api/products/${p.id}`, { available })
      onChange()
    } catch (err) {
      toast({ title: 'Güncellenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    }
  }

  async function removeProduct(p: ProductDTO) {
    setDeleteProduct(null)
    try {
      await api.del(`/api/products/${p.id}`)
      toast({ title: 'Ürün silindi', description: p.name })
      onChange()
    } catch (err) {
      toast({ title: 'Silinemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara…" className="pl-9 bg-white" aria-label="Ürün ara" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white" aria-label="Kategori filtresi">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => setEditProduct({ emoji: '🍽️', color: 'violet', available: true })}>
          <Plus className="w-4 h-4 mr-1" /> Ürün Ekle
        </Button>
      </div>

      {!categories ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden">
          <ul className="divide-y">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${productGradient(p.color)} flex items-center justify-center text-xl shrink-0`}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    {p.popular && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] px-1.5">Popüler</Badge>}
                    {!p.available && <Badge variant="outline" className="text-[10px] px-1.5 text-stone-400">Tükendi</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{catName(p.categoryId)} • {p.description ?? '—'}</p>
                </div>
                <span className="font-bold text-brand-700 text-sm shrink-0">{formatTL(p.price)}</span>
                <Switch checked={p.available} onCheckedChange={(v) => toggleAvailable(p, v)} aria-label={`${p.name} satışta`} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditProduct(p)} aria-label={`${p.name} düzenle`}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-red-500" onClick={() => setDeleteProduct(p)} aria-label={`${p.name} sil`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-10 text-center text-sm text-muted-foreground">Ürün bulunamadı</li>}
          </ul>
        </div>
      )}

      <ProductFormDialog
        product={editProduct}
        categories={categories ?? []}
        onClose={() => setEditProduct(null)}
        onSaved={() => { setEditProduct(null); onChange() }}
      />

      <AlertDialog open={!!deleteProduct} onOpenChange={(o) => !o && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürün silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>&ldquo;{deleteProduct?.name}&rdquo; menüden kalıcı olarak kaldırılacak.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteProduct && removeProduct(deleteProduct)}>Evet, Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProductFormDialog({ product, categories, onClose, onSaved }: {
  product: Partial<ProductDTO> | null
  categories: CategoryDTO[]
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const isEdit = !!product?.id
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [color, setColor] = useState('violet')
  const [popular, setPopular] = useState(false)
  const [available, setAvailable] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (product) {
      setName(product.name ?? '')
      setDescription(product.description ?? '')
      setPrice(product.price ? String(product.price) : '')
      setCategoryId(product.categoryId ?? categories[0]?.id ?? '')
      setEmoji(product.emoji ?? '🍽️')
      setColor(product.color ?? 'violet')
      setPopular(!!product.popular)
      setAvailable(product.available !== false)
    }
  }, [product])

  async function save() {
    if (!name.trim()) return toast({ title: 'Ürün adı gerekli', variant: 'destructive' })
    const priceNum = Number(price.replace(',', '.'))
    if (!Number.isFinite(priceNum) || priceNum <= 0) return toast({ title: 'Geçerli bir fiyat girin', variant: 'destructive' })
    if (!categoryId) return toast({ title: 'Kategori seçin', variant: 'destructive' })
    setBusy(true)
    try {
      const payload = { name: name.trim(), description: description.trim(), price: priceNum, categoryId, emoji, color, popular, available }
      if (isEdit) await api.patch(`/api/products/${product!.id}`, payload)
      else await api.post('/api/products', payload)
      toast({ title: isEdit ? 'Ürün güncellendi ✓' : 'Ürün eklendi ✓', description: name })
      onSaved()
    } catch (err) {
      toast({ title: 'Kaydedilemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto nice-scroll">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün'}</DialogTitle>
          <DialogDescription>Menüde müşterilere görünecek bilgileri girin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Ad</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ürün adı" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Fiyat (₺)</Label>
              <Input id="p-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="120" />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger aria-label="Kategori"><SelectValue placeholder="Seçin" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Açıklama</Label>
            <Input id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kısa açıklama" />
          </div>
          <div className="space-y-1.5">
            <Label>Simge</Label>
            <div className="grid grid-cols-8 sm:grid-cols-14 gap-1">
              {EMOJI_CHOICES.map((e) => (
                <button key={e} onClick={() => setEmoji(e)} className={`h-9 rounded-lg text-lg transition-colors ${emoji === e ? 'bg-brand-100 ring-2 ring-brand-400' : 'hover:bg-stone-100'}`} aria-label={`simge ${e}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Kart rengi</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_KEYS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${productGradient(c)} ${color === c ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}
                  aria-label={`renk ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={available} onCheckedChange={setAvailable} /> Satışta
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={popular} onCheckedChange={setPopular} /> Popüler
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button className="bg-brand-600 hover:bg-brand-700" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- KATEGORİLER ----------------
function CategoriesTab({ categories, onChange }: { categories: CategoryDTO[] | null; onChange: () => void }) {
  const { toast } = useToast()
  const [edit, setEdit] = useState<{ id?: string; name: string; emoji: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryDTO | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!edit) return
    if (!edit.name.trim()) return toast({ title: 'Kategori adı gerekli', variant: 'destructive' })
    setBusy(true)
    try {
      if (edit.id) await api.patch(`/api/categories/${edit.id}`, { name: edit.name.trim(), emoji: edit.emoji })
      else await api.post('/api/categories', { name: edit.name.trim(), emoji: edit.emoji })
      toast({ title: edit.id ? 'Kategori güncellendi ✓' : 'Kategori eklendi ✓', description: edit.name })
      setEdit(null)
      onChange()
    } catch (err) {
      toast({ title: 'Kaydedilemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  async function remove(c: CategoryDTO) {
    setDeleteTarget(null)
    try {
      await api.del(`/api/categories/${c.id}`)
      toast({ title: 'Kategori silindi', description: `${c.name} ve ürünleri silindi.` })
      onChange()
    } catch (err) {
      toast({ title: 'Silinemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => setEdit({ name: '', emoji: '🍽️' })}>
          <Plus className="w-4 h-4 mr-1" /> Kategori Ekle
        </Button>
      </div>
      {!categories ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-white p-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl">{c.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.products.length} ürün</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEdit({ id: c.id, name: c.name, emoji: c.emoji })} aria-label={`${c.name} düzenle`}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-red-500" onClick={() => setDeleteTarget(c)} aria-label={`${c.name} sil`}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{edit?.id ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Ad</Label>
              <Input id="c-name" value={edit?.name ?? ''} onChange={(e) => setEdit((p) => (p ? { ...p, name: e.target.value } : p))} placeholder="Ör. Ana Yemekler" />
            </div>
            <div className="space-y-1.5">
              <Label>Simge</Label>
              <div className="grid grid-cols-8 sm:grid-cols-14 gap-1">
                {EMOJI_CHOICES.map((e) => (
                  <button key={e} onClick={() => setEdit((p) => (p ? { ...p, emoji: e } : p))} className={`h-9 rounded-lg text-lg ${edit?.emoji === e ? 'bg-brand-100 ring-2 ring-brand-400' : 'hover:bg-stone-100'}`} aria-label={`simge ${e}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Vazgeç</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategori silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; içindeki {deleteTarget?.products.length} ürün de kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTarget && remove(deleteTarget)}>Evet, Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------- MASALAR & QR ----------------
function TablesTab({ tables, onChange }: { tables: TableDTO[] | null; onChange: () => void }) {
  const { toast } = useToast()
  const [edit, setEdit] = useState<{ id?: string; name: string; zone: string; seats: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TableDTO | null>(null)
  const [qrTable, setQrTable] = useState<TableDTO | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrLink, setQrLink] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!edit) return
    if (!edit.name.trim()) return toast({ title: 'Masa adı gerekli', variant: 'destructive' })
    const seats = Number(edit.seats)
    if (!Number.isFinite(seats) || seats < 1) return toast({ title: 'Geçerli kişi sayısı girin', variant: 'destructive' })
    setBusy(true)
    try {
      const zone = edit.zone.trim() || 'Salon'
      if (edit.id) await api.patch(`/api/tables/${edit.id}`, { name: edit.name.trim(), zone, seats })
      else await api.post('/api/tables', { name: edit.name.trim(), zone, seats })
      toast({ title: edit.id ? 'Masa güncellendi ✓' : 'Masa eklendi ✓', description: edit.name })
      setEdit(null)
      onChange()
    } catch (err) {
      toast({ title: 'Kaydedilemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  async function remove(t: TableDTO) {
    setDeleteTarget(null)
    try {
      await api.del(`/api/tables/${t.id}`)
      toast({ title: 'Masa silindi', description: t.name })
      onChange()
    } catch (err) {
      toast({ title: 'Silinemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
    }
  }

  async function openQr(t: TableDTO) {
    setQrTable(t)
    setQrUrl(null)
    const link = `${window.location.origin}${withBase('/menu/')}?masa=${t.id}`
    setQrLink(link)
    try {
      const url = await QRCode.toDataURL(link, { width: 512, margin: 2, color: { dark: '#3b0764', light: '#ffffff' } })
      setQrUrl(url)
    } catch {
      toast({ title: 'QR üretilemedi', variant: 'destructive' })
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => setEdit({ name: '', zone: 'Salon', seats: '4' })}>
          <Plus className="w-4 h-4 mr-1" /> Masa Ekle
        </Button>
      </div>
      {!tables ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map((t) => (
            <div key={t.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.openOrderId ? 'bg-brand-100' : 'bg-stone-100'}`}>
                  <Armchair className={`w-5 h-5 ${t.openOrderId ? 'text-brand-600' : 'text-stone-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {t.seats} kişilik • {t.zone}
                    {t.openOrderId && <> • açık adisyon: <span className="font-semibold text-brand-700">{formatTL(t.openOrderTotal)}</span></>}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-3">
                <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => openQr(t)}>
                  <QrCode className="w-3.5 h-3.5 mr-1" /> QR Kodu
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8" onClick={() => setEdit({ id: t.id, name: t.name, zone: t.zone, seats: String(t.seats) })} aria-label={`${t.name} düzenle`}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 text-stone-400 hover:text-red-500" onClick={() => setDeleteTarget(t)} aria-label={`${t.name} sil`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Masa formu */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{edit?.id ? 'Masayı Düzenle' : 'Yeni Masa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-name">Masa adı</Label>
              <Input id="t-name" value={edit?.name ?? ''} onChange={(e) => setEdit((p) => (p ? { ...p, name: e.target.value } : p))} placeholder="Ör. Masa 5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-zone">Bölge</Label>
              <Input id="t-zone" value={edit?.zone ?? ''} onChange={(e) => setEdit((p) => (p ? { ...p, zone: e.target.value } : p))} placeholder="Salon, Bahçe, Teras…" list="bolge-onerileri" />
              <datalist id="bolge-onerileri">
                <option value="Salon" />
                <option value="Bahçe" />
                <option value="Teras" />
                <option value="Üst Kat" />
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-seats">Kişi sayısı</Label>
              <Input id="t-seats" value={edit?.seats ?? ''} onChange={(e) => setEdit((p) => (p ? { ...p, seats: e.target.value } : p))} inputMode="numeric" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Vazgeç</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR penceresi */}
      <Dialog open={!!qrTable} onOpenChange={(o) => !o && setQrTable(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode className="w-5 h-5 text-brand-600" /> {qrTable?.name} QR Kodu</DialogTitle>
            <DialogDescription>Müşteri bu kodu okuttuğunda masası seçili olarak dijital menü açılır.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            {qrUrl ? (
              <img src={qrUrl} alt={`${qrTable?.name} QR kodu`} className="w-52 h-52 rounded-xl border shadow-sm" />
            ) : (
              <Skeleton className="w-52 h-52 rounded-xl" />
            )}
            <p className="text-xs text-muted-foreground text-center break-all">{qrLink}</p>
          </div>
          <DialogFooter>
            {qrUrl && (
              <a href={qrUrl} download={`qr-${qrTable?.name ?? 'masa'}.png`} className="w-full">
                <Button className="w-full bg-brand-600 hover:bg-brand-700">
                  <Download className="w-4 h-4 mr-1" /> PNG İndir
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masa silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>&ldquo;{deleteTarget?.name}&rdquo; kalıcı olarak silinecek. Açık adisyonu olan masa silinemez.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTarget && remove(deleteTarget)}>Evet, Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
