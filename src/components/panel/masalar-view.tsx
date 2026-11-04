'use client'

// Masalar ekranı — orijinal panel masa planı:
// Masa Gruplaması / Liste Görünümü, bölge sekmeleri, renk kodlu masa kartları
// (kırmızı: adisyon, yeşil: yeni hareket, beyaz: boş) ve ⋮ işlemler menüsü:
// Öde, Hesap Öde, Masa Değiştir, Masa Birleştir, Adisyon Aktar, İptal
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftRight,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Ellipsis,
  Grid3X3,
  List,
  LogIn,
  Merge,
  ReceiptText,
  ShoppingBag,
  Package,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatTL, type TableDTO } from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Masanın açık adisyonunun toplamı
function tableTotal(t: TableDTO) {
  return t.openOrderId ? t.openOrderTotal : 0
}

// Kart rengi: son 20 dakikada hareket gören masa yeşil, eskisi kırmızı (orijinaldeki kodlama)
function tableHeat(t: TableDTO): 'empty' | 'fresh' | 'stale' {
  if (!t.openOrderId) return 'empty'
  if (!t.lastOrderAt) return 'stale'
  return Date.now() - new Date(t.lastOrderAt).getTime() < 20 * 60 * 1000 ? 'fresh' : 'stale'
}

// "1 saat 41 dk." biçiminde geçen süre
function elapsedLabel(t: TableDTO): string {
  if (!t.lastOrderAt) return ''
  const mins = Math.max(0, Math.floor((Date.now() - new Date(t.lastOrderAt).getTime()) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} dakika.`
  return `${h} saat ${m} dk.`
}

export function MasalarView() {
  const router = useRouter()
  const { toast } = useToast()
  const [tables, setTables] = useState<TableDTO[] | null>(null)
  const [mode, setMode] = useState<'grid' | 'list'>('grid')
  const [zone, setZone] = useState<string | null>(null) // null = ilk bölge
  const [menuFor, setMenuFor] = useState<string | null>(null) // ⋮ açılan masa
  const [moveFor, setMoveFor] = useState<{ orderId: string; sourceName: string; intent: 'move' | 'merge' } | null>(null) // hedef masa seçim diyaloğu
  const [, setTick] = useState(0) // süre etiketlerini tazelemek için
  const [demoYukleniyor, setDemoYukleniyor] = useState(false)
  const [demoMesaj, setDemoMesaj] = useState<string | null>(null)

  async function demoYukle() {
    setDemoYukleniyor(true)
    setDemoMesaj(null)
    try {
      const { demoVeriyiYukle } = await import('@/lib/firebase/demo-veri')
      const sonuc = await demoVeriyiYukle()
      setDemoMesaj(
        `Örnek veriler yüklendi: ${sonuc.kategori} kategori, ${sonuc.urun} ürün, ${sonuc.masa} masa${sonuc.siparis > 0 ? `, ${sonuc.siparis} örnek sipariş` : ''}.`,
      )
      refetch()
    } catch (e) {
      setDemoMesaj(e instanceof Error ? e.message : 'Örnek veriler yüklenemedi.')
    } finally {
      setDemoYukleniyor(false)
    }
  }

  const refetch = useCallback(() => {
    api.get<TableDTO[]>('/api/tables').then(setTables).catch(() => {})
  }, [])

  usePosEvents(
    useCallback(
      (e) => {
        if (['order:new', 'order:updated', 'order:paid', 'order:deleted', 'table:changed'].includes(e.event)) refetch()
      },
      [refetch]
    )
  )
  useInterval(refetch, 10000)
  useInterval(() => setTick((x) => x + 1), 30000)

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    function close(e: MouseEvent) {
      // Next.js App Router'da React kökü document olduğundan stopPropagation,
      // document üzerindeki diğer dinleyicileri durdurmaz. Menü/⋮ içi tıklamaları yoksay.
      const target = e.target as HTMLElement | null
      if (target?.closest?.('[data-menu-keep]')) return
      setMenuFor(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const zones = useMemo(() => Array.from(new Set((tables ?? []).map((t) => t.zone))), [tables])
  const activeZone = zone && zones.includes(zone) ? zone : zones[0] ?? null
  const zoneTables = useMemo(
    () => (tables ?? []).filter((t) => !activeZone || t.zone === activeZone),
    [tables, activeZone]
  )

  async function payTable(t: TableDTO) {
    if (!t.openOrderId) return
    try {
      await api.patch(`/api/orders/${t.openOrderId}`, { action: 'pay' })
      toast({ title: 'Hesap kapatıldı ✓', description: `${t.name} • ${formatTL(t.openOrderTotal)}` })
      refetch()
    } catch {
      toast({ title: 'Hesap kapatılamadı', variant: 'destructive' })
    }
  }

  async function cancelTable(t: TableDTO) {
    if (!t.openOrderId) return
    if (!window.confirm(`${t.name} masasındaki adisyon iptal edilsin mi?`)) return
    try {
      await api.del(`/api/orders/${t.openOrderId}`)
      toast({ title: 'Adisyon iptal edildi' })
      refetch()
    } catch {
      toast({ title: 'Adisyon iptal edilemedi', variant: 'destructive' })
    }
  }

  if (!tables) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg bg-neutral-200/70" />
        ))}
      </div>
    )
  }

  // Adisyon taşıma (masa değiştir / birleştir)
  async function moveToTable(targetId: string) {
    if (!moveFor) return
    try {
      const res = await api.patch<{ merged?: boolean }>(`/api/orders/${moveFor.orderId}`, {
        action: 'move',
        tableId: targetId,
      })
      toast({
        title: res?.merged ? 'Masalar birleştirildi ✓' : 'Adisyon taşındı ✓',
        description: res?.merged
          ? `${moveFor.sourceName} ürünleri hedef adisyona eklendi`
          : `${moveFor.sourceName} → hedef masa`,
      })
      setMoveFor(null)
      refetch()
    } catch (e) {
      toast({ title: 'Taşıma başarısız', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Görünüm anahtarı + hızlı sipariş butonları — orijinaldeki düzen */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('grid')}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors',
              mode === 'grid' ? 'bg-[#c92c2c] text-white shadow-[0_2px_6px_rgba(201,44,44,0.35)]' : 'bg-[#f5f5f5] text-[#454545] hover:bg-[#eee]'
            )}
          >
            <Grid3X3 className="h-4 w-4" />
            Masa Gruplaması
          </button>
          <button
            type="button"
            onClick={() => setMode('list')}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors',
              mode === 'list' ? 'bg-[#c92c2c] text-white shadow-[0_2px_6px_rgba(201,44,44,0.35)]' : 'bg-[#f5f5f5] text-[#454545] hover:bg-[#eee]'
            )}
          >
            <List className="h-4 w-4" />
            Liste Görünümü
          </button>
        </div>

        {/* Paket / Gel-Al hızlı sipariş — orijinaldeki sağ üst aksiyonlar */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/panel/siparis?masa=paket')}
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#fff4e0] px-4 text-[13px] font-medium text-[#b26a00] transition-colors hover:bg-[#ffe9c7]"
          >
            <Package className="h-4 w-4" />
            Paket Sipariş
          </button>
          <button
            type="button"
            onClick={() => router.push('/panel/siparis?masa=gelal')}
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#ebf6ff] px-4 text-[13px] font-medium text-[#0056A8] transition-colors hover:bg-[#d7edff]"
          >
            <ShoppingBag className="h-4 w-4" />
            Gel-Al Sipariş
          </button>
        </div>

        <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-400">
          <button
            type="button"
            aria-label="Önceki bölge"
            onClick={() => {
              const i = zones.indexOf(activeZone ?? '')
              setZone(zones[(i - 1 + zones.length) % zones.length])
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm hover:text-neutral-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Sonraki bölge"
            onClick={() => {
              const i = zones.indexOf(activeZone ?? '')
              setZone(zones[(i + 1) % zones.length])
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm hover:text-neutral-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Boş veritabanı — örnek veri yükleme daveti */}
      {(tables ?? []).length === 0 && (
        <section className="ads-card mt-4 flex flex-wrap items-center justify-between gap-3 border border-dashed border-[#e0b4b4] bg-[#fffbfb]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fdecec]">
              <i className="material-icons text-[20px] text-[#c92c2c]">auto_awesome</i>
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[#303030]">Sistemi hemen denemek ister misiniz?</p>
              <p className="text-[12.5px] text-neutral-400">Örnek kategoriler, ürünler, masalar ve siparişler tek tıkla yüklenir.</p>
              {demoMesaj && <p className="mt-1 text-[12.5px] font-medium text-[#2e7d32]">{demoMesaj}</p>}
            </div>
          </div>
          <button type="button" onClick={demoYukle} disabled={demoYukleniyor} className="btn-theme flex items-center gap-2 px-4 py-2.5 text-[13.5px] disabled:opacity-60">
            {demoYukleniyor && <i className="material-icons animate-spin text-[16px]">sync</i>}
            Örnek Verileri Yükle
          </button>
        </section>
      )}

      {/* Bölge sekmeleri */}
      <div className="mt-3 flex gap-6 overflow-x-auto border-b border-neutral-200 pb-px">
        {zones.map((z) => {
          const count = (tables ?? []).filter((t) => t.zone === z).length
          const active = z === activeZone
          return (
            <button
              key={z}
              type="button"
              onClick={() => setZone(z)}
              className={cn(
                'relative whitespace-nowrap pb-2.5 text-[13.5px] transition-colors',
                active ? 'font-semibold text-[#c92c2c]' : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              {z} <span className="font-normal">({count})</span>
              {active && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-[#c92c2c]" />}
            </button>
          )
        })}
      </div>

      {/* Masa ızgarası */}
      {mode === 'grid' ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {zoneTables.map((t) => {
            const heat = tableHeat(t)
            const open = heat !== 'empty'
            return (
              <div key={t.id} className="relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/panel/siparis?masa=${t.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') router.push(`/panel/siparis?masa=${t.id}`)
                  }}
                  className={cn(
                    'relative flex h-36 w-full cursor-pointer flex-col rounded-lg border p-3 text-left transition-all hover:shadow-md',
                    heat === 'empty' && 'border-neutral-200/80 bg-white hover:border-neutral-300',
                    heat === 'fresh' && 'border-[#b5d4ad] bg-[#e7f2e4]',
                    heat === 'stale' && 'border-[#f2c9cc] bg-[#fcecee]'
                  )}
                >
                  <div className="flex w-full items-start justify-between">
                    <div className="min-w-0">
                      {open ? (
                        <>
                          <p className="truncate text-[13px] font-semibold text-[#37474f]">{t.name}</p>
                          <p className="text-[11px] leading-tight text-neutral-400">Masa</p>
                        </>
                      ) : null}
                    </div>
                    {open && (
                      <button
                        type="button"
                        aria-label={`${t.name} işlemleri`}
                        data-menu-keep
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuFor(menuFor === t.id ? null : t.id)
                        }}
                        className={cn(
                          'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full',
                          heat === 'fresh' ? 'bg-[#cfe6c8] text-[#2e7d32]' : 'bg-[#f6d5d8] text-[#c62828]'
                        )}
                      >
                        <Ellipsis className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {open ? (
                    <div className="flex flex-1 flex-col justify-center">
                      <p className={cn('text-[19px] font-bold tracking-tight', heat === 'fresh' ? 'text-[#2e7d32]' : 'text-[#c62828]')}>
                        {formatTL(tableTotal(t))}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-[13.5px] text-neutral-400">{t.name}</p>
                    </div>
                  )}

                  {open && <p className="text-[10.5px] text-neutral-400">{elapsedLabel(t)}</p>}
                </div>

                {/* ⋮ işlemler menüsü — orijinaldeki Hızlı İşlemler listesi */}
                {open && menuFor === t.id && (
                  <div
                    data-menu-keep
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-12 z-20 w-56 overflow-hidden rounded-xl border bg-white text-[13px] shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMenuFor(null)
                        payTable(t)
                      }}
                      className="flex h-10 w-full items-center gap-2.5 px-3.5 text-[#37474f] hover:bg-neutral-50"
                    >
                      <Banknote className="h-4 w-4 text-emerald-600" /> Öde
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuFor(null)
                        payTable(t)
                      }}
                      className="flex h-10 w-full items-center gap-2.5 px-3.5 text-[#37474f] hover:bg-neutral-50"
                    >
                      <ReceiptText className="h-4 w-4 text-emerald-600" /> Hesap Öde ({formatTL(tableTotal(t))})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuFor(null)
                        if (t.openOrderId) setMoveFor({ orderId: t.openOrderId, sourceName: t.name, intent: 'move' })
                      }}
                      className="flex h-10 w-full items-center gap-2.5 px-3.5 text-[#37474f] hover:bg-neutral-50"
                    >
                      <ArrowLeftRight className="h-4 w-4 text-[#5c6bc0]" /> Masa Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuFor(null)
                        if (t.openOrderId) setMoveFor({ orderId: t.openOrderId, sourceName: t.name, intent: 'merge' })
                      }}
                      className="flex h-10 w-full items-center gap-2.5 px-3.5 text-[#37474f] hover:bg-neutral-50"
                    >
                      <Merge className="h-4 w-4 text-[#00897b]" /> Masa Birleştir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuFor(null)
                        if (t.openOrderId) setMoveFor({ orderId: t.openOrderId, sourceName: t.name, intent: 'move' })
                      }}
                      className="flex h-10 w-full items-center gap-2.5 px-3.5 text-[#37474f] hover:bg-neutral-50"
                    >
                      <LogIn className="h-4 w-4 text-[#fb8c00]" /> Adisyon Aktar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuFor(null)
                        cancelTable(t)
                      }}
                      className="flex h-10 w-full items-center gap-2.5 border-t border-neutral-100 px-3.5 text-red-600 hover:bg-red-50"
                    >
                      <CircleSlash className="h-4 w-4" /> İptal
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Liste görünümü */
        <div className="mt-4 overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b bg-neutral-50 text-left text-neutral-500">
                <th className="px-4 py-2.5 font-medium">Masa</th>
                <th className="px-4 py-2.5 font-medium">Bölge</th>
                <th className="px-4 py-2.5 font-medium">Durum</th>
                <th className="px-4 py-2.5 font-medium">Süre</th>
                <th className="px-4 py-2.5 text-right font-medium">Tutar</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {zoneTables.map((t) => {
                const heat = tableHeat(t)
                const open = heat !== 'empty'
                return (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-neutral-50/70">
                    <td className="px-4 py-2.5 font-medium text-[#263238]">{t.name}</td>
                    <td className="px-4 py-2.5 text-neutral-500">{t.zone}</td>
                    <td className="px-4 py-2.5">
                      {open ? (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11.5px] font-medium',
                            heat === 'fresh' ? 'bg-[#e7f2e4] text-[#2e7d32]' : 'bg-[#fcecee] text-[#c62828]'
                          )}
                        >
                          Adisyon Açık
                        </span>
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11.5px] font-medium text-neutral-500">
                          Boş
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-400">{open ? elapsedLabel(t) : '—'}</td>
                    <td className={cn('px-4 py-2.5 text-right font-semibold', open ? (heat === 'fresh' ? 'text-[#2e7d32]' : 'text-[#c62828]') : 'text-neutral-300')}>
                      {open ? formatTL(tableTotal(t)) : '₺0,00'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/panel/siparis?masa=${t.id}`)}
                          className="h-8 rounded-lg border border-neutral-200 px-3 text-[12px] font-medium text-neutral-600 hover:border-brand-300 hover:text-brand-700"
                        >
                          {open ? 'Adisyon' : 'Sipariş Aç'}
                        </button>
                        {open && (
                          <button
                            type="button"
                            onClick={() => payTable(t)}
                            className="h-8 rounded-lg bg-emerald-600 px-3 text-[12px] font-medium text-white hover:bg-emerald-700"
                          >
                            Öde
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {zoneTables.length === 0 && (
        <div className="mt-16 text-center text-[13.5px] text-neutral-400">
          Bu bölgede masa bulunmuyor.
        </div>
      )}

      {/* Hedef masa seçim diyaloğu — Masa Değiştir / Masa Birleştir / Adisyon Aktar */}
      {moveFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setMoveFor(null)}>
          <div
            className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-[14px] font-semibold text-[#263238]">
                {moveFor.intent === 'merge' ? 'Birleştirilecek masayı seçin' : 'Hedef masa seçin'}
              </p>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setMoveFor(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="px-4 pt-2.5 text-[12px] text-neutral-400">
              {moveFor.sourceName} adisyonı {moveFor.intent === 'merge' ? 'seçilen masadaki adisyonla birleştirilecek' : 'seçilen masaya taşınacak'}
            </p>
            <div className="max-h-72 overflow-y-auto p-3 nice-scroll">
              <div className="grid grid-cols-3 gap-2">
                {tables
                  .filter((x) => x.id !== menuFor)
                  .map((x) => {
                    const occupied = !!x.openOrderId
                    return (
                      <button
                        key={x.id}
                        type="button"
                        onClick={() => moveToTable(x.id)}
                        className={cn(
                          'flex h-16 flex-col items-center justify-center rounded-lg border text-[12.5px] font-medium transition-all hover:shadow-md',
                          occupied
                            ? 'border-[#f2c9cc] bg-[#fcecee] text-[#c62828]'
                            : 'border-neutral-200 bg-white text-neutral-500 hover:border-brand-300'
                        )}
                      >
                        <span>{x.name}</span>
                        <span className="mt-0.5 text-[10px] text-neutral-400">
                          {occupied ? `Adisyon ${formatTL(x.openOrderTotal)}` : 'Boş'}
                        </span>
                      </button>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
