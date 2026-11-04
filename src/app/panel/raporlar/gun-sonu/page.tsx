'use client'

// Gün Sonu Raporu
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { money, dateTr } from '@/components/panel/definition-page'
import { ReportFrame, DateRangePicker } from '@/components/panel/report-frame'

type Row = { date: string; revenue: number; orders: number; masa: number; paket: number; gelal: number }
type Data = { rows: Row[]; totalRevenue: number; orderCount: number }

export default function GunSonuRaporuPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [range, setRange] = useState({ from: today, to: today })
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<Data>(`/api/reports?type=gun-sonu&from=${range.from}&to=${range.to}`)
      .then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [range])

  return (
    <ReportFrame
      title="Gün Sonu Raporu"
      icon="monetization_on"
      actions={<DateRangePicker from={range.from} to={range.to} onChange={setRange} />}
    >
      {loading ? (
        <p className="px-5 py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</p>
      ) : !data || data.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-neutral-300">
          <i className="material-icons" style={{ fontSize: 44 }}>monetization_on</i>
          <p className="text-[14px] font-medium text-neutral-400">Kayıtlı gün sonu bulunamadı!</p>
        </div>
      ) : (
        <div className="scroll-style overflow-auto px-5 pb-4 pt-4">
          <table className="ads-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Masa</th>
                <th>Paket</th>
                <th>Gel-Al</th>
                <th>Sipariş</th>
                <th>Ciro</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.date} className="hover:bg-[#fafafa]">
                  <td className="text-[13.5px] font-medium text-[#303030]">{dateTr(r.date + 'T00:00:00').split(' ')[0]}</td>
                  <td>{r.masa}</td>
                  <td>{r.paket}</td>
                  <td>{r.gelal}</td>
                  <td className="font-semibold">{r.orders}</td>
                  <td className="font-semibold text-[#2e7d32]">{money(r.revenue)}</td>
                </tr>
              ))}
              <tr className="bg-[#fafafa]">
                <td className="font-bold text-[#303030]">TOPLAM</td>
                <td className="font-bold">{data.rows.reduce((s, r) => s + r.masa, 0)}</td>
                <td className="font-bold">{data.rows.reduce((s, r) => s + r.paket, 0)}</td>
                <td className="font-bold">{data.rows.reduce((s, r) => s + r.gelal, 0)}</td>
                <td className="font-bold">{data.orderCount}</td>
                <td className="font-bold text-[#2e7d32]">{money(data.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </ReportFrame>
  )
}
