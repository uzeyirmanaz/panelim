'use client'

// Ana Sayfa — orijinal panelin karşılama ekranı: günün özet kartları,
// günlük satış çizgi grafiği, masa doluluk oranı, hızlı başlangıç kontrol listesi
// ve modül kısayolları
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { api } from '@/lib/api'
import type { TableDTO } from '@/lib/types'

type Stats = {
  todayRevenue: number
  todayOrders: number
  avgTicket: number
  activeOrders: number
  openTotal: number
  monthRevenue: number
  hourly: Array<{ label: string; revenue: number }>
  last7days: Array<{ date: string; label: string; revenue: number; orders: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  productCount: number
  tableCount: number
  todayGuests?: number
  todayExpense?: number
}

function money(v: number): string {
  return v.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })
}

export function AnasayfaView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [tables, setTables] = useState<TableDTO[] | null>(null)
  const [counts, setCounts] = useState({ categories: 0, users: 1 })
  const [demoYukleniyor, setDemoYukleniyor] = useState(false)
  const [demoMesaj, setDemoMesaj] = useState<string | null>(null)

  useEffect(() => {
    api.get<Stats>('/api/stats').then(setStats).catch(() => {})
    api.get<Array<unknown>>('/api/categories').then((d) => setCounts((p) => ({ ...p, categories: d?.length ?? 0 }))).catch(() => {})
    api.get<TableDTO[]>('/api/tables').then(setTables).catch(() => {})
  }, [])

  async function demoYukle() {
    setDemoYukleniyor(true)
    setDemoMesaj(null)
    try {
      const { demoVeriyiYukle } = await import('@/lib/firebase/demo-veri')
      const sonuc = await demoVeriyiYukle()
      setDemoMesaj(
        `Örnek veriler yüklendi: ${sonuc.kategori} kategori, ${sonuc.urun} ürün, ${sonuc.masa} masa${sonuc.siparis > 0 ? `, ${sonuc.siparis} örnek sipariş` : ''}.`
      )
      const [s, t] = await Promise.all([api.get<Stats>('/api/stats'), api.get<TableDTO[]>('/api/tables')])
      setStats(s)
      setTables(t)
    } catch (e) {
      setDemoMesaj(e instanceof Error ? e.message : 'Örnek veriler yüklenemedi.')
    } finally {
      setDemoYukleniyor(false)
    }
  }

  const bosVeritabani = (stats?.productCount ?? 0) === 0 && (stats?.tableCount ?? 0) === 0

  const checklist = [
    { label: 'Masa / Bölgeler tanımla', done: (stats?.tableCount ?? 0) > 0, href: '/panel/masalar', icon: 'view_quilt' },
    { label: 'Menü / Ürünler tanımla', done: (stats?.productCount ?? 0) > 0 && counts.categories > 0, href: '/panel/menu', icon: 'restaurant_menu' },
    { label: 'Kullanıcı tanımla', done: counts.users > 1, href: '/panel/kullanicilar', icon: 'people' },
    { label: 'Dijital Menüyü paylaş', done: (stats?.productCount ?? 0) > 0, href: '/panel/dijital-menu', icon: 'vibration' },
  ]
  const doneCount = checklist.filter((c) => c.done).length
  const maxRevenue = Math.max(1, ...(stats?.last7days ?? []).map((d) => d.revenue))

  // Masa doluluk oranı — açık adisyonu olan masalar "dolu"
  const masalar = tables ?? []
  const dolu = masalar.filter((t) => t.openOrderId).length
  const bos = masalar.length - dolu
  const doluYuzde = masalar.length > 0 ? Math.round((dolu / masalar.length) * 100) : 0
  const bosYuzde = 100 - doluYuzde
  const dolulukVeri = [
    { name: 'Dolu', value: dolu, renk: '#c92c2c' },
    { name: 'Boş', value: bos, renk: '#e5e7eb' },
  ]

  return (
    <div className="flex flex-col gap-5 p-4 pt-4">
      {/* Günün özeti — orijinal 4 kart: satış / misafir / açık sipariş / gider */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <StatCard icon="layers" bg="#fdecec" fg="#c92c2c" label="Bugünkü toplam satış tutarı" value={money(stats?.todayRevenue ?? 0)} link={{ label: 'Gün sonu raporu', href: '/panel/raporlar/gun-sonu' }} />
        <StatCard icon="people_outline" bg="#ebf6ff" fg="#0056A8" label="Bugün ağırlanan misafir sayısı" value={String(stats?.todayGuests ?? 0)} />
        <StatCard icon="equalizer" bg="#fff4e0" fg="#b26a00" label="Bugün açık sipariş toplamı" value={money(stats?.openTotal ?? 0)} />
        <StatCard icon="import_export" bg="#e8f5e9" fg="#2e7d32" label="Bugünkü toplam gider tutarı" value={money(stats?.todayExpense ?? 0)} link={{ label: 'Masraflar', href: '/panel/gider-masraf' }} />
      </div>

      {/* Boş veritabanı — örnek veri yükleme daveti */}
      {bosVeritabani && (
        <section className="ads-card flex flex-wrap items-center justify-between gap-3 border border-dashed border-[#e0b4b4] bg-[#fffbfb]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fdecec]">
              <i className="material-icons text-[20px] text-[#c92c2c]">auto_awesome</i>
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[#303030]">Sistemi hemen denemek ister misiniz?</p>
              <p className="text-[12.5px] text-neutral-400">Örnek kategoriler, ürünler ve masalar tek tıkla yüklenir.</p>
              {demoMesaj && <p className="mt-1 text-[12.5px] font-medium text-[#2e7d32]">{demoMesaj}</p>}
            </div>
          </div>
          <button type="button" onClick={demoYukle} disabled={demoYukleniyor} className="btn-theme flex items-center gap-2 px-4 py-2.5 text-[13.5px] disabled:opacity-60">
            {demoYukleniyor && <i className="material-icons animate-spin text-[16px]">sync</i>}
            Örnek Verileri Yükle
          </button>
        </section>
      )}

      {/* Günlük satış + doluluk — orijinal ana sayfa grafikleri */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="ads-card flex flex-col xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#303030]">Günlük Satış</h3>
            <span className="ads-chip" style={{ background: '#fdecec', color: '#c92c2c' }}>Bugün: {money(stats?.todayRevenue ?? 0)}</span>
          </div>
          <div className="mt-2 flex-1" style={{ minHeight: 210 }}>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={stats?.hourly ?? []} margin={{ top: 8, right: 14, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="satisDolgu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c92c2c" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#c92c2c" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => `${Number(v)}`} />
                <Tooltip
                  formatter={(v) => [money(Number(v)), 'Satış']}
                  labelStyle={{ fontWeight: 600, color: '#303030' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #ebedf0', fontSize: 12.5 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#c92c2c" strokeWidth={2.5} fill="url(#satisDolgu)" dot={{ r: 3, fill: '#c92c2c', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="ads-card flex flex-col">
          <h3 className="text-[15px] font-semibold text-[#303030]">Masa Doluluk Oranı</h3>
          <div className="relative mt-2 flex-1" style={{ minHeight: 175 }}>
            <ResponsiveContainer width="100%" height={175}>
              <PieChart>
                <Pie data={dolulukVeri} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" startAngle={90} endAngle={-270} strokeWidth={0}>
                  {dolulukVeri.map((g) => (
                    <Cell key={g.name} fill={g.renk} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} masa`, String(n)]} contentStyle={{ borderRadius: 10, border: '1px solid #ebedf0', fontSize: 12.5 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-bold leading-none text-[#303030]">%{doluYuzde}</span>
              <span className="mt-1 text-[11px] text-neutral-400">doluluk</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-5 text-[12.5px] text-[#454545]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#c92c2c' }} /> Dolu %{doluYuzde}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#e5e7eb' }} /> Boş %{bosYuzde}</span>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Hızlı başlangıç — orijinal checklist widget'ı */}
        <section className="ads-card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#303030]">Hızlı Başlangıç</h3>
            <span className="ads-chip" style={{ background: '#fdecec', color: '#c92c2c' }}>{doneCount}/{checklist.length} tamamlandı</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
            <div className="h-full rounded-full bg-[#c92c2c] transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
          </div>
          <div className="flex flex-col gap-1">
            {checklist.map((c) => (
              <Link key={c.label} href={c.href} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#fafafa]">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: c.done ? '#e8f5e9' : '#f5f5f5', color: c.done ? '#2e7d32' : '#a0a0a0' }}
                >
                  <i className="material-icons" style={{ fontSize: 18 }}>{c.done ? 'check' : c.icon}</i>
                </span>
                <span className={`flex-1 text-[13.5px] ${c.done ? 'text-neutral-400 line-through' : 'font-medium text-[#303030]'}`}>{c.label}</span>
                <i className="material-icons text-[16px] text-neutral-300 transition-colors group-hover:text-[#c92c2c]">chevron_right</i>
              </Link>
            ))}
          </div>
        </section>

        {/* Son 7 gün satış grafiği */}
        <section className="ads-card xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#303030]">Son 7 Gün Satışları</h3>
            <Link href="/panel/raporlar/urun-satis" className="flex items-center gap-1 text-[13px] font-medium text-[#c92c2c] hover:underline">
              Raporlar <i className="material-icons" style={{ fontSize: 16 }}>chevron_right</i>
            </Link>
          </div>
          <div className="flex flex-1 items-end gap-2.5 pt-2" style={{ minHeight: 170 }}>
            {(stats?.last7days ?? []).map((d, i) => (
              <div key={d.date} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#303030] opacity-0 transition-opacity group-hover:opacity-100">{money(d.revenue)}</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(4, (d.revenue / maxRevenue) * 130)}px`,
                      background: i === (stats?.last7days.length ?? 8) - 1 ? '#c92c2c' : '#f5b8b8',
                    }}
                  />
                </div>
                <span className="text-[11px] text-neutral-400">{d.label}</span>
              </div>
            ))}
            {!stats && <div className="h-full w-full animate-pulse rounded-lg bg-[#f5f5f5]" />}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Modül kısayolları */}
        <section className="ads-card xl:col-span-2">
          <h3 className="text-[15px] font-semibold text-[#303030]">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ShortcutCard href="/panel/masalar" icon="view_quilt" bg="#fdecec" fg="#c92c2c" label="Masa / Bölgeler" desc="Masaları yönetin, sipariş açın" />
            <ShortcutCard href="/panel/menu" icon="restaurant_menu" bg="#ebf6ff" fg="#0056A8" label="Menü / Ürünler" desc="Ürün ve kategori tanımlayın" />
            <ShortcutCard href="/panel/raporlar/urun-satis" icon="show_chart" bg="#fff4e0" fg="#b26a00" label="Raporlar" desc="Satış raporlarını görün" />
            <ShortcutCard href="/panel/dijital-menu" icon="vibration" bg="#e8f5e9" fg="#2e7d32" label="Dijital Menü" desc="QR menünüzü paylaşın" />
            <ShortcutCard href="/panel/musteriler" icon="assignment_ind" bg="#f3e2ae" fg="#443200" label="Müşteriler" desc="Müşteri kayıtlarını yönetin" />
            <ShortcutCard href="/panel/hesabim" icon="account_circle" bg="#f5f5f5" fg="#454545" label="Hesabım" desc="Paket ve ödeme bilgileri" />
          </div>
        </section>

        {/* En çok satanlar */}
        <section className="ads-card">
          <h3 className="text-[15px] font-semibold text-[#303030]">En Çok Satanlar</h3>
          {(stats?.topProducts ?? []).length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-neutral-300">
              <i className="material-icons" style={{ fontSize: 40 }}>local_mall</i>
              <p className="text-[13px] text-neutral-400">Henüz satış verisi yok</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {(stats?.topProducts ?? []).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 rounded-lg px-1 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fdecec] text-[12px] font-bold text-[#c92c2c]">{i + 1}</span>
                  <span className="flex-1 truncate text-[13.5px] font-medium text-[#303030]">{p.name}</span>
                  <span className="text-[12.5px] text-neutral-400">{p.quantity} adet</span>
                  <span className="w-[80px] text-right text-[13px] font-semibold text-[#303030]">{money(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon, bg, fg, label, value, sub, link }: { icon: string; bg: string; fg: string; label: string; value: string; sub?: string; link?: { label: string; href: string } }) {
  return (
    <div className="ads-card" style={{ gap: 10 }}>
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: bg, color: fg }}>
          <i className="material-icons" style={{ fontSize: 20 }}>{icon}</i>
        </span>
        {link && (
          <Link href={link.href} className="flex items-center gap-0.5 text-[12px] font-medium text-[#c92c2c] hover:underline">
            {link.label}
            <i className="material-icons" style={{ fontSize: 14 }}>chevron_right</i>
          </Link>
        )}
      </div>
      <div>
        <p className="text-[12.5px] text-[#303030] opacity-60">{label}</p>
        <p className="text-[20px] font-bold leading-tight text-[#303030]">{value}</p>
        {sub && <p className="text-[12px] text-neutral-400">Açık hesap: {sub}</p>}
      </div>
    </div>
  )
}

function ShortcutCard({ href, icon, bg, fg, label, desc }: { href: string; icon: string; bg: string; fg: string; label: string; desc: string }) {
  return (
    <Link href={href} className="group flex flex-col gap-2 rounded-xl border border-[#ebedf0] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.15)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: bg, color: fg }}>
        <i className="material-icons" style={{ fontSize: 20 }}>{icon}</i>
      </span>
      <span className="text-[13.5px] font-semibold text-[#303030]">{label}</span>
      <span className="text-[12px] leading-snug text-neutral-400">{desc}</span>
    </Link>
  )
}
