'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatTL, type StatsDTO } from '@/lib/types'
import { useInterval, usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Banknote, ChefHat, PieChart as PieIcon, Receipt, TrendingUp } from 'lucide-react'

const PIE_COLORS = ['#C1272D', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#84cc16', '#a8a29e', '#eab308']

export function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<StatsDTO | null>(null)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])
  usePosEvents(useCallback((e) => {
    if (['order:new', 'order:paid', 'order:deleted', 'menu:changed'].includes(e.event)) refetch()
  }, [refetch]))
  useInterval(refetch, 30000)

  useEffect(() => {
    let cancelled = false
    api.get<StatsDTO>('/api/stats')
      .then((d) => { if (!cancelled) setStats(d) })
      .catch((err) => {
        if (!cancelled) toast({ title: 'İstatistikler yüklenemedi', description: String(err instanceof Error ? err.message : err), variant: 'destructive' })
      })
    return () => { cancelled = true }
  }, [version, toast])

  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  const cards = [
    { label: 'Bugünkü Ciro', value: formatTL(stats.todayRevenue), icon: <Banknote className="w-5 h-5 text-brand-600" /> },
    { label: 'Bugünkü Sipariş', value: String(stats.todayOrders), icon: <Receipt className="w-5 h-5 text-amber-600" /> },
    { label: 'Ortalama Sepet', value: formatTL(stats.avgTicket), icon: <TrendingUp className="w-5 h-5 text-emerald-600" /> },
    { label: 'Aktif Adisyon', value: String(stats.activeOrders), icon: <Activity className="w-5 h-5 text-rose-600" /> },
  ]

  return (
    <div className="space-y-4">
      {/* Özet kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {c.icon}
              </div>
              <p className="text-xl font-bold mt-1.5 tracking-tight">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Ciro grafiği */}
        <Card className="rounded-2xl shadow-sm lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" /> Son 8 Gün Ciro
            </CardTitle>
            <CardDescription>Ödenmiş adisyonlar (₺)</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last7days} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}b` : String(v))} />
                <Tooltip
                  formatter={(v: number | string) => [formatTL(Number(v)), 'Ciro']}
                  labelFormatter={(l) => `${l}`}
                  contentStyle={{ borderRadius: 12, border: '1px solid #eee' }}
                />
                <Bar dataKey="revenue" fill="#C1272D" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Kategori dağılımı */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-brand-600" /> Kategori Cirosu
            </CardTitle>
            <CardDescription>Son 8 gün • payı</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {stats.categoryShare.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-16">Henüz veri yok</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.categoryShare} dataKey="revenue" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {stats.categoryShare.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number | string) => [formatTL(Number(v)), 'Ciro']} contentStyle={{ borderRadius: 12, border: '1px solid #eee' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* En çok satanlar */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-brand-600" /> En Çok Satanlar
            </CardTitle>
            <CardDescription>Son 8 gün • adet</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz veri yok</p>
            ) : (
              <ol className="space-y-2">
                {stats.topProducts.map((p, i) => (
                  <li key={p.name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                    <span className="text-sm text-muted-foreground">{p.quantity} adet</span>
                    <span className="text-sm font-semibold text-brand-700 w-24 text-right">{formatTL(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Sistem özeti */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sistem Özeti</CardTitle>
            <CardDescription>Menü ve masa durumu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm py-1.5 border-b">
              <span className="text-muted-foreground">Kategori sayısı</span>
              <span className="font-semibold">{stats.categoryShare.length}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b">
              <span className="text-muted-foreground">Ürün sayısı</span>
              <span className="font-semibold">{stats.productCount}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b">
              <span className="text-muted-foreground">Masa sayısı</span>
              <span className="font-semibold">{stats.tableCount}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-muted-foreground">8 günlük toplam ciro</span>
              <span className="font-semibold text-brand-700">{formatTL(stats.last7days.reduce((s, d) => s + d.revenue, 0))}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
