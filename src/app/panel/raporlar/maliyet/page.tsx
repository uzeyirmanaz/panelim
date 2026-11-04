'use client'

// Maliyet-Karlılık Raporu
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { money } from '@/components/panel/definition-page'
import { ReportFrame, DateRangePicker } from '@/components/panel/report-frame'

type Row = { name: string; revenue: number; quantity: number }
type Data = { rows: Row[]; totalRevenue: number; orderCount: number }

export default function MaliyetRaporuPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [range, setRange] = useState({ from: today, to: today })
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<Data>(`/api/reports?type=maliyet&from=${range.from}&to=${range.to}`)
      .then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [range])

  return (
    <ReportFrame
      title="Maliyet-Karlılık Raporu"
      icon="trending_up"
      actions={<DateRangePicker from={range.from} to={range.to} onChange={setRange} />}
    >
      {loading ? (
        <p className="px-5 py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</p>
      ) : !data || data.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-neutral-300">
          <i className="material-icons" style={{ fontSize: 44 }}>trending_up</i>
          <p className="text-[14px] font-medium text-neutral-400">Seçilen tarihte satış bulunamadı!</p>
        </div>
      ) : (
        <div className="scroll-style overflow-auto px-5 pb-4 pt-4">
          <table className="ads-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Kategori</th>
                <th style={{ width: '15%' }}>Adet</th>
                <th style={{ width: '20%' }}>Ciro</th>
                <th style={{ width: '35%' }}>Ciro Payı</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.name} className="hover:bg-[#fafafa]">
                  <td className="text-[13.5px] font-medium text-[#303030]">{r.name}</td>
                  <td>{r.quantity.toLocaleString('tr-TR')}</td>
                  <td className="font-semibold text-[#303030]">{money(r.revenue)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div className="h-full rounded-full bg-[#2e7d32]" style={{ width: `${data.totalRevenue ? (r.revenue / data.totalRevenue) * 100 : 0}%` }} />
                      </div>
                      <span className="text-[12px] text-neutral-400">{data.totalRevenue ? Math.round((r.revenue / data.totalRevenue) * 100) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#fafafa]">
                <td className="font-bold text-[#303030]">TOPLAM</td>
                <td className="font-bold">{data.rows.reduce((s, r) => s + r.quantity, 0).toLocaleString('tr-TR')}</td>
                <td className="font-bold text-[#2e7d32]">{money(data.totalRevenue)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </ReportFrame>
  )
}
