'use client'

// Raporlar ekranı — orijinal panel düzeni:
// dönem sekmeleri (Bugün, Bu Hafta, Son 7 Gün, Bu Ay, Son 30 Gün) + tarih aralığı + takvim,
// 4 istatistik kartı (ikon + değer + "Geçen Hafta Bugün" karşılaştırması + yeşil/kırmızı % rozeti),
// Saat Satış Grafiği çizgi grafiği, Dağılım Grafiği donut (merkezde toplam + % göstergeli)
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronDown, ReceiptText, ShoppingBag, Users, Wallet } from 'lucide-react'
import { api } from '@/lib/api'
import { formatTL, type StatsDTO } from '@/lib/types'
import { usePosEvents } from '@/hooks/use-pos-events'
import { cn } from '@/lib/utils'

const PERIODS = ['Bugün', 'Bu Hafta', 'Son 7 Gün', 'Bu Ay', 'Son 30 Gün'] as const
type Period = (typeof PERIODS)[number]

const DONUT_COLORS = ['#1e88e5', '#e53935', '#fdd835', '#43a047', '#fb8c00', '#8e24aa', '#00acc1']

function StatCard(props: {
  icon: React.ReactNode
  label: string
  value: string
  prev?: number
  curr?: number
  suffix?: string
}) {
  // "Geçen Hafta Bugün" karşılaştırması: önceki dönem değeri + % değişim
  let pill: { up: boolean; text: string } | null = null
  if (props.curr !== undefined && props.prev !== undefined && props.prev > 0 && props.curr !== props.prev) {
    const pct = Math.round(((props.curr - props.prev) / props.prev) * 100)
    pill = { up: pct >= 0, text: `%${Math.abs(pct)}` }
  }
  return (
    <div className="rounded-lg border border-neutral-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        {props.icon}
        <p className="text-[12px] text-neutral-400">{props.label}</p>
      </div>
      <p className="mt-1.5 text-[21px] font-bold tracking-tight text-[#263238]">
        {props.value}
        {props.suffix && <span className="ml-1 text-[13px] font-medium text-neutral-400">{props.suffix}</span>}
      </p>
      {props.prev !== undefined && (
        <div className="mt-2.5 flex items-center justify-between border-t border-neutral-100 pt-2 text-[11.5px]">
          <span className="text-neutral-400">Geçen Hafta Bugün</span>
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-neutral-500">{formatTL(props.prev)}</span>
            {pill && (
              <span
                className={cn(
                  'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                  pill.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                )}
              >
                {pill.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {pill.text}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}

export function PanelReportsView() {
  const [stats, setStats] = useState<StatsDTO | null>(null)
  const [period, setPeriod] = useState<Period>('Bugün')
  // Tarih aralığı varsayılan: bugün (ilk render'da hesaplanır)
  const [range, setRange] = useState<{ from: string; to: string }>(() => {
    const today = new Date().toISOString().slice(0, 10)
    return { from: today, to: today }
  })

  const refetch = useCallback(() => {
    api.get<StatsDTO>('/api/stats').then(setStats).catch(() => {})
  }, [])
  usePosEvents(
    useCallback(
      (e) => {
        if (['order:paid', 'order:new', 'order:updated'].includes(e.event)) refetch()
      },
      [refetch]
    )
  )
  useEffect(() => {
    refetch()
  }, [refetch])

  // Grafik verisi: Bugün → saatlik, diğerleri → günlük seri
  const lineData = useMemo(() => {
    if (!stats) return []
    if (period === 'Bugün') return stats.hourly.map((h) => ({ label: h.label, value: h.revenue }))
    const n = period === 'Bu Hafta' || period === 'Son 7 Gün' ? 7 : 8
    return stats.last7days.slice(-n).map((d) => ({ label: d.label, value: d.revenue }))
  }, [stats, period])

  const donutData = useMemo(
    () =>
      (stats?.categoryShare ?? []).map((c, i) => ({
        name: c.name,
        value: c.revenue,
        fill: DONUT_COLORS[i % DONUT_COLORS.length],
      })),
    [stats]
  )
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)

  // "Geçen Hafta Bugün" karşılaştırması: bugün vs 7 gün önceki satış
  const prevWeekRevenue = useMemo(() => {
    if (!stats || stats.last7days.length < 7) return undefined
    return stats.last7days[stats.last7days.length - 7]?.revenue
  }, [stats])

  if (!stats) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-9 w-40 mx-auto animate-pulse rounded-lg bg-neutral-200/70" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-neutral-200/70" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-neutral-200/70" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Başlık */}
      <h2 className="text-center text-[16px] font-semibold text-[#263238]">Raporlar</h2>

      {/* Dönem sekmeleri + tarih aralığı */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 border-b border-neutral-200 pb-px">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              'relative pb-2.5 text-[13px] transition-colors',
              period === p ? 'font-semibold text-brand-600' : 'text-neutral-400 hover:text-neutral-600'
            )}
          >
            {p}
            {period === p && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-brand-600" />}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-[12px] text-neutral-500">
          <input
            type="date"
            value={range?.from ?? ''}
            onChange={(e) => setRange((r) => ({ from: e.target.value, to: r?.to ?? e.target.value }))}
            className="h-8 rounded-md border border-neutral-200 px-2 text-[12px] text-neutral-600 focus:border-brand-400 focus:outline-none"
            aria-label="Başlangıç tarihi"
          />
          <span aria-hidden>↔</span>
          <input
            type="date"
            value={range?.to ?? ''}
            onChange={(e) => setRange((r) => ({ from: r?.from ?? e.target.value, to: e.target.value }))}
            className="h-8 rounded-md border border-neutral-200 px-2 text-[12px] text-neutral-600 focus:border-brand-400 focus:outline-none"
            aria-label="Bitiş tarihi"
          />
          <button
            type="button"
            aria-label="Takvimden seç"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-700"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* İstatistik kartları — orijinal kart yapısı */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fce8e6] text-[#e53935]">
              <Wallet className="h-4.5 w-4.5" />
            </span>
          }
          label="Anlık Sipariş Toplamı"
          value={formatTL(stats.todayRevenue)}
          prev={prevWeekRevenue}
          curr={stats.todayRevenue}
        />
        <StatCard
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1e88e5]">
              <ReceiptText className="h-4.5 w-4.5" />
            </span>
          }
          label="Toplam Ödeme Tutarı"
          value={formatTL(stats.openTotal)}
        />
        <StatCard
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fef3e0] text-[#fb8c00]">
              <ShoppingBag className="h-4.5 w-4.5" />
            </span>
          }
          label="Ağırlanan Misafir"
          value={String(stats.todayOrders)}
        />
        <StatCard
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#43a047]">
              <Users className="h-4.5 w-4.5" />
            </span>
          }
          label="Ortalama Sepet"
          value={formatTL(stats.avgTicket)}
        />
      </div>

      {/* Grafikler */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Saat Satış Grafiği */}
        <section className="rounded-lg border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 text-[12px] text-neutral-500">
            <h3 className="text-[14px] font-semibold text-[#263238]">Saat Bazlı Satışlar</h3>
            <span className="ml-auto flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[11.5px] text-neutral-500">
              Tümü <ChevronDown className="h-3 w-3 opacity-60" />
            </span>
            <span className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[11.5px] text-neutral-500">
              Geçen Hafta Bugün <ChevronDown className="h-3 w-3 opacity-60" />
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#e53935]" /> Bugün
            </span>
          </div>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eceff1" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: '#90a4ae' }} tickLine={false} axisLine={{ stroke: '#eceff1' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10.5, fill: '#90a4ae' }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `₺${v}`} />
                <Tooltip
                  formatter={(v) => [formatTL(Number(v)), 'Satış']}
                  contentStyle={{ borderRadius: 10, borderColor: '#eceff1', fontSize: 12.5 }}
                />
                <Line type="monotone" dataKey="value" stroke="#e53935" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Dağılım Grafiği — merkezde toplam + % göstergeli */}
        <section className="rounded-lg border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-[#263238]">Dağılım Grafiği</h3>
            <span className="ml-auto flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[11.5px] text-neutral-500">
              Menü Türleri <ChevronDown className="h-3 w-3 opacity-60" />
            </span>
            <span className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[11.5px] text-neutral-500">
              Son 1 Hafta <ChevronDown className="h-3 w-3 opacity-60" />
            </span>
          </div>
          <div className="relative mt-3 h-64">
            {donutTotal === 0 ? (
              <div className="flex h-full items-center justify-center text-[13px] text-neutral-400">
                Henüz kapanmış satış yok
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="85%"
                      paddingAngle={2}
                      strokeWidth={0}
                      isAnimationActive={false}
                    >
                      {donutData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [formatTL(Number(v)), String(n)]}
                      contentStyle={{ borderRadius: 10, borderColor: '#eceff1', fontSize: 12.5 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Merkez toplam */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] text-neutral-400">Toplam</span>
                  <span className="text-[17px] font-bold text-[#263238]">{formatTL(donutTotal)}</span>
                </div>
              </>
            )}
          </div>
          {donutTotal > 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {donutData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 text-[11.5px] text-neutral-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  {d.name}
                  <span className="font-semibold text-[#37474f]">%{Math.round((d.value / donutTotal) * 100)}</span>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
