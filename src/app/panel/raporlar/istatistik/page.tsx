'use client'

// Restaurant İstatistikleri
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { money } from '@/components/panel/definition-page'
import { ReportFrame, DateRangePicker } from '@/components/panel/report-frame'

type Data = {
  totalRevenue: number
  orderCount: number
  avgTicket: number
  byType: { masa: number; paket: number; gelal: number }
  byZone: Array<{ zone: string; revenue: number }>
  busiestHour: number | null
}

export default function IstatistikPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [range, setRange] = useState({ from: today, to: today })
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<Data>(`/api/reports?type=istatistik&from=${range.from}&to=${range.to}`)
      .then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [range])

  const maxZone = Math.max(1, ...(data?.byZone ?? []).map((z) => z.revenue))

  return (
    <ReportFrame
      title="Restaurant İstatistikleri"
      icon="query_stats"
      actions={<DateRangePicker from={range.from} to={range.to} onChange={setRange} />}
    >
      {loading ? (
        <p className="px-5 py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</p>
      ) : (
        <div className="flex flex-col gap-5 px-5 pb-5 pt-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Sum label="Toplam Ciro" value={money(data?.totalRevenue ?? 0)} />
            <Sum label="Sipariş Sayısı" value={String(data?.orderCount ?? 0)} />
            <Sum label="Ortalama Sepet" value={money(data?.avgTicket ?? 0)} />
            <Sum label="En Yoğun Saat" value={data?.busiestHour !== null && data?.busiestHour !== undefined ? `${String(data.busiestHour).padStart(2, '0')}:00` : '—'} />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-[13.5px] font-semibold text-[#303030]">Sipariş Tipine Göre</h4>
              <div className="flex flex-col gap-2">
                {([['Masa', data?.byType.masa ?? 0, '#c92c2c'], ['Paket', data?.byType.paket ?? 0, '#f69322'], ['Gel-Al', data?.byType.gelal ?? 0, '#4a90e2']] as const).map(([label, v, color]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-16 text-[13px] text-[#303030]">{label}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f3f4f6]">
                      <div className="h-full rounded-full" style={{ width: `${data && data.orderCount ? (v / data.orderCount) * 100 : 0}%`, background: color }} />
                    </div>
                    <span className="w-8 text-right text-[13px] font-semibold text-[#303030]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-[13.5px] font-semibold text-[#303030]">Bölge Bazlı Ciro</h4>
              {(data?.byZone ?? []).length === 0 ? (
                <p className="py-4 text-center text-[13px] text-neutral-400">Veri yok</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(data?.byZone ?? []).slice(0, 5).map((z) => (
                    <div key={z.zone} className="flex items-center gap-3">
                      <span className="w-24 truncate text-[13px] text-[#303030]">{z.zone}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div className="h-full rounded-full bg-[#c92c2c]" style={{ width: `${(z.revenue / maxZone) * 100}%` }} />
                      </div>
                      <span className="w-[90px] text-right text-[12.5px] font-semibold text-[#303030]">{money(z.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ReportFrame>
  )
}

function Sum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ebedf0] px-4 py-3">
      <p className="text-[12px] text-[#303030] opacity-60">{label}</p>
      <p className="text-[18px] font-bold text-[#303030]">{value}</p>
    </div>
  )
}
