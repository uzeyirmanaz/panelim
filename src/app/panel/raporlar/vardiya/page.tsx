'use client'

// Vardiya Satış Raporu
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { money } from '@/components/panel/definition-page'
import { ReportFrame, DateRangePicker } from '@/components/panel/report-frame'

type Row = { name: string; revenue: number; orders: number }
type Data = { rows: Row[]; totalRevenue: number; orderCount: number }

const ICONS = ['wb_twilight', 'wb_sunny', 'dark_mode']

export default function VardiyaRaporuPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [range, setRange] = useState({ from: today, to: today })
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<Data>(`/api/reports?type=vardiya&from=${range.from}&to=${range.to}`)
      .then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [range])

  return (
    <ReportFrame
      title="Vardiya Satış Raporu"
      icon="request_quote"
      actions={<DateRangePicker from={range.from} to={range.to} onChange={setRange} />}
    >
      {loading ? (
        <p className="px-5 py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 pt-4 md:grid-cols-3">
          {(data?.rows ?? []).map((r, i) => (
            <div key={r.name} className="rounded-xl border border-[#ebedf0] p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fdecec] text-[#c92c2c]">
                  <i className="material-icons" style={{ fontSize: 20 }}>{ICONS[i]}</i>
                </span>
                <div>
                  <p className="text-[12px] text-[#303030] opacity-60">Vardiya {i + 1}</p>
                  <p className="text-[14px] font-semibold text-[#303030]">{r.name}</p>
                </div>
              </div>
              <p className="mt-3 text-[22px] font-bold text-[#303030]">{money(r.revenue)}</p>
              <p className="text-[12.5px] text-neutral-400">{r.orders} sipariş</p>
            </div>
          ))}
          <div className="rounded-xl bg-[#fafafa] p-4 md:col-span-3">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-[#303030]">TOPLAM</span>
              <span className="text-[18px] font-bold text-[#2e7d32]">{money(data?.totalRevenue ?? 0)} <span className="text-[12px] font-normal text-neutral-400">/ {data?.orderCount ?? 0} sipariş</span></span>
            </div>
          </div>
        </div>
      )}
    </ReportFrame>
  )
}
